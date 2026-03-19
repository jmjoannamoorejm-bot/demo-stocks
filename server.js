const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf-8').split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = String(line || '').trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separator = trimmed.indexOf('=');
    if (separator <= 0) return;

    const key = trimmed.slice(0, separator).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return;

    let value = trimmed.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (typeof process.env[key] === 'undefined') {
      process.env[key] = value;
    }
  });
}

loadEnvFile(path.join(__dirname, '.env'));

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_DB_PATH = path.join(__dirname, 'data', 'db.json');
const DB_PATH = path.resolve(process.env.DB_PATH || DEFAULT_DB_PATH);
const DB_PATH_IS_DEFAULT = path.resolve(DB_PATH) === path.resolve(DEFAULT_DB_PATH);
const DEFAULT_ASSET_SYMBOL = 'USDT';
const DEFAULT_ENABLED_NETWORKS = ['ERC20', 'TRC20', 'BEP20'];
const SUPPORTED_KYC_ID_TYPES = ['passport', 'national_id', 'drivers_license', 'residence_permit'];
const EMAIL_CODE_TTL_MINUTES = 15;
const EMAIL_CODE_RESEND_SECONDS = 60;
const EMAIL_CODE_MAX_ATTEMPTS = 5;
const WITHDRAWAL_CODE_TTL_MINUTES = 10;
const WITHDRAWAL_CODE_RESEND_SECONDS = 60;
const WITHDRAWAL_CODE_MAX_ATTEMPTS = 5;
const SUPPORT_MESSAGE_MAX_LENGTH = 1500;
const ADMIN_DEFAULT_KEY = 'demo-admin-key';
const ADMIN_DEFAULT_USERNAME = 'admin';
const ADMIN_SESSION_TTL_HOURS = Number.isFinite(Number(process.env.ADMIN_SESSION_TTL_HOURS))
  ? Math.max(1, Number(process.env.ADMIN_SESSION_TTL_HOURS))
  : 12;
const USER_SESSION_TTL_HOURS = Number.isFinite(Number(process.env.USER_SESSION_TTL_HOURS))
  ? Math.max(1, Number(process.env.USER_SESSION_TTL_HOURS))
  : 24;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const plans = [
  {
    id: 'basic',
    name: 'Basic',
    min: 5000,
    max: 9999,
    durationHours: 24,
    returnPercent: 3,
    details: [
      'Min: $5,000',
      'Max: $9,999',
      'Duration: 24 Hours',
      'Referral Bonus',
      'Multiple Investments Allowed',
      '24/7 Customer Care',
    ],
  },
  {
    id: 'silver',
    name: 'Silver',
    min: 10000,
    max: 19999,
    durationHours: 72,
    returnPercent: 4.5,
    details: [
      'Min: $10,000',
      'Max: $19,999',
      'Duration: 72 Hours',
      'Referral Bonus',
      'Multiple Investments Allowed',
      '24/7 Customer Care',
    ],
  },
  {
    id: 'gold',
    name: 'Gold',
    min: 10000,
    max: 49999,
    durationHours: 168,
    returnPercent: 6,
    details: [
      'Min: $10,000',
      'Max: $49,999',
      'Duration: 7 Days',
      'Referral Bonus',
      'Multiple Investments Allowed',
      '24/7 Customer Care',
    ],
  },
  {
    id: 'platinum',
    name: 'Platinum',
    min: 50000,
    max: 100000,
    durationHours: 336,
    returnPercent: 8,
    details: [
      'Min: $50,000',
      'Max: $100,000',
      'Duration: 14 Days',
      'Referral Bonus',
      'Multiple Investments Allowed',
      '24/7 Customer Care',
    ],
  },
];

const routeMap = {
  '/': 'public/index.html',
  '/index.php': 'public/index.html',
  '/about': 'public/about/index.html',
  '/about/': 'public/about/index.html',
  '/about/index.php': 'public/about/index.html',
  '/faq': 'public/faq/index.html',
  '/faq/': 'public/faq/index.html',
  '/faq/index.php': 'public/faq/index.html',
  '/contact': 'public/contact/index.html',
  '/contact/': 'public/contact/index.html',
  '/contact/index.php': 'public/contact/index.html',
  '/privacy-policy': 'public/privacy-policy/index.html',
  '/privacy-policy/': 'public/privacy-policy/index.html',
  '/privacy-policy/index.php': 'public/privacy-policy/index.html',
  '/appaccount/login': 'public/appaccount/login/index.html',
  '/appaccount/login/': 'public/appaccount/login/index.html',
  '/appaccount/register': 'public/appaccount/register/index.html',
  '/appaccount/register/': 'public/appaccount/register/index.html',
  '/dashboard': 'public/dashboard/index.html',
  '/dashboard/': 'public/dashboard/index.html',
  '/admin/wallet-settings': 'public/admin/wallet-settings/index.html',
  '/admin/wallet-settings/': 'public/admin/wallet-settings/index.html',
};

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

function nowIso() {
  return new Date().toISOString();
}

function futureIsoFrom(baseIsoOrDate, ttlHours) {
  const baseMs =
    baseIsoOrDate && Number.isFinite(new Date(baseIsoOrDate).getTime())
      ? new Date(baseIsoOrDate).getTime()
      : Date.now();
  return new Date(baseMs + ttlHours * 60 * 60 * 1000).toISOString();
}

