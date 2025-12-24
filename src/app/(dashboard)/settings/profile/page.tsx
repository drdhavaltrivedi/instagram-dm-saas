'use client';

import { useState, useEffect, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Upload,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { getOrCreateUserWorkspaceId } from "@/lib/supabase/user-workspace-client";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    timezone: "America/New_York",
    bio: "",
    name: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Ensure workspace exists and set auth
      const workspaceId = await getOrCreateUserWorkspaceId();
      if (!workspaceId) {
        throw new Error("Failed to get workspace");
      }

      // Get current user for auth headers
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error("Not authenticated");
      }

      // Get user from database
      const { data: user } = await supabase
        .from("users")
        .select("id, email, name, first_name, last_name, phone, timezone, bio")
        .eq("supabase_auth_id", authUser.id)
        .single();

      if (user) {
        // Set auth for API client
        api.setAuth(workspaceId, user.id);

        // Fetch profile from API
        const profile = await api.getUserProfile();

        setFormData({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          timezone: profile.timezone || "America/New_York",
          bio: profile.bio || "",
          name: profile.name || "",
        });
        setAvatarUrl(profile.avatarUrl || null);
      }
    } catch (err: any) {
      console.error("Failed to load profile:", err);
      setError(err.message || "Failed to load profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSaving(true);
      setSaveStatus("idle");
      setError(null);

      // Validate bio length (if provided, must be between 10-500 characters)
      if (formData.bio && formData.bio.length > 0) {
        if (formData.bio.length < 10) {
          setError("Bio must be at least 10 characters long");
          setSaveStatus("error");
          setIsSaving(false);
          return;
        }
        if (formData.bio.length > 500) {
          setError("Bio must be no more than 500 characters");
          setSaveStatus("error");
          setIsSaving(false);
          return;
        }
      }

      // Ensure workspace exists
      const workspaceId = await getOrCreateUserWorkspaceId();
      if (!workspaceId) {
        throw new Error("Failed to get workspace");
      }

      // Get current user for auth headers
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error("Not authenticated");
      }

      // Get user from database
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("supabase_auth_id", authUser.id)
        .single();

      if (!user) {
        throw new Error("User not found");
      }

      // Set auth for API client
      api.setAuth(workspaceId, user.id);

      // Update profile
      await api.updateUserProfile({
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
        timezone: formData.timezone || "America/New_York",
        bio: formData.bio || undefined,
        name:
          formData.name ||
          `${formData.firstName} ${formData.lastName}`.trim() ||
          undefined,
        avatarUrl: avatarUrl || undefined,
      });

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Failed to save profile:", err);
      setError(err.message || "Failed to save profile");
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (formData.firstName && formData.lastName) {
      return `${formData.firstName[0]}${formData.lastName[0]}`.toUpperCase();
    }
    if (formData.name) {
      const parts = formData.name.split(" ");
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return formData.name[0].toUpperCase();
    }
    if (formData.email) {
      return formData.email[0].toUpperCase();
    }
    return "U";
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    try {
      setIsUploadingAvatar(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error("Not authenticated");
      }

      // Get user from database to get user ID
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("supabase_auth_id", authUser.id)
        .single();

      if (!user) {
        throw new Error("User not found");
      }

      // Create a unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = fileName;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        // Check if bucket doesn't exist
        if (
          uploadError.message?.includes("Bucket") ||
          uploadError.message?.includes("bucket")
        ) {
          throw new Error(
            'Storage bucket not configured. Please contact support or set up Supabase Storage bucket named "avatars".'
          );
        }
        throw new Error(
          uploadError.message || "Failed to upload image. Please try again."
        );
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      // Update avatar URL in database
      const workspaceId = await getOrCreateUserWorkspaceId();
      if (!workspaceId) {
        throw new Error("Failed to get workspace");
      }

      api.setAuth(workspaceId, user.id);
      await api.updateUserProfile({ avatarUrl: publicUrl });

      setAvatarUrl(publicUrl);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Failed to upload avatar:", err);
      setError(err.message || "Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsRemovingAvatar(true);
      setError(null);
      const workspaceId = await getOrCreateUserWorkspaceId();
      if (!workspaceId) {
        throw new Error("Failed to get workspace");
      }

      const supabase = createClient();
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        throw new Error("Not authenticated");
      }

      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("supabase_auth_id", authUser.id)
        .single();

      if (!user) {
        throw new Error("User not found");
      }

      api.setAuth(workspaceId, user.id);
      await api.updateUserProfile({ avatarUrl: null });

      setAvatarUrl(null);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err: any) {
      console.error("Failed to remove avatar:", err);
      setError(err.message || "Failed to remove avatar");
    } finally {
      setIsRemovingAvatar(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, spaces, +, -, and parentheses
    const value = e.target.value.replace(/[^0-9+\-() ]/g, "");
    setFormData({ ...formData, phone: value });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          <span className="ml-3 text-zinc-400">Loading profile...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Profile Settings</h1>
        <p className="text-zinc-400">Update your personal information</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {saveStatus === "success" && (
        <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-green-400">
          <CheckCircle2 className="h-5 w-5" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-2xl font-bold text-white overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile avatar"
                  fill
                  className="object-cover"
                  onError={() => setAvatarUrl(null)}
                />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploadingAvatar || isRemovingAvatar}
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Change Avatar
                    </>
                  )}
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar || isRemovingAvatar}
                    className={`px-4 py-2 rounded-lg bg-zinc-800 text-zinc-300 transition-colors text-sm font-medium flex items-center gap-2
                      ${
                        isRemovingAvatar
                          ? "opacity-100 cursor-wait"
                          : "hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      }
                    `}>
                    {isRemovingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                        <span>Removing...</span>
                      </>
                    ) : (
                      <>
                        <X className="h-4 w-4" />
                        Remove
                      </>
                    )}
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                JPG, PNG or GIF. Max size 5MB
              </p>
            </div>
          </div>
        </div>

        {/* Personal Info */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">
            Personal Information
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                First Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 50);
                    setFormData({ ...formData, firstName: value });
                  }}
                  maxLength={50}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                  placeholder="First name"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => {
                  const value = e.target.value.slice(0, 50);
                  setFormData({ ...formData, lastName: value });
                }}
                maxLength={50}
                className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                type="email"
                value={formData.email}
                disabled
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800/50 border border-zinc-700 text-zinc-400 cursor-not-allowed"
              />
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              Email cannot be changed
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 pointer-events-none" />
              <input
                type="tel"
                value={formData.phone}
                onChange={handlePhoneChange}
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors"
                placeholder="+1 (555) 123-4567"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">
              Timezone
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <select
                value={formData.timezone}
                onChange={(e) =>
                  setFormData({ ...formData, timezone: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors appearance-none">
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Asia/Kolkata">India (IST)</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-zinc-400">
                Bio
              </label>
              <span
                className={`text-xs ${
                  formData.bio.length > 500
                    ? "text-red-400"
                    : formData.bio.length > 0 && formData.bio.length < 10
                    ? "text-yellow-400"
                    : "text-zinc-500"
                }`}>
                {formData.bio.length} / 500
                {formData.bio.length > 0 &&
                  formData.bio.length < 10 &&
                  " (min 10 characters)"}
              </span>
            </div>
            <textarea
              value={formData.bio}
              onChange={(e) => {
                const value = e.target.value.slice(0, 500);
                setFormData({ ...formData, bio: value });
              }}
              minLength={10}
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder-zinc-500 focus:border-pink-500 focus:ring-1 focus:ring-pink-500 outline-none transition-colors resize-none"
              placeholder="Tell us about yourself... (minimum 10 characters)"
            />
            {formData.bio.length > 0 && formData.bio.length < 10 && (
              <p className="mt-1 text-xs text-yellow-400">
                Bio must be at least 10 characters long
              </p>
            )}
            {formData.bio.length >= 500 && (
              <p className="mt-1 text-xs text-red-400">
                Maximum 500 characters reached
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 text-white font-medium hover:from-pink-600 hover:to-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
