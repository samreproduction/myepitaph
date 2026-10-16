# T5 review (Claude)

Verdict: accepted.

Re-run in cloud on 1ba6e39 (Chromium):
- npm test: 53 passed
- npm run build:test: ok; dist has 12 history ciphertext files, 0 .md, 0 test plaintext strings
- npx playwright test: 34 passed (incl. 4 new history tests)
- Screenshots: desktop + phone of gap, object history, epitaph history.

Code notes:
- copy-content.mjs uses execFileSync (no shell), --literal-pathspecs, skips deletion commits, serial history names. Outside git it degrades to {} / [].
- History decrypts on demand; stale results guarded by attempt counter.
- github.ts: undecryptable remote now reports 「無法用目前密碼解開線上版本，未寫入」.

Accepted leftovers:
- Published history grows with every commit (fine at this scale).
- Deleted objects have no history (per spec).
- web/scripts/check-history-build.mjs is an extra helper the ticket did not ask for; harmless.
- In-session edits do not append to history until the next Pages build.
- dispatch.ps1 reported exit=1 from opencode itself although all checks passed; trust receipt + re-run over exit=.
