import bcrypt from "bcryptjs"

const BCRYPT_COST = 12

export async function hashPassword(password: string) {
  // bcryptjs is used instead of native Argon2id to keep the Next.js/Windows setup portable.
  return bcrypt.hash(password, BCRYPT_COST)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export function validatePasswordStrength(password: string) {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters.")
  }

  if (password.length > 256) {
    errors.push("Password must be 256 characters or fewer.")
  }

  if (!/[A-Za-z]/.test(password)) {
    errors.push("Password must include at least one letter.")
  }

  if (!/\d/.test(password)) {
    errors.push("Password must include at least one number.")
  }

  return errors
}
