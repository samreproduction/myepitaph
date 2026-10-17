# T7 review (Claude)

Verdict: accepted, with fixes made during review.

Found in review (cloud Chromium, measured by polling aria-valuenow and [data-laid]):
- Stones lagged real progress badly: decryption finished at ~1.1s but the last stone landed at ~2.7s and the cemetery appeared at ~3.5s, so the loader added ~2.4s to every unlock. Cause: fixed normal-speed playback with a 4-frame stagger.
- A stone that started after a pause popped in half-fallen: stagger (4 frames) was shorter than the fall (8 frames), so the pause frame was already inside the next stone's fall window.

Review fixes (web/src/TombLoader.tsx):
- Stagger equals fall length (6 frames); the next stone starts exactly at the pause frame.
- Player playbackRate adapts to the lag: catch up to the current target within ~6 frames, and finish the rest (stones, carving, hold, fade) within ~24 frames once all files are open; capped at Remotion's max of 10. Measured after the fix: done at ~0.9s, cemetery at ~1.8s (cap 900ms extra holds); with 400ms network delay the stones track each file.
- Unlaid stone outline opacity .14 → .22; at 1x it was nearly invisible, and it is the progress track.

Re-run in cloud after fixes:
- tsc --noEmit clean; npm test 55 passed; npx playwright test (Chromium) 39 passed, three consecutive runs (gzip main JS 187765 bytes, +1073).
- loader.spec.ts: dropped the separate "15 laid" poll right before the cemetery check; with the faster finish it raced the fade and failed 1 in 3. The MutationObserver samples still assert the last value is 15 and never decreases. loader.spec.ts passed 15/15 with --repeat-each=5.
- Screenshots: /mnt/project-files/screenshots/T7/after (desktop 1440×900, phone 390×844 at 1/10, 4/10, 7/10, 9/10, carved, entered).

Receipt 存疑項:
1. 900ms cap: fixed as above.
2. total counts only valid filenames: correct, invalid ones are never decrypted.
3. No lock button while loading: accepted; nothing is unlocked yet, and the attempt guard is kept.
4. Existing build warnings: unchanged, out of scope.
