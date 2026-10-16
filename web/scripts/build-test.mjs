import { spawnSync } from 'node:child_process';

const result = spawnSync(process.execPath, [process.env.npm_execpath, 'run', 'build'], {
  stdio: 'inherit',
  env: { ...process.env, CONTENT_ROOT: 'tests/content' },
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