function buildCookie(name, value, options = {}) {
  const parts = [
    `${name}=${encodeURIComponent(String(value || ''))}`,
    'HttpOnly',
    'Path=/',
    'SameSite=Lax',
  ];

  if (IS_PRODUCTION) {
    parts.push('Secure');
  }

  if (Number.isFinite(options.maxAgeSeconds)) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(options.maxAgeSeconds))}`);
  }

  return parts.join('; ');
}

function normalizeNetworkName(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^A-Za-z0-9 ._()/-]/g, '')
    .slice(0, 48);
}

function networkKey(value) {
  return normalizeNetworkName(value).toLowerCase();
}

function sanitizeAssetSymbol(value) {
  const candidate = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9._-]/g, '');
  return candidate.slice(0, 16);
}

function sanitizeEnabledNetworks(input, fallback = []) {
  const source = Array.isArray(input)
    ? input
    : String(input || '')
        .split(/[,\n]/)
        .map((item) => item.trim());

  const deduped = [];
  const seen = new Set();

  source.forEach((item) => {
    const normalized = normalizeNetworkName(item);
    const key = networkKey(normalized);
    if (!normalized || !key || seen.has(key)) return;
    seen.add(key);
    deduped.push(normalized);
  });

  if (deduped.length) return deduped;

  const fallbackValues = Array.isArray(fallback) ? fallback : [];
  return fallbackValues
    .map((item) => normalizeNetworkName(item))
    .filter(Boolean)
    .filter((item, index, array) => array.findIndex((value) => networkKey(value) === networkKey(item)) === index);
}

function walletCipherKey() {
  const source =
    process.env.WALLET_ENCRYPTION_KEY || 'local-dev-wallet-encryption-key-change-for-production';
  return crypto.createHash('sha256').update(source).digest();
}

function encryptText(plainText) {
  const value = String(plainText || '');
  if (!value) return '';

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', walletCipherKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

function decryptText(cipherText) {
  const value = String(cipherText || '');
  if (!value) return '';

  const parts = value.split(':');
  if (parts.length !== 3) return '';

  try {
    const [ivHex, tagHex, payloadHex] = parts;
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      walletCipherKey(),
      Buffer.from(ivHex, 'hex'),
    );
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payloadHex, 'hex')),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  } catch {
    return '';
  }
}

function ensureDbShape(db) {
  if (!Array.isArray(db.users)) db.users = [];
  if (!db.sessions || typeof db.sessions !== 'object') db.sessions = {};
  if (!db.adminSessions || typeof db.adminSessions !== 'object') db.adminSessions = {};
  if (!Array.isArray(db.investments)) db.investments = [];
  if (!Array.isArray(db.withdrawals)) db.withdrawals = [];
  if (!Array.isArray(db.deposits)) db.deposits = [];
  if (!Array.isArray(db.cryptoPaymentRequests)) db.cryptoPaymentRequests = [];
  if (!Array.isArray(db.supportMessages)) db.supportMessages = [];
  if (!Array.isArray(db.auditLogs)) db.auditLogs = [];
  if (!Array.isArray(db.notifications)) db.notifications = [];
  if (!db.config || typeof db.config !== 'object') db.config = {};
  if (!db.config.system || typeof db.config.system !== 'object') db.config.system = {};
  if (typeof db.config.system.depositsEnabled !== 'boolean') db.config.system.depositsEnabled = true;
  if (typeof db.config.system.investmentsEnabled !== 'boolean') db.config.system.investmentsEnabled = true;
  if (typeof db.config.system.withdrawalsEnabled !== 'boolean') db.config.system.withdrawalsEnabled = true;
  if (typeof db.config.system.walletPaymentsEnabled !== 'boolean') db.config.system.walletPaymentsEnabled = true;
  if (!db.config.crypto || typeof db.config.crypto !== 'object') {
    db.config.crypto = {};
  }
  if (typeof db.config.crypto.assetSymbol !== 'string') {
    db.config.crypto.assetSymbol = DEFAULT_ASSET_SYMBOL;
  }
  db.config.crypto.assetSymbol = sanitizeAssetSymbol(db.config.crypto.assetSymbol) || DEFAULT_ASSET_SYMBOL;

  db.config.crypto.enabledNetworks = sanitizeEnabledNetworks(
    db.config.crypto.enabledNetworks,
    DEFAULT_ENABLED_NETWORKS,
  );

  const normalizedDefaultNetwork = normalizeNetworkName(db.config.crypto.defaultNetwork);
  if (!normalizedDefaultNetwork) {
    db.config.crypto.defaultNetwork = db.config.crypto.enabledNetworks[0] || DEFAULT_ENABLED_NETWORKS[0];
  } else {
    const matchingDefault = db.config.crypto.enabledNetworks.find(
      (network) => networkKey(network) === networkKey(normalizedDefaultNetwork),
    );
    if (matchingDefault) {
      db.config.crypto.defaultNetwork = matchingDefault;
    } else {
      db.config.crypto.defaultNetwork = normalizedDefaultNetwork;
      db.config.crypto.enabledNetworks = sanitizeEnabledNetworks(
        [normalizedDefaultNetwork, ...db.config.crypto.enabledNetworks],
        DEFAULT_ENABLED_NETWORKS,
      );
    }
  }

  if (typeof db.config.crypto.walletAddressEnc !== 'string') {
    db.config.crypto.walletAddressEnc = '';
  }

  db.supportMessages.forEach((message) => {
    if (!message || typeof message !== 'object') return;
    if (!message.id) message.id = randomId('sup');
    if (typeof message.userId !== 'string') message.userId = '';
    if (typeof message.senderRole !== 'string') message.senderRole = 'system';
    if (!['user', 'admin', 'system'].includes(message.senderRole)) {
      message.senderRole = 'system';
    }
    if (typeof message.senderName !== 'string' || !message.senderName.trim()) {
      message.senderName = message.senderRole === 'user' ? 'Client' : 'Support Team';
    }
    if (typeof message.message !== 'string') message.message = '';
    if (typeof message.category !== 'string' || !message.category.trim()) {
      message.category = 'chat';
    }
    if (!message.createdAt) message.createdAt = nowIso();
    if (typeof message.readByUser !== 'boolean') {
      message.readByUser = message.senderRole === 'user';
    }
    if (typeof message.readByAdmin !== 'boolean') {
      message.readByAdmin = message.senderRole !== 'user';
    }
    if (!message.metadata || typeof message.metadata !== 'object') {
      message.metadata = {};
    }
  });

  Object.keys(db.sessions).forEach((token) => {
    const session = db.sessions[token];
    if (!session || typeof session !== 'object') {
      delete db.sessions[token];
      return;
    }

    if (typeof session.userId !== 'string' || !session.userId) {
      delete db.sessions[token];
      return;
    }

    if (!session.createdAt) {
      session.createdAt = nowIso();
    }

    if (!session.expiresAt) {
      session.expiresAt = futureIsoFrom(session.createdAt, USER_SESSION_TTL_HOURS);
    }
  });

  Object.keys(db.adminSessions).forEach((token) => {
    const session = db.adminSessions[token];
    if (!session || typeof session !== 'object') {
      delete db.adminSessions[token];
      return;
    }
    if (typeof session.actor !== 'string') session.actor = ADMIN_DEFAULT_USERNAME;
    if (!session.createdAt) session.createdAt = nowIso();
    if (!session.expiresAt) {
      session.expiresAt = futureIsoFrom(session.createdAt, ADMIN_SESSION_TTL_HOURS);
    }
  });

  db.users.forEach((user) => {
    if (!Number.isFinite(user.balance)) user.balance = 0;
    user.kpiOverrides = normalizeKpiOverrides(user.kpiOverrides);

    if (!user.withdrawalAccess || typeof user.withdrawalAccess !== 'object') {
      user.withdrawalAccess = {
        status: 'locked',
        reason: 'KYC review required before withdrawals.',
        requestedAt: null,
        reviewedAt: null,
      };
      return;
    }

    if (!['locked', 'pending_review', 'approved', 'rejected'].includes(user.withdrawalAccess.status)) {
      user.withdrawalAccess.status = 'locked';
    }

    if (typeof user.withdrawalAccess.reason !== 'string') {
      user.withdrawalAccess.reason = 'KYC review required before withdrawals.';
    } else {
      user.withdrawalAccess.reason = user.withdrawalAccess.reason
        .replace(/KYC and risk review/gi, 'KYC review')
        .replace(/risk review/gi, 'KYC review');
    }
    if (!user.withdrawalAccess.requestedAt) user.withdrawalAccess.requestedAt = null;
    if (!user.withdrawalAccess.reviewedAt) user.withdrawalAccess.reviewedAt = null;

    if (!user.emailVerification || typeof user.emailVerification !== 'object') {
      user.emailVerification = {
        verified: false,
        codeHash: '',
        codeExpiresAt: null,
        lastSentAt: null,
        verifiedAt: null,
        attempts: 0,
        devLastCode: '',
      };
    } else {
      if (typeof user.emailVerification.verified !== 'boolean') user.emailVerification.verified = false;
      if (typeof user.emailVerification.codeHash !== 'string') user.emailVerification.codeHash = '';
      if (!user.emailVerification.codeExpiresAt) user.emailVerification.codeExpiresAt = null;
      if (!user.emailVerification.lastSentAt) user.emailVerification.lastSentAt = null;
      if (!user.emailVerification.verifiedAt) user.emailVerification.verifiedAt = null;
      if (!Number.isInteger(user.emailVerification.attempts) || user.emailVerification.attempts < 0) {
        user.emailVerification.attempts = 0;
      }
      if (typeof user.emailVerification.devLastCode !== 'string') {
        user.emailVerification.devLastCode = '';
      }
    }

    if (!user.profile || typeof user.profile !== 'object') {
      user.profile = {
        phone: '',
        dateOfBirth: '',
        country: '',
        stateOrProvince: '',
        city: '',
        addressLine1: '',
        occupation: '',
        referralCode: '',
      };
    } else {
      if (typeof user.profile.phone !== 'string') user.profile.phone = '';
      if (typeof user.profile.dateOfBirth !== 'string') user.profile.dateOfBirth = '';
      if (typeof user.profile.country !== 'string') user.profile.country = '';
      if (typeof user.profile.stateOrProvince !== 'string') user.profile.stateOrProvince = '';
      if (typeof user.profile.city !== 'string') user.profile.city = '';
      if (typeof user.profile.addressLine1 !== 'string') user.profile.addressLine1 = '';
      if (typeof user.profile.occupation !== 'string') user.profile.occupation = '';
      if (typeof user.profile.referralCode !== 'string') user.profile.referralCode = '';
    }

    if (!user.withdrawalOtp || typeof user.withdrawalOtp !== 'object') {
      user.withdrawalOtp = {
        codeHash: '',
        codeExpiresAt: null,
        lastSentAt: null,
        attempts: 0,
        devLastCode: '',
      };
    } else {
      if (typeof user.withdrawalOtp.codeHash !== 'string') user.withdrawalOtp.codeHash = '';
      if (!user.withdrawalOtp.codeExpiresAt) user.withdrawalOtp.codeExpiresAt = null;
      if (!user.withdrawalOtp.lastSentAt) user.withdrawalOtp.lastSentAt = null;
      if (!Number.isInteger(user.withdrawalOtp.attempts) || user.withdrawalOtp.attempts < 0) {
        user.withdrawalOtp.attempts = 0;
      }
      if (typeof user.withdrawalOtp.devLastCode !== 'string') {
        user.withdrawalOtp.devLastCode = '';
      }
    }

    if (!user.kycProfile || typeof user.kycProfile !== 'object') {
      user.kycProfile = null;
    } else {
      if (typeof user.kycProfile.passportScanFileName !== 'string') user.kycProfile.passportScanFileName = '';
      if (typeof user.kycProfile.passportScanFileType !== 'string') user.kycProfile.passportScanFileType = '';
      if (!Number.isFinite(user.kycProfile.passportScanFileSize)) user.kycProfile.passportScanFileSize = 0;
      if (typeof user.kycProfile.selfiePhotoFileName !== 'string') user.kycProfile.selfiePhotoFileName = '';
      if (typeof user.kycProfile.selfiePhotoFileType !== 'string') user.kycProfile.selfiePhotoFileType = '';
      if (!Number.isFinite(user.kycProfile.selfiePhotoFileSize)) user.kycProfile.selfiePhotoFileSize = 0;
      if (typeof user.kycProfile.proofOfAddressFileName !== 'string')
        user.kycProfile.proofOfAddressFileName = '';
      if (typeof user.kycProfile.proofOfAddressFileType !== 'string')
        user.kycProfile.proofOfAddressFileType = '';
      if (!Number.isFinite(user.kycProfile.proofOfAddressFileSize))
        user.kycProfile.proofOfAddressFileSize = 0;
    }
  });

  db.withdrawals.forEach((withdrawal) => {
    if (!withdrawal || typeof withdrawal !== 'object') return;
    if (typeof withdrawal.method !== 'string') {
      const detectedMethod =
        withdrawal.destination && typeof withdrawal.destination === 'object' && withdrawal.destination.method
          ? String(withdrawal.destination.method).trim().toLowerCase()
          : '';
      withdrawal.method = detectedMethod === 'bank' ? 'bank' : 'crypto';
    } else {
      withdrawal.method = String(withdrawal.method).trim().toLowerCase() === 'bank' ? 'bank' : 'crypto';
    }

    if (!withdrawal.destination || typeof withdrawal.destination !== 'object') {
      withdrawal.destination = {
        method: withdrawal.method,
      };
    } else {
      withdrawal.destination.method = withdrawal.method;
    }
  });
}

function addAuditLog(db, eventType, details = {}) {
  db.auditLogs.push({
    id: randomId('log'),
    eventType,
    details,
    createdAt: nowIso(),
  });
}

function addNotification(db, type, payload = {}) {
  db.notifications.push({
    id: randomId('ntf'),
    type,
    payload,
    status: 'unread',
    createdAt: nowIso(),
  });
}

function readCryptoConfig(db) {
  return {
    walletPaymentsEnabled: db.config.system.walletPaymentsEnabled,
    assetSymbol: db.config.crypto.assetSymbol,
    defaultNetwork: db.config.crypto.defaultNetwork,
    enabledNetworks: db.config.crypto.enabledNetworks,
    walletAddress: decryptText(db.config.crypto.walletAddressEnc),
  };
}

function safeStringEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  if (!a.length || !b.length || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function resolvedAdminKey() {
  const configured = String(process.env.ADMIN_KEY || '').trim();
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') return '';
  return ADMIN_DEFAULT_KEY;
}

function allowLegacyAdminKey() {
  if (typeof process.env.LEGACY_ADMIN_KEY_ENABLED === 'string') {
    return process.env.LEGACY_ADMIN_KEY_ENABLED.toLowerCase() === 'true';
  }
  return false;
}

function verifyAdminKey(candidate) {
  const provided = String(candidate || '').trim();
  const expected = resolvedAdminKey();
  if (!provided || !expected) return false;
  return safeStringEqual(provided, expected);
}

function verifyAdminCredentials(username, password) {
  const expectedUsername = String(process.env.ADMIN_USERNAME || ADMIN_DEFAULT_USERNAME).trim();
  const expectedPassword = String(process.env.ADMIN_PASSWORD || '').trim();

  if (!expectedPassword) {
    return false;
  }

  return safeStringEqual(username, expectedUsername) && safeStringEqual(password, expectedPassword);
}

function extractAdminToken(req) {
  const headerToken = String(req.headers['x-admin-token'] || '').trim();
  if (headerToken) return headerToken;

  const authHeader = String(req.headers.authorization || '').trim();
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length).trim();
  }

  const cookies = parseCookies(req);
  return String(cookies.admin_session || '').trim();
}

function cleanupExpiredAdminSessions(db) {
  const now = Date.now();
  Object.keys(db.adminSessions).forEach((token) => {
    const entry = db.adminSessions[token];
    if (!entry || !entry.expiresAt) {
      delete db.adminSessions[token];
      return;
    }
    if (new Date(entry.expiresAt).getTime() <= now) {
      delete db.adminSessions[token];
    }
  });
}

function cleanupExpiredUserSessions(db) {
  const now = Date.now();
  Object.keys(db.sessions).forEach((token) => {
    const entry = db.sessions[token];
    if (!entry || !entry.expiresAt) {
      delete db.sessions[token];
      return;
    }
    if (new Date(entry.expiresAt).getTime() <= now) {
      delete db.sessions[token];
    }
  });
}

function createAdminSession(db, actor) {
  const token = randomId('adm');
  const createdAt = nowIso();
  const expiresAt = futureIsoFrom(createdAt, ADMIN_SESSION_TTL_HOURS);
  db.adminSessions[token] = {
    actor: actor || ADMIN_DEFAULT_USERNAME,
    createdAt,
    expiresAt,
  };
  return { token, createdAt, expiresAt };
}

function isAdminRequest(req, db) {
  cleanupExpiredAdminSessions(db);

  const token = extractAdminToken(req);
  if (token) {
    return Boolean(db.adminSessions[token]);
  }

  if (!allowLegacyAdminKey()) return false;
  return verifyAdminKey(req.headers['x-admin-key']);
}

function ensureDb() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }

  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      users: [],
      sessions: {},
      adminSessions: {},
      investments: [],
      withdrawals: [],
      deposits: [],
      cryptoPaymentRequests: [],
      auditLogs: [],
      notifications: [],
      config: {
        system: {
          depositsEnabled: true,
          investmentsEnabled: true,
          withdrawalsEnabled: true,
          walletPaymentsEnabled: true,
        },
        crypto: {
          assetSymbol: DEFAULT_ASSET_SYMBOL,
          walletAddressEnc: '',
          defaultNetwork: DEFAULT_ENABLED_NETWORKS[0],
          enabledNetworks: [...DEFAULT_ENABLED_NETWORKS],
        },
      },
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
}

function readDb() {
  ensureDb();
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  ensureDbShape(db);
  return db;
}

function writeDb(data) {
  ensureDb();
  const dir = path.dirname(DB_PATH);
  const tempPath = path.join(dir, `.db-${process.pid}-${Date.now()}.tmp`);
  const payload = JSON.stringify(data, null, 2);

  fs.writeFileSync(tempPath, payload);
  fs.renameSync(tempPath, DB_PATH);
}

function warnPersistenceSetup() {
  if (!IS_PRODUCTION) return;
  if (!DB_PATH_IS_DEFAULT) return;

  console.warn(
    `[PERSISTENCE] Using default DB_PATH (${DB_PATH}) in production. ` +
      'Use DB_PATH with persistent storage to avoid data loss across restarts/redeploys.',
  );
}

function warnAdminCredentialSetup() {
  const username = String(process.env.ADMIN_USERNAME || '').trim();
  const password = String(process.env.ADMIN_PASSWORD || '').trim();

  if (username && password) return;

  const message = username
    ? '[ADMIN] ADMIN_PASSWORD is missing. Admin username/password login will fail.'
    : '[ADMIN] ADMIN_USERNAME/ADMIN_PASSWORD missing. Admin username/password login will fail.';

  if (IS_PRODUCTION) {
    console.error(message);
    return;
  }

  console.warn(message);
}

function warnEmailSetup() {
  const resendApiKey = String(process.env.RESEND_API_KEY || '').trim();
  const resendFromEmail = String(process.env.RESEND_FROM_EMAIL || '').trim();

  if (resendApiKey && resendFromEmail) return;

  const message =
    '[MAIL] RESEND_API_KEY or RESEND_FROM_EMAIL missing. Verification codes will not be delivered by email.';

  if (IS_PRODUCTION) {
    console.error(message);
    return;
  }

  console.warn(message);
}

function randomId(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString('hex')}`;
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string' || !stored.includes(':')) {
    return false;
  }

  const [salt, hash] = stored.split(':');
  if (!salt || !hash) {
    return false;
  }

  try {
    const candidate = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    const hashBuffer = Buffer.from(hash, 'hex');
    const candidateBuffer = Buffer.from(candidate, 'hex');

    if (!hashBuffer.length || hashBuffer.length !== candidateBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(hashBuffer, candidateBuffer);
  } catch {
    return false;
  }
}

