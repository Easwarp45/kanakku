/**
 * Utility for generating and managing invite codes
 */

/**
 * Generate a random 8-character alphanumeric code (uppercase)
 * Format: XXXXXXXX where X is 0-9 or A-Z
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Validate invite code format
 */
export function isValidInviteCode(code: string): boolean {
  if (!code) return false;
  const trimmed = code.trim();
  return /^[A-Z0-9]{8}$/.test(trimmed);
}

/**
 * Format invite code for display/input
 */
export function formatInviteCode(code: string): string {
  return code.trim().toUpperCase();
}
