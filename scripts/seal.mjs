#!/usr/bin/env node
// Local CLI. Plaintext never goes into the repo.
//
//   BLACKTOMB_PASSWORD='...' node scripts/seal.mjs seal  <plain-dir> objects/
//   BLACKTOMB_PASSWORD='...' node scripts/seal.mjs open  objects/ <out-dir>
//
// <plain-dir> is your local unencrypted copy (Q28), e.g. ~/blacktomb-plain/
// Each foo.md becomes foo.md.enc.json. epitaph.md is handled the same way.

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join, basename } from "node:path";
import { seal, open } from "../src/crypto.mjs";

const [mode, src, dst] = process.argv.slice(2);
const pw = process.env.BLACKTOMB_PASSWORD;

if (!pw || !mode || !src || !dst) {
  console.error("usage: BLACKTOMB_PASSWORD=... node scripts/seal.mjs seal|open <src> <dst>");
  process.exit(1);
}

await mkdir(dst, { recursive: true });

if (mode === "seal") {
  for (const f of (await readdir(src)).filter((f) => f.endsWith(".md"))) {
    const env = await seal(await readFile(join(src, f), "utf8"), pw);
    await writeFile(join(dst, f + ".enc.json"), JSON.stringify(env, null, 2) + "\n");
    console.log("sealed", f);
  }
} else if (mode === "open") {
  for (const f of (await readdir(src)).filter((f) => f.endsWith(".enc.json"))) {
    const env = JSON.parse(await readFile(join(src, f), "utf8"));
    const text = await open(env, pw); // throws on wrong password
    await writeFile(join(dst, basename(f, ".enc.json")), text);
    console.log("opened", f);
  }
} else {
  console.error("mode must be seal or open");
  process.exit(1);
}
