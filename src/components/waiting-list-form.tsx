'use client';

import { useState } from 'react';
import { Instagram, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

interface WaitingListFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WaitingListForm({ open, onOpenChange }: WaitingListFormProps) {
  const [instagramId, setInstagramId] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateInstagramId = (id: string) => {
    // Instagram usernames can contain letters, numbers, periods, and underscores
    // Must be between 1-30 characters
    const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/;
    return instagramRegex.test(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate that at least one field is filled
    if (!instagramId.trim() && !email.trim()) {
      setError('Please enter either an Instagram ID or Email address');
      return;
    }

    // Validate email format if provided
    if (email.trim() && !validateEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    // Validate Instagram ID format if provided
    if (instagramId.trim() && !validateInstagramId(instagramId.trim())) {
      setError('Please enter a valid Instagram ID (letters, numbers, dots, and underscores only)');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/waiting-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim() || null,
          instagram_id: instagramId.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join waiting list');
      }

      setSuccess(true);
      setInstagramId('');
      setEmail('');

      // Close dialog after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onOpenChange(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setInstagramId('');
      setEmail('');
      setError(null);
      setSuccess(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose} title="Join Waiting List">
      <form onSubmit={handleSubmit} className="space-y-4">
        {success ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Successfully Joined!
            </h3>
            <p className="text-foreground-muted">
              We'll notify you when Socialora is ready.
            </p>
          </div>
        ) : (
          <>
            <div>
              <p className="text-sm text-foreground-muted mb-4">
                Enter your Instagram ID or Email address to join our waiting list. We'll notify you when Socialora is ready!
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Input
                  label="Instagram ID"
                  type="text"
                  placeholder="your_instagram_handle"
                  value={instagramId}
                  onChange={(e) => setInstagramId(e.target.value)}
                  leftIcon={<Instagram className="h-4 w-4" />}
                  disabled={isSubmitting}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background-elevated px-2 text-foreground-muted">Or</span>
                </div>
              </div>

              <div>
                <Input
                  label="Email Address"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="h-4 w-4" />}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
                <AlertCircle className="h-4 w-4 text-error flex-shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (!instagramId.trim() && !email.trim())}
                isLoading={isSubmitting}
                className="flex-1"
              >
                Join Waiting List
              </Button>
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
}

