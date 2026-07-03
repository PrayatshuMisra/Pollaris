// 6-char alphanumeric join code (excludes ambiguous chars).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateJoinCode(len = 6): string {
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) {
    out += ALPHABET[arr[i] % ALPHABET.length];
  }
  return out;
}
