import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildCompose } from './render-compose.mjs';

const root = new URL('../', import.meta.url);
const id = 'harbor-ci-' + randomUUID();
const folder = new URL('../../.harbor-validation/' + id + '/', root);
await mkdir(folder, { recursive: true });
const filename = fileURLToPath(new URL('compose.json', folder));
const lock = JSON.parse(await readFile(new URL('images.lock.json', root), 'utf8'));
const source = JSON.parse(await readFile(new URL('tools/build-source.json', root), 'utf8'));
const config = buildCompose(lock, source);
config.services['harbor-init'].build.context = fileURLToPath(root);
await writeFile(filename, JSON.stringify(config, null, 2));
const env = { ...process.env, HARBOR_INSTANCE_ID: id, HARBOR_HOSTNAME: 'registry.company.test',
  HARBOR_ADMIN_PASSWORD: 'test-admin-password-with-entropy', HARBOR_DB_PASSWORD: 'test-database-password-with-entropy' };
const composeArgs = ['compose', '-p', id, '-f', filename];
function run(args, capture = false, overrides = {}) {
  const result = spawnSync('docker', [...composeArgs, ...args], {
    env: { ...env, ...overrides }, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit', timeout: 900_000,
  });
  if (result.status !== 0) throw new Error('Docker ' + args.slice(0, 3).join(' ') + ' failed: ' + (result.stderr || result.error || result.status));
  return (result.stdout || '').trim();
}
const workloads = Object.keys(config.services).filter(name => name !== 'harbor-init');
try {
  run(['config', '--quiet']);
  run(['up', '-d', '--build', '--wait', '--wait-timeout', '600']);
  const health = JSON.parse(run(['exec', '-T', 'proxy', 'curl', '-fsS', 'http://localhost:8080/api/v2.0/health'], true));
  assert.equal(health.status, 'healthy');
  const challenge = run(['exec', '-T', 'proxy', 'curl', '-sSI', '-H', 'Host: registry.company.test',
    '-H', 'X-Forwarded-Proto: https', 'http://localhost:8080/v2/'], true);
  assert.match(challenge, /401/);
  assert.match(challenge, /https:\/\/registry\.company\.test\/service\/token/);
  const user = JSON.parse(run(['exec', '-T', 'proxy', 'curl', '-fsS', '-u', 'admin:' + env.HARBOR_ADMIN_PASSWORD,
    'http://localhost:8080/api/v2.0/users/current'], true));
  assert.equal(user.username, 'admin');
  run(['exec', '-T', 'core', 'curl', '-fsS', 'http://trivy-adapter:8080/probe/healthy'], true);
  run(['exec', '-T', 'proxy', 'curl', '-fsS', '-u', 'admin:' + env.HARBOR_ADMIN_PASSWORD,
    '-H', 'Content-Type: application/json', '-d', '{"project_name":"persistence-test","public":false}',
    'http://localhost:8080/api/v2.0/projects'], true);
  const hashes = () => run(['exec', '-T', 'core', 'sha256sum', '/etc/core/key', '/etc/core/private_key.pem'], true);
  const assertPersistent = before => {
    assert.equal(hashes(), before, 'Signing/encryption keys must persist');
    const project = JSON.parse(run(['exec', '-T', 'proxy', 'curl', '-fsS', '-u', 'admin:' + env.HARBOR_ADMIN_PASSWORD,
      'http://localhost:8080/api/v2.0/projects/persistence-test'], true));
    assert.equal(project.name, 'persistence-test', 'Database project must persist');
  };
  const before = hashes();
  const live = spawnSync('docker', [...composeArgs, 'run', '--rm', '--no-deps', 'harbor-init', '--reconfigure'],
    { env, encoding: 'utf8', timeout: 60_000 });
  assert.notEqual(live.status, 0, 'Reconfiguration must refuse live services');
  assert.match(live.stdout + live.stderr, /Stop all Harbor/);
  run(['restart', '--timeout', '20', ...workloads]);
  run(['up', '-d', '--wait', '--wait-timeout', '600']);
  assertPersistent(before);
  run(['up', '-d', '--force-recreate', '--timeout', '20', '--wait', '--wait-timeout', '600']);
  assertPersistent(before);
  run(['stop', '--timeout', '20', ...workloads]);
  run(['run', '--rm', '--no-deps', 'harbor-init', '--reconfigure'], false, { JOB_MAX_WORKERS: '6' });
  run(['up', '-d', '--wait', '--wait-timeout', '600'], false, { JOB_MAX_WORKERS: '6' });
  assertPersistent(before);
  console.log('PASS: prepare, health, admin login, registry token URL, Trivy, restart, redeploy and reconfiguration.');
} catch (error) {
  run(['ps', '-a']);
  run(['logs', '--no-color', '--tail', '35']);
  throw error;
} finally {
  // This file and every explicit volume name belong to this freshly generated CI ID only.
  try { run(['down', '--timeout', '20', '--volumes', '--remove-orphans']); }
  finally { await rm(folder, { recursive: true, force: true }); }
}
