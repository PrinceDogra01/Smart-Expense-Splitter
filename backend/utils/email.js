const nodemailer = require('nodemailer');

// Support multiple env naming conventions: SMTP_*, EMAIL_*, and SENDGRID_API_KEY
const getEnv = (keys) => {
  for (const key of keys) {
    const v = process.env[key];
    if (v !== undefined && v !== '') return v;
  }
  return undefined;
};

/**
 * Returns email config from env. Tries, in order:
 * - SENDGRID_API_KEY → SendGrid SMTP
 * - SMTP_HOST + SMTP_USER + SMTP_PASS
 * - EMAIL_HOST + EMAIL_USER + EMAIL_PASS
 */
function getEmailConfig() {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    return {
      host: 'smtp.sendgrid.net',
      port: 587,
      secure: false,
      auth: { user: 'apikey', pass: sendgridKey },
      from: getEnv(['FROM_EMAIL', 'SENDGRID_FROM_EMAIL', 'EMAIL_USER', 'SMTP_USER']) || 'no-reply@splitx.com',
      provider: 'sendgrid',
    };
  }

  const host = getEnv(['SMTP_HOST', 'EMAIL_HOST']);
  const user = getEnv(['SMTP_USER', 'EMAIL_USER']);
  const pass = getEnv(['SMTP_PASS', 'EMAIL_PASS']);

  if (!host || !user || !pass) return null;

  const port = getEnv(['SMTP_PORT', 'EMAIL_PORT']);
  const secure = (getEnv(['SMTP_SECURE', 'EMAIL_SECURE']) || '').toLowerCase() === 'true';

  return {
    host,
    port: port ? Number(port) : secure ? 465 : 587,
    secure,
    auth: { user, pass },
    from: getEnv(['FROM_EMAIL', 'EMAIL_FROM', 'SMTP_USER', 'EMAIL_USER']) || 'no-reply@splitx.com',
    provider: 'smtp',
  };
}

function isEmailConfigured() {
  const config = getEmailConfig();
  return config !== null;
}

/**
 * Log which email provider is configured (no secrets). Call at startup.
 */
function logEmailConfigStatus() {
  const config = getEmailConfig();
  if (config) {
    console.log(`[Email] Configured (${config.provider}): host=${config.host}, port=${config.port}`);
  } else {
    console.warn(
      '[Email] Not configured. Set one of:\n' +
      '  - SENDGRID_API_KEY (and optionally FROM_EMAIL)\n' +
      '  - SMTP_HOST + SMTP_USER + SMTP_PASS\n' +
      '  - EMAIL_HOST + EMAIL_USER + EMAIL_PASS'
    );
  }
}

function getTransporter() {
  const config = getEmailConfig();
  if (!config) {
    throw new Error(
      'Email not configured. Set SENDGRID_API_KEY, or SMTP_HOST/SMTP_USER/SMTP_PASS, or EMAIL_HOST/EMAIL_USER/EMAIL_PASS in .env'
    );
  }
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
  });
}

function getFrom() {
  const config = getEmailConfig();
  return config ? config.from : 'no-reply@splitx.com';
}

/**
 * Send email. Uses getEmailConfig() so all env variants are supported.
 * Calls transporter.verify() before sending when NODE_ENV is not test.
 */
async function sendMail(options) {
  const config = getEmailConfig();
  if (!config) {
    const msg =
      'Email is not configured. Set SENDGRID_API_KEY, or SMTP_HOST/SMTP_USER/SMTP_PASS, or EMAIL_HOST/EMAIL_USER/EMAIL_PASS in .env';
    throw new Error(msg);
  }

  const transporter = getTransporter();
  try {
    if (process.env.NODE_ENV !== 'test') {
      await transporter.verify();
    }
  } catch (err) {
    console.error('[Email] Verify failed:', err.message);
    throw new Error('Email service could not connect. Check host, port, and credentials.');
  }

  const from = getFrom();
  await transporter.sendMail({ from, ...options });
}

module.exports = {
  getEmailConfig,
  getTransporter,
  getFrom,
  sendMail,
  isEmailConfigured,
  logEmailConfigStatus,
};
