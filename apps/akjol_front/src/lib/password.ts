import bcrypt from "bcryptjs";

const COST = 10;

/** Hash un mot de passe en clair. Coût bcrypt = 10 (équilibre prod/dev OK). */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, COST);
}

/** Vérifie un mot de passe en clair contre un hash bcrypt. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Politique mot de passe minimale — pas trop restrictive pour ne pas
 * frustrer la cible 15-22 ans, mais suffisante pour bloquer les pires.
 */
export function passwordPolicyError(plain: string): string | null {
  if (plain.length < 8) return "Le mot de passe doit faire au moins 8 caractères.";
  if (plain.length > 128) return "Mot de passe trop long (128 caractères max).";
  return null;
}