function verificationCodeHash(code) {
  return crypto.createHash('sha256').update(String(code || '')).digest('hex');
}

function generateEmailCode() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, '0');
}

function maskIdNumber(value) {
  const source = String(value || '');
  if (!source) return '';
  if (source.length <= 4) return '*'.repeat(source.length);
  return `${'*'.repeat(source.length - 4)}${source.slice(-4)}`;
}

function safeEmailVerification(user) {
  const payload = {
    verified: Boolean(user.emailVerification && user.emailVerification.verified),
    codeExpiresAt: user.emailVerification ? user.emailVerification.codeExpiresAt : null,
    lastSentAt: user.emailVerification ? user.emailVerification.lastSentAt : null,
    verifiedAt: user.emailVerification ? user.emailVerification.verifiedAt : null,
  };

  if (!IS_PRODUCTION && user.emailVerification && user.emailVerification.devLastCode) {
    payload.devCode = user.emailVerification.devLastCode;
  }

  return payload;
}

function safeWithdrawalOtp(user) {
  const payload = {
    codeExpiresAt: user.withdrawalOtp ? user.withdrawalOtp.codeExpiresAt : null,
    lastSentAt: user.withdrawalOtp ? user.withdrawalOtp.lastSentAt : null,
  };

  if (!IS_PRODUCTION && user.withdrawalOtp && user.withdrawalOtp.devLastCode) {
    payload.devCode = user.withdrawalOtp.devLastCode;
  }

  return payload;
}

async function sendEmailVerificationCode(user, code, expiresAtIso) {
  const message = [
    `Your verification code is: ${code}`,
    `This code expires at ${new Date(expiresAtIso).toUTCString()}.`,
    'If you did not request this, ignore this message.',
  ].join('\n');

  const resendApiKey = String(process.env.RESEND_API_KEY || '').trim();
  const resendFromEmail = String(process.env.RESEND_FROM_EMAIL || '').trim();

  if (resendApiKey && resendFromEmail) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: [user.email],
          subject: 'Verify your email',
          text: message,
        }),
      });

      if (response.ok) {
        return true;
      }

      const payload = await response.text();
      console.error(`[MAIL][RESEND] Delivery failed (${response.status}): ${payload}`);
    } catch (error) {
      console.error(`[MAIL][RESEND] Delivery error: ${error.message}`);
    }
  }

  // Fallback delivery for local/internal runs.
  console.log(`[MAIL] To: ${user.email} | Subject: Verify your email\n${message}`);
  return false;
}

async function issueEmailVerificationCode(db, user, contextLabel) {
  const code = generateEmailCode();
  const expiresAt = new Date(Date.now() + EMAIL_CODE_TTL_MINUTES * 60 * 1000).toISOString();

  user.emailVerification.verified = false;
  user.emailVerification.codeHash = verificationCodeHash(code);
  user.emailVerification.codeExpiresAt = expiresAt;
  user.emailVerification.lastSentAt = nowIso();
  user.emailVerification.verifiedAt = null;
  user.emailVerification.attempts = 0;
  user.emailVerification.devLastCode = IS_PRODUCTION ? '' : code;

  const delivered = await sendEmailVerificationCode(user, code, expiresAt);

  addAuditLog(db, 'email_verification_code_sent', {
    userId: user.id,
    context: contextLabel || 'manual',
    expiresAt,
  });
  addNotification(db, 'email_verification_code_sent', {
    userId: user.id,
    email: user.email,
    context: contextLabel || 'manual',
    expiresAt,
  });

  return delivered;
}

async function sendWithdrawalCodeEmail(user, code, expiresAtIso) {
  const message = [
    `Your withdrawal verification code is: ${code}`,
    `This code expires at ${new Date(expiresAtIso).toUTCString()}.`,
    'If you did not request this, contact support immediately.',
  ].join('\n');

  const resendApiKey = String(process.env.RESEND_API_KEY || '').trim();
  const resendFromEmail = String(process.env.RESEND_FROM_EMAIL || '').trim();

  if (resendApiKey && resendFromEmail) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFromEmail,
          to: [user.email],
          subject: 'Withdrawal verification code',
          text: message,
        }),
      });

      if (response.ok) {
        return true;
      }

      const payload = await response.text();
      console.error(`[MAIL][RESEND] Withdrawal code delivery failed (${response.status}): ${payload}`);
    } catch (error) {
      console.error(`[MAIL][RESEND] Withdrawal code delivery error: ${error.message}`);
    }
  }

  // Fallback delivery for local/internal runs.
  console.log(`[MAIL] To: ${user.email} | Subject: Withdrawal verification code\n${message}`);
  return false;
}

