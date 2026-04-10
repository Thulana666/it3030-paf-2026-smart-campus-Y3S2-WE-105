/**
 * Shared validation utilities for auth and admin forms.
 */

export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Please enter a valid email address.';
  return null;
};

export const validateName = (name) => {
  if (!name || !name.trim()) return 'Full name is required.';
  if (name.trim().length < 2) return 'Name must be at least 2 characters.';
  if (/[^a-zA-Z\s'\-]/.test(name)) return 'Name must only contain letters, spaces, hyphens, or apostrophes.';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
};

export const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = [
    { label: 'Very Weak', color: '#ef4444' },
    { label: 'Weak',      color: '#f97316' },
    { label: 'Fair',      color: '#eab308' },
    { label: 'Good',      color: '#22c55e' },
    { label: 'Strong',    color: '#10b981' },
  ];
  return { score, ...levels[Math.min(score, 4)] };
};

export const getPasswordRequirements = (password) => [
  { label: 'At least 6 characters',       met: password.length >= 6 },
  { label: 'At least one uppercase letter', met: /[A-Z]/.test(password) },
  { label: 'At least one number',          met: /[0-9]/.test(password) },
  { label: 'At least one special character (!@#$…)', met: /[^A-Za-z0-9]/.test(password) },
];
