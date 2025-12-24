/**
 * Validation functions for waiting list form
 */

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateInstagramId(instagramId: string): boolean {
  // Instagram usernames can contain letters, numbers, periods, and underscores
  // Must be between 1-30 characters
  const instagramRegex = /^[a-zA-Z0-9._]{1,30}$/;
  return instagramRegex.test(instagramId);
}

