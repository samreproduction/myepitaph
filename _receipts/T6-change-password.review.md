# T6 review (Claude)

Verdict: accepted, with two small fixes made during review.

Re-run in cloud on c4772db (+ review fixes):
- node test/roundtrip.mjs, node test/rekey.mjs: pass
- Interactive rekey driven through a pty: prompts show, input not echoed, file re-sealed and opens with the new password
- npm test: 53 passed; npx playwright test (Chromium): 36 passed
- Screenshots: desktop + phone, old-password prompt and version opened with old password

Review fixes:
- rekey.mjs rename-phase failure message and README now give the recovery step (git checkout -- objects epitaph.md.enc.json) since renames are not transactional.
- History old-password input was an unstyled white box; styled to match the dark editor inputs.

Accepted leftovers:
- Renames are one by one; git is the rollback.
- App.tsx/Editor.tsx unchanged: stale remembered password and stale sealed token were already handled; tests added.
