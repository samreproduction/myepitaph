// Shared by the local CLI (Node 22+) and the browser.
// Only Web Crypto is used, so the same file runs in both places.
//
// Envelope format (stored in repo as *.enc.json):
//   { "v": 1, "kdf": "PBKDF2-SHA256", "iter": 600000,
//     "salt": "<b64>", "iv": "<b64>", "ct": "<b64>" }
// AES-256-GCM. The key is derived from the site password with PBKDF2.

const ITER = 600000;
const enc = new TextEncoder();
const dec = new TextDecoder();

const b64 = (bytes) => btoa(String.fromCharCode(...bytes));
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function deriveKey(password, salt, iter) {
  const base = await crypto.subtle.importKey(
    "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: iter, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function seal(plainText, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITER);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(plainText))
  );
  return { v: 1, kdf: "PBKDF2-SHA256", iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) };
}

// Throws if the password is wrong or the data was altered (GCM tag check).
export async function open(envelope, password) {
  if (envelope.v !== 1) throw new Error("unsupported envelope version");
  const key = await deriveKey(password, unb64(envelope.salt), envelope.iter);
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: unb64(envelope.iv) }, key, unb64(envelope.ct)
  );
  return dec.decode(pt);
}
