export function formatTimestamp(date: Date | number): string {
  const d = typeof date === "number" ? new Date(date) : date;
  return d.toISOString();
}

export function displayName(user: {
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}): string {
  if (user.firstName || user.lastName) {
    return [user.firstName, user.lastName].filter(Boolean).join(" ");
  }
  return user.email ?? "Anonyme";
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