async function issueWithdrawalOtpCode(db, user, contextLabel) {
  const code = generateEmailCode();
  const expiresAt = new Date(Date.now() + WITHDRAWAL_CODE_TTL_MINUTES * 60 * 1000).toISOString();

  user.withdrawalOtp.codeHash = verificationCodeHash(code);
  user.withdrawalOtp.codeExpiresAt = expiresAt;
  user.withdrawalOtp.lastSentAt = nowIso();
  user.withdrawalOtp.attempts = 0;
  user.withdrawalOtp.devLastCode = IS_PRODUCTION ? '' : code;

  const delivered = await sendWithdrawalCodeEmail(user, code, expiresAt);

  addAuditLog(db, 'withdrawal_code_sent', {
    userId: user.id,
    context: contextLabel || 'manual',
    expiresAt,
  });
  addNotification(db, 'withdrawal_code_sent', {
    userId: user.id,
    email: user.email,
    context: contextLabel || 'manual',
    expiresAt,
  });

  return delivered;
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) return {};

  return header.split(';').reduce((acc, pair) => {
    const index = pair.indexOf('=');
    if (index === -1) return acc;
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    acc[key] = decodeURIComponent(value);
    return acc;
  }, {});
}

function sendJson(res, code, payload, extraHeaders = {}) {
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });

    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(new Error('Invalid JSON body'));
      }
    });

    req.on('error', reject);
  });
}

function normalizeMoney(value) {
  return Math.round(value * 100) / 100;
}

function normalizeKpiOverrides(overrides) {
  const source = overrides && typeof overrides === 'object' ? overrides : {};
  const totalDeposits = Number(source.totalDeposits);
  const activeInvestments = Number(source.activeInvestments);
  const realizedProfit = Number(source.realizedProfit);

  return {
    totalDeposits: Number.isFinite(totalDeposits) && totalDeposits >= 0 ? normalizeMoney(totalDeposits) : null,
    activeInvestments:
      Number.isFinite(activeInvestments) && activeInvestments >= 0 ? Math.floor(activeInvestments) : null,
    realizedProfit: Number.isFinite(realizedProfit) && realizedProfit >= 0 ? normalizeMoney(realizedProfit) : null,
  };
}

function computeUserDashboardKpis(db, user) {
  const overrides = normalizeKpiOverrides(user.kpiOverrides);
  const totalDepositsComputed = normalizeMoney(
    db.deposits
      .filter((deposit) => deposit.userId === user.id && deposit.status === 'approved')
      .reduce((sum, deposit) => sum + Number(deposit.amount || 0), 0),
  );
  const activeInvestmentsComputed = db.investments.filter(
    (investment) => investment.userId === user.id && investment.status === 'active',
  ).length;
  const realizedProfitComputed = normalizeMoney(
    db.investments
      .filter((investment) => investment.userId === user.id && investment.status === 'completed')
      .reduce(
        (sum, investment) =>
          sum + Number(investment.amount || 0) * (Number(investment.returnPercent || 0) / 100),
        0,
      ),
  );

  return {
    availableBalance: normalizeMoney(Number(user.balance || 0)),
    totalDeposits: overrides.totalDeposits ?? totalDepositsComputed,
    activeInvestments: overrides.activeInvestments ?? activeInvestmentsComputed,
    realizedProfit: overrides.realizedProfit ?? realizedProfitComputed,
    overrides,
  };
}

function settleMaturedInvestments(db, userId) {
  const now = new Date();
  const userIds = userId ? new Set([userId]) : null;

  db.investments.forEach((investment) => {
    if (investment.status !== 'active') return;
    if (userIds && !userIds.has(investment.userId)) return;

    const maturity = new Date(investment.endAt);
    if (maturity > now) return;

    const user = db.users.find((candidate) => candidate.id === investment.userId);
    if (!user) return;

    investment.status = 'completed';
    investment.completedAt = nowIso();

    const payout = normalizeMoney(investment.amount * (1 + investment.returnPercent / 100));
    user.balance = normalizeMoney(user.balance + payout);
  });
}

function authContext(req, db) {
  const cookies = parseCookies(req);
  const authHeader = req.headers.authorization;

  let token = cookies.session;
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice('Bearer '.length).trim();
  }

  if (!token) return null;

  const session = db.sessions[token];
  if (!session) return null;
  if (!session.expiresAt || new Date(session.expiresAt).getTime() <= Date.now()) return null;

  const user = db.users.find((candidate) => candidate.id === session.userId);
  if (!user) return null;

  return { token, session, user };
}

function safeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    balance: user.balance,
    kpiOverrides: normalizeKpiOverrides(user.kpiOverrides),
    emailVerification: safeEmailVerification(user),
    withdrawalOtp: safeWithdrawalOtp(user),
    withdrawalAccess: user.withdrawalAccess,
    kycProfile: user.kycProfile
      ? {
          legalName: user.kycProfile.legalName,
          dateOfBirth: user.kycProfile.dateOfBirth,
          country: user.kycProfile.country,
          idType: user.kycProfile.idType,
          idNumberMasked: maskIdNumber(user.kycProfile.idNumber),
          addressLine1: user.kycProfile.addressLine1,
          city: user.kycProfile.city,
          stateOrProvince: user.kycProfile.stateOrProvince,
          postalCode: user.kycProfile.postalCode,
          passportScanFileName: user.kycProfile.passportScanFileName,
          selfiePhotoFileName: user.kycProfile.selfiePhotoFileName,
          proofOfAddressFileName: user.kycProfile.proofOfAddressFileName,
          submittedAt: user.kycProfile.submittedAt,
        }
      : null,
    createdAt: user.createdAt,
  };
}

