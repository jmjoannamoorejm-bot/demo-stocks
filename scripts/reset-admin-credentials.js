const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const ENV_PATH = path.join(ROOT_DIR, '.env');

function randomPassword(length = 20) {
  const bytes = crypto.randomBytes(length);
  return bytes
    .toString('base64')
    .replace(/[^A-Za-z0-9]/g, '')
    .slice(0, length);
}

function readEnvLines(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing .env file at ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
}

function upsertEnv(lines, key, value) {
  const prefix = `${key}=`;
  const index = lines.findIndex((line) => line.startsWith(prefix));
  const nextLine = `${prefix}${value}`;

  if (index >= 0) {
    lines[index] = nextLine;
  } else {
    lines.push(nextLine);
  }
}

function run() {
  const usernameArg = String(process.argv[2] || '').trim();
  const passwordArg = String(process.argv[3] || '').trim();

  const username = usernameArg || 'admin';
  const password = passwordArg || randomPassword(20);

  const lines = readEnvLines(ENV_PATH);
  upsertEnv(lines, 'ADMIN_USERNAME', username);
  upsertEnv(lines, 'ADMIN_PASSWORD', password);

  fs.writeFileSync(ENV_PATH, `${lines.join('\n')}\n`);

  console.log('Admin credentials updated in .env');
  console.log(`ADMIN_USERNAME=${username}`);
  console.log(`ADMIN_PASSWORD=${password}`);
  console.log('Restart the server for changes to take effect.');
}

try {
  run();
} catch (error) {
  console.error(error.message || 'Failed to reset admin credentials.');
  process.exit(1);
}
