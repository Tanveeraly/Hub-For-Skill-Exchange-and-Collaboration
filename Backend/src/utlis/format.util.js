
export function formatName(value) {
  if (!value) return value;

  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}