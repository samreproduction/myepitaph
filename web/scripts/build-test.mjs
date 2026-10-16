import { spawnSync } from 'node:child_process';

const fixture = spawnSync(process.execPath, ['scripts/make-history-fixture.mjs'], { stdio: 'inherit' });
if (fixture.error) throw fixture.error;
if (fixture.status !== 0) process.exit(fixture.status ?? 1);
const result = spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, CONTENT_ROOT: 'tests/.history-repo' },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
