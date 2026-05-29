export function validatePassword(password) {
  const specialCharacters = /[!@#$%^&*()<>?/|~:]/;
  if (!password || password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one capital letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  if (!specialCharacters.test(password)) return 'Password must contain at least one special character.';
  return null;
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ? null
    : 'Please enter a valid email address.';
}
