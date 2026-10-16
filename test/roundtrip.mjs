// Fake content only. Checks seal -> open, wrong password, and tamper detection.
import { seal, open } from "../src/crypto.mjs";

const pw = "test-password-not-real";
const plain = "# 測試\n\n這是假的想法，只用於驗證流程。";

const env = await seal(plain, pw);
const back = await open(env, pw);
if (back !== plain) throw new Error("round-trip mismatch");

let wrongRejected = false;
try { await open(env, "wrong"); } catch { wrongRejected = true; }
if (!wrongRejected) throw new Error("wrong password was accepted");

const tampered = { ...env, ct: env.ct.slice(0, -4) + "AAAA" };
let tamperRejected = false;
try { await open(tampered, pw); } catch { tamperRejected = true; }
if (!tamperRejected) throw new Error("tampered ciphertext was accepted");

console.log("ok: round-trip, wrong password, and tamper detection all pass");
