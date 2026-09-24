export const AGENT_SPECIALTIES = ["HDB", "Condo", "Landed"];

export function normalizeSingaporePhone(phone) {
  const digits = phone.trim().replace(/\s/g, "").replace(/^\+65/, "");
  return `+65 ${digits.slice(0, 4)} ${digits.slice(4)}`;
}