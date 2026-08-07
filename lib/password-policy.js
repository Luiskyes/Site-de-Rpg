export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

export function validatePassword(password) {
  const value = String(password || "");

  if (value.length < MIN_PASSWORD_LENGTH) {
    return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`;
  }

  if (value.length > MAX_PASSWORD_LENGTH) {
    return `A senha deve ter no máximo ${MAX_PASSWORD_LENGTH} caracteres.`;
  }

  if (!/[A-Za-zÀ-ÖØ-öø-ÿ]/.test(value) || !/\d/.test(value)) {
    return "Use pelo menos uma letra e um número na senha.";
  }

  return "";
}
