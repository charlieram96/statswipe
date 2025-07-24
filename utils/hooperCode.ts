/**
 * Generates a unique 6-character hooper code
 * Format: XXNNXX where X is uppercase letter and N is number
 * Example: AB12CD
 */
export function generateHooperCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  
  // Generate pattern: letter-letter-number-number-letter-letter
  let code = '';
  code += letters[Math.floor(Math.random() * letters.length)];
  code += letters[Math.floor(Math.random() * letters.length)];
  code += numbers[Math.floor(Math.random() * numbers.length)];
  code += numbers[Math.floor(Math.random() * numbers.length)];
  code += letters[Math.floor(Math.random() * letters.length)];
  code += letters[Math.floor(Math.random() * letters.length)];
  
  return code;
}

/**
 * Validates a hooper code format
 */
export function isValidHooperCode(code: string): boolean {
  // Must be exactly 6 characters, uppercase letters and numbers only
  return /^[A-Z0-9]{6}$/.test(code);
}

/**
 * Formats a hooper code for display (adds dash in middle)
 * Example: ABC123 -> ABC-123
 */
export function formatHooperCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)}${code.slice(3)}`;
}