function response404(res) {
  sendJson(res, 404, { error: 'Not found' });
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;
  const method = req.method;
  const db = readDb();

  settleMaturedInvestments(db);
  cleanupExpiredAdminSessions(db);
  cleanupExpiredUserSessions(db);

  if (pathname === '/api/health' && method === 'GET') {
    writeDb(db);
    sendJson(res, 200, { ok: true, serverTime: nowIso() });
    return;
  }

  if (pathname === '/api/plans' && method === 'GET') {
    writeDb(db);
    sendJson(res, 200, { plans });
    return;
  }

  if (pathname === '/api/admin/login' && method === 'POST') {
    const body = await parseBody(req);

    const username = String(body.username || '').trim();
    const password = String(body.password || '');
    const adminKey = String(body.adminKey || '').trim();

    let actor = '';
    if (username && password && verifyAdminCredentials(username, password)) {
      actor = username;
    } else if (allowLegacyAdminKey() && verifyAdminKey(adminKey)) {
      actor = 'legacy_key';
    } else {
      sendJson(res, 401, { error: 'Invalid admin credentials.' });
      return;
    }

    const session = createAdminSession(db, actor);

    addAuditLog(db, 'admin_login_success', {
      actor,
      sessionCreatedAt: session.createdAt,
      sessionExpiresAt: session.expiresAt,
    });

    writeDb(db);
    sendJson(
      res,
      200,
      {
        message: 'Admin authenticated.',
        token: session.token,
        actor,
        expiresAt: session.expiresAt,
      },
      {
        'Set-Cookie': buildCookie('admin_session', session.token, {
          maxAgeSeconds: ADMIN_SESSION_TTL_HOURS * 60 * 60,
        }),
      },
    );
    return;
  }

  if (pathname === '/api/admin/logout' && method === 'POST') {
    const token = extractAdminToken(req);
    if (token) {
      delete db.adminSessions[token];
    }

    writeDb(db);
    sendJson(
      res,
      200,
      { ok: true },
      { 'Set-Cookie': buildCookie('admin_session', '', { maxAgeSeconds: 0 }) },
    );
    return;
  }

  if (pathname === '/api/admin/overview' && method === 'GET') {
    if (!isAdminRequest(req, db)) {
      sendJson(res, 401, { error: 'Admin authentication required.' });
      return;
    }

    const cryptoConfig = readCryptoConfig(db);
    const kycRequests = db.users
      .filter((user) => user.withdrawalAccess.status === 'pending_review')
      .map((user) => ({
        userId: user.id,
        name: user.name,
        email: user.email,
        status: user.withdrawalAccess.status,
        reason: user.withdrawalAccess.reason,
        requestedAt: user.withdrawalAccess.requestedAt,
        kycProfile: user.kycProfile
          ? {
              legalName: user.kycProfile.legalName,
              dateOfBirth: user.kycProfile.dateOfBirth,
              country: user.kycProfile.country,
              idType: user.kycProfile.idType,
              idNumberMasked: maskIdNumber(user.kycProfile.idNumber),
              addressLine1: user.kycProfile.addressLine1,
              city: user.kycProfile.city,
              stateOrProvince: user.kycProfile.stateOrProvince,
              postalCode: user.kycProfile.postalCode,
              passportScanFileName: user.kycProfile.passportScanFileName,
              selfiePhotoFileName: user.kycProfile.selfiePhotoFileName,
              proofOfAddressFileName: user.kycProfile.proofOfAddressFileName,
              submittedAt: user.kycProfile.submittedAt,
            }
          : null,
      }));

    const paymentRequests = db.cryptoPaymentRequests
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const depositRequests = db.deposits
      .filter((deposit) => deposit.status === 'pending')
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const siteStats = {
      totalUsers: db.users.length,
      activeSessions: Object.keys(db.sessions).length,
      totalInvestments: db.investments.length,
      totalWithdrawals: db.withdrawals.length,
      pendingKyc: kycRequests.length,
      pendingDeposits: depositRequests.length,
      pendingWalletPayments: paymentRequests.filter((item) => item.status === 'pending_verification').length,
      totalBalance: normalizeMoney(db.users.reduce((sum, user) => sum + Number(user.balance || 0), 0)),
    };

    const users = db.users
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((user) => {
        const kpis = computeUserDashboardKpis(db, user);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          balance: user.balance,
          kycStatus: user.withdrawalAccess.status,
          emailVerified: Boolean(user.emailVerification && user.emailVerification.verified),
          createdAt: user.createdAt,
          kpis,
        };
      });

    writeDb(db);
    sendJson(res, 200, {
      siteStats,
      systemSettings: db.config.system,
      config: cryptoConfig,
      kycRequests,
      paymentRequests,
      depositRequests,
      users,
      notifications: db.notifications.slice(-20),
    });
    return;
  }

  if (pathname === '/api/admin/system-settings' && method === 'POST') {
    if (!isAdminRequest(req, db)) {
      sendJson(res, 401, { error: 'Admin authentication required.' });
      return;
    }

    const body = await parseBody(req);

    db.config.system.depositsEnabled = Boolean(body.depositsEnabled);
    db.config.system.investmentsEnabled = Boolean(body.investmentsEnabled);
    db.config.system.withdrawalsEnabled = Boolean(body.withdrawalsEnabled);
    db.config.system.walletPaymentsEnabled = Boolean(body.walletPaymentsEnabled);

    addAuditLog(db, 'admin_system_settings_updated', {
      ...db.config.system,
    });

    writeDb(db);
    sendJson(res, 200, {
      message: 'System settings updated.',
      systemSettings: db.config.system,
    });
    return;
  }

  if (pathname === '/api/admin/wallet-settings' && method === 'POST') {
    if (!isAdminRequest(req, db)) {
      sendJson(res, 401, { error: 'Admin authentication required.' });
      return;
    }

    const body = await parseBody(req);
    const walletAddress = String(body.walletAddress || '').trim();
    const assetSymbol = sanitizeAssetSymbol(body.assetSymbol);
    const defaultNetwork = normalizeNetworkName(body.defaultNetwork);
    const enabledNetworks = sanitizeEnabledNetworks(body.enabledNetworks, []);
    const walletPaymentsEnabled =
      typeof body.walletPaymentsEnabled === 'boolean'
        ? body.walletPaymentsEnabled
        : db.config.system.walletPaymentsEnabled;

    if (!assetSymbol) {
      sendJson(res, 400, { error: 'Asset symbol is required.' });
      return;
    }

    if (!defaultNetwork) {
      sendJson(res, 400, { error: 'Default network is required.' });
      return;
    }

    const hasDefaultNetwork = enabledNetworks.some(
      (network) => networkKey(network) === networkKey(defaultNetwork),
    );
    const finalizedNetworks = hasDefaultNetwork
      ? enabledNetworks
      : sanitizeEnabledNetworks([defaultNetwork, ...enabledNetworks], [defaultNetwork]);
    const finalizedDefaultNetwork =
      finalizedNetworks.find((network) => networkKey(network) === networkKey(defaultNetwork)) || defaultNetwork;

    db.config.system.walletPaymentsEnabled = walletPaymentsEnabled;
    db.config.crypto.assetSymbol = assetSymbol;
    db.config.crypto.defaultNetwork = finalizedDefaultNetwork;
    db.config.crypto.enabledNetworks = finalizedNetworks;
    db.config.crypto.walletAddressEnc = encryptText(walletAddress);

    addAuditLog(db, 'admin_wallet_settings_updated', {
      assetSymbol,
      defaultNetwork: finalizedDefaultNetwork,
      enabledNetworks: finalizedNetworks,
      walletPaymentsEnabled,
      walletUpdated: Boolean(walletAddress),
    });

    writeDb(db);
    sendJson(res, 200, {
      message: 'Wallet settings updated.',
      config: readCryptoConfig(db),
    });
    return;
  }

  if (pathname === '/api/admin/reviews' && method === 'POST') {
    if (!isAdminRequest(req, db)) {
      sendJson(res, 401, { error: 'Admin authentication required.' });
      return;
    }

    const body = await parseBody(req);
    const userId = String(body.userId || '').trim();
    const decision = String(body.decision || '').trim().toLowerCase();
    const reason = String(body.reason || '').trim();

    if (!userId || !['approved', 'rejected'].includes(decision)) {
      sendJson(res, 400, { error: 'userId and decision are required.' });
      return;
    }

    const user = db.users.find((candidate) => candidate.id === userId);
    if (!user) {
      sendJson(res, 404, { error: 'User not found.' });
      return;
    }

    user.withdrawalAccess.status = decision;
    user.withdrawalAccess.reason =
      reason || (decision === 'approved' ? 'KYC review approved.' : 'KYC requirements not met.');
    user.withdrawalAccess.reviewedAt = nowIso();

    addAuditLog(db, 'admin_kyc_review_decision', {
      userId,
      decision,
      reason: user.withdrawalAccess.reason,
    });
    addNotification(db, 'kyc_review_decision', {
      userId,
      decision,
      reason: user.withdrawalAccess.reason,
    });

    writeDb(db);
    sendJson(res, 200, { message: `Review ${decision}.`, user: safeUser(user) });
    return;
  }

  if (pathname === '/api/admin/deposits/review' && method === 'POST') {
    if (!isAdminRequest(req, db)) {
      sendJson(res, 401, { error: 'Admin authentication required.' });
      return;
    }

    const body = await parseBody(req);
    const depositId = String(body.depositId || '').trim();
    const decision = String(body.decision || '').trim().toLowerCase();
    const note = String(body.note || '').trim();

    if (!depositId || !['approved', 'rejected'].includes(decision)) {
      sendJson(res, 400, { error: 'depositId and decision are required.' });
      return;
    }

    const deposit = db.deposits.find((item) => item.id === depositId);
    if (!deposit) {
      sendJson(res, 404, { error: 'Deposit request not found.' });
      return;
    }

    if (deposit.status !== 'pending') {
      sendJson(res, 400, { error: 'Deposit request has already been reviewed.' });
      return;
    }

    deposit.status = decision;
    deposit.reviewedAt = nowIso();
    deposit.reviewNote = note;

    if (decision === 'approved') {
      const user = db.users.find((candidate) => candidate.id === deposit.userId);
      if (user) {
        user.balance = normalizeMoney(user.balance + deposit.amount);
      }
    }

    addAuditLog(db, 'admin_deposit_reviewed', {
      depositId,
      decision,
      amount: deposit.amount,
    });
    addNotification(db, 'deposit_review_decision', {
      userId: deposit.userId,
      depositId,
      decision,
    });

    writeDb(db);
    sendJson(res, 200, {
      message: `Deposit ${decision}.`,
      deposit,
    });
    return;
  }

  if (pathname === '/api/admin/users/balance' && method === 'POST') {
    if (!isAdminRequest(req, db)) {
      sendJson(res, 401, { error: 'Admin authentication required.' });
      return;
    }

    const body = await parseBody(req);
    const userId = String(body.userId || '').trim();
    const amount = Number(body.amount);
    const mode = String(body.mode || '').trim().toLowerCase();

    if (!userId || !Number.isFinite(amount) || amount < 0 || !['set', 'credit', 'debit'].includes(mode)) {
      sendJson(res, 400, { error: 'userId, amount, and valid mode are required.' });
      return;
    }

    const user = db.users.find((candidate) => candidate.id === userId);
    if (!user) {
      sendJson(res, 404, { error: 'User not found.' });
      return;
    }

    if (mode === 'set') {
      user.balance = normalizeMoney(amount);
    } else if (mode === 'credit') {
      user.balance = normalizeMoney(user.balance + amount);
    } else {
      user.balance = normalizeMoney(Math.max(0, user.balance - amount));
    }

    addAuditLog(db, 'admin_user_balance_adjusted', {
      userId,
      mode,
      amount,
      newBalance: user.balance,
    });

    writeDb(db);
    sendJson(res, 200, { message: 'Balance updated.', user: safeUser(user) });
    return;
  }

  if (pathname === '/api/admin/users/kpis' && method === 'POST') {
    if (!isAdminRequest(req, db)) {
      sendJson(res, 401, { error: 'Admin authentication required.' });
      return;
    }

    const body = await parseBody(req);
    const userId = String(body.userId || '').trim();
    const availableBalance = Number(body.availableBalance);
    const totalDeposits = Number(body.totalDeposits);
    const activeInvestments = Number(body.activeInvestments);
    const realizedProfit = Number(body.realizedProfit);

    if (!userId) {
      sendJson(res, 400, { error: 'userId is required.' });
      return;
    }

    const invalid =
      !Number.isFinite(availableBalance) ||
      availableBalance < 0 ||
      !Number.isFinite(totalDeposits) ||
      totalDeposits < 0 ||
      !Number.isFinite(activeInvestments) ||
      activeInvestments < 0 ||
      !Number.isFinite(realizedProfit) ||
      realizedProfit < 0;

    if (invalid) {
      sendJson(res, 400, {
        error: 'availableBalance, totalDeposits, activeInvestments, and realizedProfit must be valid non-negative numbers.',
      });
      return;
    }

    const user = db.users.find((candidate) => candidate.id === userId);
    if (!user) {
      sendJson(res, 404, { error: 'User not found.' });
      return;
    }

    user.balance = normalizeMoney(availableBalance);
    user.kpiOverrides = {
      totalDeposits: normalizeMoney(totalDeposits),
      activeInvestments: Math.floor(activeInvestments),
      realizedProfit: normalizeMoney(realizedProfit),
    };

    const kpis = computeUserDashboardKpis(db, user);

    addAuditLog(db, 'admin_user_dashboard_kpis_adjusted', {
      userId,
      availableBalance: kpis.availableBalance,
      totalDeposits: kpis.totalDeposits,
      activeInvestments: kpis.activeInvestments,
      realizedProfit: kpis.realizedProfit,
    });

    writeDb(db);
    sendJson(res, 200, { message: 'User dashboard metrics updated.', user: safeUser(user), kpis });
    return;
  }

  if (pathname === '/api/admin/payments/verify' && method === 'POST') {
    if (!isAdminRequest(req, db)) {
      sendJson(res, 401, { error: 'Admin authentication required.' });
      return;
    }

    const body = await parseBody(req);
    const paymentId = String(body.paymentId || '').trim();
    const decision = String(body.decision || '').trim().toLowerCase();
    const note = String(body.note || '').trim();

    if (!paymentId || !['verified', 'rejected'].includes(decision)) {
      sendJson(res, 400, { error: 'paymentId and decision are required.' });
      return;
    }

    const request = db.cryptoPaymentRequests.find((item) => item.id === paymentId);
    if (!request) {
      sendJson(res, 404, { error: 'Payment request not found.' });
      return;
    }

    request.status = decision === 'verified' ? 'verified' : 'rejected';
    request.reviewedAt = nowIso();
    request.reviewNote = note || '';

    addAuditLog(db, 'admin_payment_reviewed', {
      paymentId,
      decision: request.status,
    });
    addNotification(db, 'payment_review_decision', {
      userId: request.userId,
      paymentId,
      decision: request.status,
    });

    writeDb(db);
    sendJson(res, 200, { message: `Payment marked as ${request.status}.`, paymentRequest: request });
    return;
  }

  if (pathname === '/api/register' && method === 'POST') {
    const body = await parseBody(req);

    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!name || !email || !password) {
      sendJson(res, 400, { error: 'Name, email, and password are required.' });
      return;
    }

    if (password.length < 8) {
      sendJson(res, 400, { error: 'Password must be at least 8 characters.' });
      return;
    }

    const existing = db.users.find((candidate) => candidate.email === email);
    if (existing) {
      sendJson(res, 409, { error: 'Account already exists.' });
      return;
    }

    const user = {
      id: randomId('usr'),
      name,
      email,
      passwordHash: hashPassword(password),
      balance: 0,
      kpiOverrides: {
        totalDeposits: null,
        activeInvestments: null,
        realizedProfit: null,
      },
      emailVerification: {
        verified: false,
        codeHash: '',
        codeExpiresAt: null,
        lastSentAt: null,
        verifiedAt: null,
        attempts: 0,
        devLastCode: '',
      },
      withdrawalOtp: {
        codeHash: '',
        codeExpiresAt: null,
        lastSentAt: null,
        attempts: 0,
        devLastCode: '',
      },
      withdrawalAccess: {
        status: 'locked',
        reason: 'KYC review required before withdrawals.',
        requestedAt: null,
        reviewedAt: null,
      },
      profile: {
        phone: '',
        dateOfBirth: '',
        country: '',
        stateOrProvince: '',
        city: '',
        addressLine1: '',
        occupation: '',
        referralCode: '',
      },
      kycProfile: null,
      createdAt: nowIso(),
    };

    db.users.push(user);
    const emailDelivered = await issueEmailVerificationCode(db, user, 'registration');
    addAuditLog(db, 'user_registered', { userId: user.id, email: user.email });

    const token = randomId('sess');
    const createdAt = nowIso();
    const expiresAt = futureIsoFrom(createdAt, USER_SESSION_TTL_HOURS);
    db.sessions[token] = {
      userId: user.id,
      createdAt,
      expiresAt,
    };

    writeDb(db);
    sendJson(
      res,
      201,
      {
        user: safeUser(user),
        token,
        message: emailDelivered
          ? 'Account created. A verification code has been sent to your email.'
          : 'Account created, but email delivery is currently unavailable. Please try sending the code again later.',
        emailDelivery: emailDelivered,
      },
      {
        'Set-Cookie': buildCookie('session', token, {
          maxAgeSeconds: USER_SESSION_TTL_HOURS * 60 * 60,
        }),
      },
    );
    return;
  }

  if (pathname === '/api/login' && method === 'POST') {
    const body = await parseBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    const user = db.users.find((candidate) => candidate.email === email);
    if (!user || !verifyPassword(password, user.passwordHash)) {
      sendJson(res, 401, { error: 'Invalid credentials.' });
      return;
    }

    const token = randomId('sess');
    const createdAt = nowIso();
    const expiresAt = futureIsoFrom(createdAt, USER_SESSION_TTL_HOURS);
    db.sessions[token] = {
      userId: user.id,
      createdAt,
      expiresAt,
    };

    writeDb(db);

    sendJson(
      res,
      200,
      { user: safeUser(user), token },
      {
        'Set-Cookie': buildCookie('session', token, {
          maxAgeSeconds: USER_SESSION_TTL_HOURS * 60 * 60,
        }),
      },
    );
    return;
  }

  if (pathname === '/api/logout' && method === 'POST') {
    const auth = authContext(req, db);
    if (auth) {
      delete db.sessions[auth.token];
    }

    writeDb(db);
    sendJson(
      res,
      200,
      { ok: true },
      { 'Set-Cookie': buildCookie('session', '', { maxAgeSeconds: 0 }) },
    );
    return;
  }

  const auth = authContext(req, db);

  if (pathname === '/api/email-verification/status' && method === 'GET') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    writeDb(db);
    sendJson(res, 200, { emailVerification: safeEmailVerification(auth.user) });
    return;
  }

  if (pathname === '/api/email-verification/request' && method === 'POST') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    if (auth.user.emailVerification.verified) {
      sendJson(res, 200, {
        message: 'Email is already verified.',
        emailVerification: safeEmailVerification(auth.user),
      });
      return;
    }

    const lastSentAt = auth.user.emailVerification.lastSentAt
      ? new Date(auth.user.emailVerification.lastSentAt).getTime()
      : 0;
    const earliestResend = lastSentAt + EMAIL_CODE_RESEND_SECONDS * 1000;
    if (Date.now() < earliestResend) {
      const waitSeconds = Math.max(1, Math.ceil((earliestResend - Date.now()) / 1000));
      sendJson(res, 429, { error: `Please wait ${waitSeconds} seconds before requesting another code.` });
      return;
    }

    const emailDelivered = await issueEmailVerificationCode(db, auth.user, 'user_request');

    writeDb(db);
    sendJson(res, 200, {
      message: emailDelivered
        ? 'Verification code sent to your email.'
        : 'Email delivery is currently unavailable. Please retry later or contact support.',
      emailDelivery: emailDelivered,
      emailVerification: safeEmailVerification(auth.user),
    });
    return;
  }

  if (pathname === '/api/email-verification/confirm' && method === 'POST') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    if (auth.user.emailVerification.verified) {
      sendJson(res, 200, {
        message: 'Email is already verified.',
        emailVerification: safeEmailVerification(auth.user),
      });
      return;
    }

    const body = await parseBody(req);
    const code = String(body.code || '').trim();
    if (!/^\d{6}$/.test(code)) {
      sendJson(res, 400, { error: 'Verification code must be a 6-digit value.' });
      return;
    }

    if (!auth.user.emailVerification.codeHash || !auth.user.emailVerification.codeExpiresAt) {
      sendJson(res, 400, { error: 'No active verification code. Request a new code first.' });
      return;
    }

    if (new Date(auth.user.emailVerification.codeExpiresAt).getTime() < Date.now()) {
      sendJson(res, 400, { error: 'Verification code has expired. Request a new code.' });
      return;
    }

    if (auth.user.emailVerification.attempts >= EMAIL_CODE_MAX_ATTEMPTS) {
      sendJson(res, 429, { error: 'Too many failed attempts. Request a new verification code.' });
      return;
    }

    const incomingHash = verificationCodeHash(code);
    if (incomingHash !== auth.user.emailVerification.codeHash) {
      auth.user.emailVerification.attempts += 1;
      writeDb(db);
      sendJson(res, 400, { error: 'Invalid verification code.' });
      return;
    }

    auth.user.emailVerification.verified = true;
    auth.user.emailVerification.verifiedAt = nowIso();
    auth.user.emailVerification.codeHash = '';
    auth.user.emailVerification.codeExpiresAt = null;
    auth.user.emailVerification.attempts = 0;
    auth.user.emailVerification.devLastCode = '';

    addAuditLog(db, 'email_verified', { userId: auth.user.id });
    addNotification(db, 'email_verified', { userId: auth.user.id, email: auth.user.email });

    writeDb(db);
    sendJson(res, 200, {
      message: 'Email verified successfully.',
      emailVerification: safeEmailVerification(auth.user),
    });
    return;
  }

  if ((pathname === '/api/simulator/config' || pathname === '/api/wallet/config') && method === 'GET') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    writeDb(db);
    sendJson(res, 200, {
      config: readCryptoConfig(db),
      systemSettings: db.config.system,
    });
    return;
  }

  if (pathname === '/api/withdrawal-access' && method === 'GET') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    writeDb(db);
    sendJson(res, 200, { withdrawalAccess: auth.user.withdrawalAccess });
    return;
  }

  if (pathname === '/api/withdrawal-access/request-review' && method === 'POST') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    const body = await parseBody(req);
    const legalName = String(body.legalName || '').trim();
    const dateOfBirth = String(body.dateOfBirth || '').trim();
    const country = String(body.country || '').trim();
    const idType = String(body.idType || '').trim().toLowerCase();
    const idNumber = String(body.idNumber || '').trim();
    const addressLine1 = String(body.addressLine1 || '').trim();
    const city = String(body.city || '').trim();
    const stateOrProvince = String(body.stateOrProvince || '').trim();
    const postalCode = String(body.postalCode || '').trim();
    const passportScanFileName = String(body.passportScanFileName || '').trim();
    const passportScanFileType = String(body.passportScanFileType || '').trim();
    const passportScanFileSize = Number(body.passportScanFileSize);
    const selfiePhotoFileName = String(body.selfiePhotoFileName || '').trim();
    const selfiePhotoFileType = String(body.selfiePhotoFileType || '').trim();
    const selfiePhotoFileSize = Number(body.selfiePhotoFileSize);
    const proofOfAddressFileName = String(body.proofOfAddressFileName || '').trim();
    const proofOfAddressFileType = String(body.proofOfAddressFileType || '').trim();
    const proofOfAddressFileSize = Number(body.proofOfAddressFileSize);
    const note = String(body.note || '').trim();

    if (auth.user.withdrawalAccess.status === 'approved') {
      sendJson(res, 200, {
        message: 'Withdrawal access is already approved.',
        withdrawalAccess: auth.user.withdrawalAccess,
      });
      return;
    }

    if (legalName.length < 3) {
      sendJson(res, 400, { error: 'Legal name is required for KYC.' });
      return;
    }
    if (!dateOfBirth || Number.isNaN(new Date(dateOfBirth).getTime())) {
      sendJson(res, 400, { error: 'A valid date of birth is required for KYC.' });
      return;
    }
    if (country.length < 2) {
      sendJson(res, 400, { error: 'Country is required for KYC.' });
      return;
    }
    if (!SUPPORTED_KYC_ID_TYPES.includes(idType)) {
      sendJson(res, 400, { error: 'A valid ID type is required for KYC.' });
      return;
    }
    if (idNumber.length < 6) {
      sendJson(res, 400, { error: 'ID number must be at least 6 characters.' });
      return;
    }
    if (addressLine1.length < 5) {
      sendJson(res, 400, { error: 'Residential address is required for KYC.' });
      return;
    }
    if (city.length < 2) {
      sendJson(res, 400, { error: 'City is required for KYC.' });
      return;
    }
    if (!passportScanFileName || !Number.isFinite(passportScanFileSize) || passportScanFileSize <= 0) {
      sendJson(res, 400, { error: 'Passport/ID scan file is required for KYC.' });
      return;
    }
    if (!selfiePhotoFileName || !Number.isFinite(selfiePhotoFileSize) || selfiePhotoFileSize <= 0) {
      sendJson(res, 400, { error: 'Selfie photo file is required for KYC.' });
      return;
    }
    if (
      !proofOfAddressFileName ||
      !Number.isFinite(proofOfAddressFileSize) ||
      proofOfAddressFileSize <= 0
    ) {
      sendJson(res, 400, { error: 'Proof of address file is required for KYC.' });
      return;
    }
    if (passportScanFileSize > 8 * 1024 * 1024 || selfiePhotoFileSize > 8 * 1024 * 1024) {
      sendJson(res, 400, { error: 'Passport/ID scan and selfie files must each be under 8MB.' });
      return;
    }
    if (proofOfAddressFileSize > 12 * 1024 * 1024) {
      sendJson(res, 400, { error: 'Proof of address file must be under 12MB.' });
      return;
    }

    auth.user.kycProfile = {
      legalName,
      dateOfBirth,
      country,
      idType,
      idNumber,
      addressLine1,
      city,
      stateOrProvince,
      postalCode,
      passportScanFileName,
      passportScanFileType,
      passportScanFileSize,
      selfiePhotoFileName,
      selfiePhotoFileType,
      selfiePhotoFileSize,
      proofOfAddressFileName,
      proofOfAddressFileType,
      proofOfAddressFileSize,
      note,
      submittedAt: nowIso(),
    };

    auth.user.withdrawalAccess.status = 'pending_review';
    auth.user.withdrawalAccess.reason = 'KYC documents submitted and awaiting review.';
    auth.user.withdrawalAccess.requestedAt = nowIso();
    auth.user.withdrawalAccess.reviewedAt = null;

    addAuditLog(db, 'user_requested_kyc_review', {
      userId: auth.user.id,
      idType,
      country,
      hasPassportScan: Boolean(passportScanFileName),
      hasSelfie: Boolean(selfiePhotoFileName),
      hasProofOfAddress: Boolean(proofOfAddressFileName),
      note,
    });
    addNotification(db, 'kyc_review_requested', {
      userId: auth.user.id,
      email: auth.user.email,
      idType,
      country,
      hasPassportScan: Boolean(passportScanFileName),
      hasSelfie: Boolean(selfiePhotoFileName),
      hasProofOfAddress: Boolean(proofOfAddressFileName),
    });

    writeDb(db);
    sendJson(res, 200, {
      message: 'KYC review request submitted.',
      withdrawalAccess: auth.user.withdrawalAccess,
    });
    return;
  }

  if (pathname === '/api/deposits' && method === 'GET') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    const deposits = db.deposits
      .filter((deposit) => deposit.userId === auth.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    writeDb(db);
    sendJson(res, 200, { deposits });
    return;
  }

  if (pathname === '/api/deposits/request' && method === 'POST') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    if (!db.config.system.depositsEnabled) {
      sendJson(res, 403, { error: 'Deposits are temporarily disabled.' });
      return;
    }

    const cryptoConfig = readCryptoConfig(db);
    if (!cryptoConfig.walletAddress) {
      sendJson(res, 400, { error: 'Deposit wallet address is not configured by admin yet.' });
      return;
    }

    const body = await parseBody(req);
    const amount = Number(body.amount);
    const requestedNetwork = normalizeNetworkName(body.network || cryptoConfig.defaultNetwork || '');
    const txReference = String(body.txReference || '').trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      sendJson(res, 400, { error: 'Deposit amount must be greater than zero.' });
      return;
    }
    if (amount < 50) {
      sendJson(res, 400, { error: 'Minimum deposit is $50.' });
      return;
    }
    const selectedNetwork =
      cryptoConfig.enabledNetworks.find((network) => networkKey(network) === networkKey(requestedNetwork)) || '';
    if (!selectedNetwork) {
      sendJson(res, 400, { error: 'Selected network is not enabled.' });
      return;
    }
    if (txReference.length < 6) {
      sendJson(res, 400, { error: 'Transaction reference is required.' });
      return;
    }

    const deposit = {
      id: randomId('dep'),
      userId: auth.user.id,
      amount: normalizeMoney(amount),
      method: cryptoConfig.assetSymbol || DEFAULT_ASSET_SYMBOL,
      network: selectedNetwork,
      walletAddress: cryptoConfig.walletAddress,
      txReference,
      status: 'pending',
      createdAt: nowIso(),
      reviewedAt: null,
      reviewNote: '',
    };

    db.deposits.push(deposit);
    addAuditLog(db, 'deposit_requested', {
      userId: auth.user.id,
      depositId: deposit.id,
      amount: deposit.amount,
      method: deposit.method,
      network: deposit.network,
    });
    addNotification(db, 'deposit_requested', {
      userId: auth.user.id,
      depositId: deposit.id,
      amount: deposit.amount,
    });

    writeDb(db);
    sendJson(res, 201, {
      message: 'Deposit request submitted for review.',
      deposit,
    });
    return;
  }

  if ((pathname === '/api/simulator/payments' || pathname === '/api/wallet/payments') && method === 'GET') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    const items = db.cryptoPaymentRequests
      .filter((item) => item.userId === auth.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    writeDb(db);
    sendJson(res, 200, { paymentRequests: items });
    return;
  }

  if ((pathname === '/api/simulator/payments' || pathname === '/api/wallet/payments') && method === 'POST') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    const cryptoConfig = readCryptoConfig(db);
    if (!cryptoConfig.walletPaymentsEnabled) {
      sendJson(res, 403, { error: 'Wallet payment requests are currently disabled.' });
      return;
    }

    const body = await parseBody(req);
    const amount = Number(body.amount);
    const requestedNetwork = normalizeNetworkName(body.network || cryptoConfig.defaultNetwork || '');
    const txReference = String(body.txReference || '').trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      sendJson(res, 400, { error: 'Amount must be greater than zero.' });
      return;
    }
    const selectedNetwork =
      cryptoConfig.enabledNetworks.find((network) => networkKey(network) === networkKey(requestedNetwork)) || '';
    if (!selectedNetwork) {
      sendJson(res, 400, { error: 'Selected network is not enabled.' });
      return;
    }
    if (txReference.length < 6) {
      sendJson(res, 400, { error: 'Transaction reference is required.' });
      return;
    }

    const fifteenMinutesAgo = Date.now() - 15 * 60 * 1000;
    const recentAttempts = db.cryptoPaymentRequests.filter((item) => {
      if (item.userId !== auth.user.id) return false;
      return new Date(item.createdAt).getTime() > fifteenMinutesAgo;
    });

    if (recentAttempts.length >= 5) {
      sendJson(res, 429, {
        error: 'Too many verification attempts. Please wait 15 minutes and try again.',
      });
      return;
    }

    const paymentRequest = {
      id: randomId('cpr'),
      userId: auth.user.id,
      amount: normalizeMoney(amount),
      asset: cryptoConfig.assetSymbol || DEFAULT_ASSET_SYMBOL,
      network: selectedNetwork,
      walletAddress: cryptoConfig.walletAddress || '(not configured)',
      txReference,
      status: 'pending_verification',
      createdAt: nowIso(),
      reviewedAt: null,
      reviewNote: '',
    };

    db.cryptoPaymentRequests.push(paymentRequest);
    addAuditLog(db, 'wallet_payment_submitted', {
      userId: auth.user.id,
      paymentRequestId: paymentRequest.id,
      network: selectedNetwork,
      amount: paymentRequest.amount,
    });
    addNotification(db, 'wallet_payment_submitted', {
      userId: auth.user.id,
      paymentRequestId: paymentRequest.id,
    });

    writeDb(db);
    sendJson(res, 201, {
      message: 'Verification in progress (usually takes 10-30 minutes).',
      paymentRequest,
    });
    return;
  }

  if (pathname === '/api/me' && method === 'GET') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    settleMaturedInvestments(db, auth.user.id);
    const dashboardKpis = computeUserDashboardKpis(db, auth.user);
    writeDb(db);

    sendJson(res, 200, { user: safeUser(auth.user), dashboardKpis });
    return;
  }

  if (pathname === '/api/investments' && method === 'GET') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    settleMaturedInvestments(db, auth.user.id);

    const investments = db.investments
      .filter((investment) => investment.userId === auth.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    writeDb(db);
    sendJson(res, 200, { investments });
    return;
  }

  if (pathname === '/api/investments' && method === 'POST') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    if (!db.config.system.investmentsEnabled) {
      sendJson(res, 403, { error: 'Investments are temporarily disabled.' });
      return;
    }

    const body = await parseBody(req);
    const planId = String(body.planId || '').trim().toLowerCase();
    const amount = Number(body.amount);

    const plan = plans.find((candidate) => candidate.id === planId);
    if (!plan) {
      sendJson(res, 400, { error: 'Invalid plan selected.' });
      return;
    }

    if (!Number.isFinite(amount)) {
      sendJson(res, 400, { error: 'Amount must be a valid number.' });
      return;
    }

    if (amount < plan.min || amount > plan.max) {
      sendJson(res, 400, {
        error: `Amount for ${plan.name} must be between $${plan.min.toLocaleString()} and $${plan.max.toLocaleString()}.`,
      });
      return;
    }

    settleMaturedInvestments(db, auth.user.id);

    if (auth.user.balance < amount) {
      sendJson(res, 400, { error: 'Insufficient available balance.' });
      return;
    }

    auth.user.balance = normalizeMoney(auth.user.balance - amount);

    const createdAt = new Date();
    const endAt = new Date(createdAt.getTime() + plan.durationHours * 60 * 60 * 1000);

    const investment = {
      id: randomId('inv'),
      userId: auth.user.id,
      planId: plan.id,
      planName: plan.name,
      amount: normalizeMoney(amount),
      returnPercent: plan.returnPercent,
      status: 'active',
      createdAt: createdAt.toISOString(),
      endAt: endAt.toISOString(),
    };

    db.investments.push(investment);
    writeDb(db);

    sendJson(res, 201, {
      message: `${plan.name} plan started successfully.`,
      investment,
      balance: auth.user.balance,
    });
    return;
  }

  if (pathname === '/api/withdrawals' && method === 'GET') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    settleMaturedInvestments(db, auth.user.id);

    const withdrawals = db.withdrawals
      .filter((withdrawal) => withdrawal.userId === auth.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    writeDb(db);
    sendJson(res, 200, { withdrawals });
    return;
  }

  if (pathname === '/api/withdrawals/code/request' && method === 'POST') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    if (!db.config.system.withdrawalsEnabled) {
      sendJson(res, 403, { error: 'Withdrawals are temporarily disabled.' });
      return;
    }

    settleMaturedInvestments(db, auth.user.id);

    if (auth.user.withdrawalAccess.status !== 'approved') {
      sendJson(res, 423, {
        error: 'Withdrawals are locked pending KYC approval.',
        withdrawalAccess: auth.user.withdrawalAccess,
      });
      return;
    }

    const lastSentAt = auth.user.withdrawalOtp.lastSentAt
      ? new Date(auth.user.withdrawalOtp.lastSentAt).getTime()
      : 0;
    const earliestResend = lastSentAt + WITHDRAWAL_CODE_RESEND_SECONDS * 1000;
    if (Date.now() < earliestResend) {
      const waitSeconds = Math.max(1, Math.ceil((earliestResend - Date.now()) / 1000));
      sendJson(res, 429, { error: `Please wait ${waitSeconds} seconds before requesting another code.` });
      return;
    }

    const emailDelivered = await issueWithdrawalOtpCode(db, auth.user, 'withdrawal_request');
    writeDb(db);
    sendJson(res, 200, {
      message: emailDelivered
        ? 'Withdrawal verification code sent to your email.'
        : 'Email delivery is currently unavailable. Please retry later or contact support.',
      emailDelivery: emailDelivered,
      withdrawalOtp: safeWithdrawalOtp(auth.user),
    });
    return;
  }

  if (pathname === '/api/withdrawals' && method === 'POST') {
    if (!auth) {
      sendJson(res, 401, { error: 'Authentication required.' });
      return;
    }

    if (!db.config.system.withdrawalsEnabled) {
      sendJson(res, 403, { error: 'Withdrawals are temporarily disabled.' });
      return;
    }

    const body = await parseBody(req);
    const amount = Number(body.amount);
    const methodInput = String(body.method || '').trim().toLowerCase();
    const method = methodInput === 'bank' ? 'bank' : methodInput === 'crypto' ? 'crypto' : '';
    const code = String(body.code || '').trim();

    if (!Number.isFinite(amount) || amount <= 0) {
      sendJson(res, 400, { error: 'Withdrawal amount must be greater than zero.' });
      return;
    }

    if (amount < 100) {
      sendJson(res, 400, { error: 'Minimum withdrawal is $100.' });
      return;
    }

    settleMaturedInvestments(db, auth.user.id);

    if (auth.user.withdrawalAccess.status !== 'approved') {
      sendJson(res, 423, {
        error: 'Withdrawals are locked pending KYC approval.',
        withdrawalAccess: auth.user.withdrawalAccess,
      });
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      sendJson(res, 400, { error: 'Withdrawal code must be a 6-digit value.' });
      return;
    }

    if (!auth.user.withdrawalOtp.codeHash || !auth.user.withdrawalOtp.codeExpiresAt) {
      sendJson(res, 400, { error: 'No active withdrawal code. Request a new code first.' });
      return;
    }

    if (new Date(auth.user.withdrawalOtp.codeExpiresAt).getTime() < Date.now()) {
      sendJson(res, 400, { error: 'Withdrawal code has expired. Request a new code.' });
      return;
    }

    if (auth.user.withdrawalOtp.attempts >= WITHDRAWAL_CODE_MAX_ATTEMPTS) {
      sendJson(res, 429, { error: 'Too many failed attempts. Request a new withdrawal code.' });
      return;
    }

    const incomingHash = verificationCodeHash(code);
    if (incomingHash !== auth.user.withdrawalOtp.codeHash) {
      auth.user.withdrawalOtp.attempts += 1;
      writeDb(db);
      sendJson(res, 400, { error: 'Invalid withdrawal code.' });
      return;
    }

    if (!method) {
      sendJson(res, 400, { error: 'Withdrawal method is required (crypto or bank).' });
      return;
    }

    let destination;
    if (method === 'crypto') {
      const asset = String(body.asset || '').trim().toUpperCase();
      const network = String(body.network || '').trim().toUpperCase();
      const walletAddress = String(body.walletAddress || '').trim();

      if (!asset || !network || !walletAddress) {
        sendJson(res, 400, {
          error: 'Crypto withdrawals require asset, network, and wallet address.',
        });
        return;
      }

      destination = {
        method: 'crypto',
        asset,
        network,
        walletAddress,
      };
    } else {
      const bankName = String(body.bankName || '').trim();
      const accountName = String(body.accountName || '').trim();
      const accountNumber = String(body.accountNumber || '').trim();
      const iban = String(body.iban || '').trim();
      const swiftCode = String(body.swiftCode || '').trim().toUpperCase();
      const country = String(body.bankCountry || '').trim();

      if (!bankName || !accountName || !accountNumber) {
        sendJson(res, 400, {
          error: 'Bank withdrawals require bank name, account name, and account number.',
        });
        return;
      }

      destination = {
        method: 'bank',
        bankName,
        accountName,
        accountNumber,
        iban,
        swiftCode,
        country,
      };
    }

    const feePercent = 1.5;
    const fee = normalizeMoney(amount * (feePercent / 100));
    const totalDebit = normalizeMoney(amount + fee);

    if (auth.user.balance < totalDebit) {
      sendJson(res, 400, {
        error: `Insufficient available balance. ${feePercent}% processing fee applies.`,
      });
      return;
    }

    auth.user.balance = normalizeMoney(auth.user.balance - totalDebit);
    auth.user.withdrawalOtp.codeHash = '';
    auth.user.withdrawalOtp.codeExpiresAt = null;
    auth.user.withdrawalOtp.lastSentAt = null;
    auth.user.withdrawalOtp.attempts = 0;
    auth.user.withdrawalOtp.devLastCode = '';

    const withdrawal = {
      id: randomId('wd'),
      userId: auth.user.id,
      amount: normalizeMoney(amount),
      fee,
      netAmount: normalizeMoney(amount - fee),
      method,
      destination,
      status: 'processing',
      createdAt: nowIso(),
    };

    db.withdrawals.push(withdrawal);
    addAuditLog(db, 'withdrawal_requested', {
      userId: auth.user.id,
      withdrawalId: withdrawal.id,
      amount: withdrawal.amount,
      fee,
      method,
    });
    writeDb(db);

    sendJson(res, 201, {
      message: 'Withdrawal request submitted.',
      withdrawal,
      balance: auth.user.balance,
    });
    return;
  }

  response404(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      response404(res);
      return;
    }

    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname.startsWith('/api/')) {
      await handleApi(req, res, url);
      return;
    }

    if (url.pathname.startsWith('/assets/')) {
      const filePath = path.join(__dirname, 'public', url.pathname);
      sendFile(res, filePath);
      return;
    }

    if (url.pathname.startsWith('/wp-content/uploads/')) {
      const relative = url.pathname.replace('/wp-content/uploads/', '');
      const filePath = path.join(__dirname, 'public', 'assets', 'images', relative);
      sendFile(res, filePath);
      return;
    }

    const relativePath = routeMap[url.pathname];
    if (!relativePath) {
      response404(res);
      return;
    }

    sendFile(res, path.join(__dirname, relativePath));
  } catch (error) {
    sendJson(res, 500, { error: error.message || 'Server error' });
  }
});

ensureDb();
warnPersistenceSetup();
warnAdminCredentialSetup();
warnEmailSetup();

server.listen(PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${PORT}`);
});
