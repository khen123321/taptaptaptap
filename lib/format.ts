export function formatPhp(value: number) {
  return `₱${Number(value).toLocaleString("en-PH")}`;
}
