const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Generate a cryptographically secure random hex string
 * @param {number} bytes - Number of random bytes to generate
 * @returns {string} Hex string (length = bytes * 2)
 */
function generateSecureKey(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate RSA key pair for license signing
 * @returns {{ privateKey: string, publicKey: string }}
 */
function generateRSAKeyPair() {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });
  
  return { privateKey, publicKey };
}

console.log('\n🔐 Starting environment setup...\n');

// Create config directory
const configDir = path.join(__dirname, 'apps', 'backend', 'src', 'config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
  console.log('✓ Created config directory');
}

// Backend environment files
const backendDir = path.join(__dirname, 'apps', 'backend');
const backendEnvExample = path.join(backendDir, '.env.example');
const backendEnv = path.join(backendDir, '.env');

// Frontend environment files
const frontendDir = path.join(__dirname, 'apps', 'frontend');
const frontendEnvExample = path.join(frontendDir, '.env.example');
const frontendEnv = path.join(frontendDir, '.env');

// RSA key paths
const utilsDir = path.join(__dirname, 'apps', 'backend', 'src', 'utils');
const privateKeyPath = path.join(utilsDir, 'private_key.pem');
const publicKeyPath = path.join(utilsDir, 'public_key.pem');

// Generate symmetric secrets
const jwtSecret = generateSecureKey(32); // 64 character hex string
const apiKeySecret = generateSecureKey(32); // 64 character hex string

console.log('✓ Generated JWT_SECRET (64 characters)');
console.log('✓ Generated API_KEY_SECRET (64 characters)');

// Create backend .env from .env.example with generated keys
if (fs.existsSync(backendEnvExample)) {
  if (!fs.existsSync(backendEnv)) {
    let envContent = fs.readFileSync(backendEnvExample, 'utf8');
    
    // Replace placeholder values with generated secrets
    envContent = envContent.replace(
      /JWT_SECRET=.*/,
      `JWT_SECRET=${jwtSecret}`
    );
    envContent = envContent.replace(
      /API_KEY_SECRET=.*/,
      `API_KEY_SECRET=${apiKeySecret}`
    );
    
    fs.writeFileSync(backendEnv, envContent);
    console.log('✓ Created apps/backend/.env with generated secrets');
  } else {
    console.log('ℹ apps/backend/.env already exists, skipping...');
  }
} else {
  console.warn('⚠ apps/backend/.env.example not found');
}

// Create frontend .env from .env.example if it doesn't exist
if (fs.existsSync(frontendEnvExample)) {
  if (!fs.existsSync(frontendEnv)) {
    fs.copyFileSync(frontendEnvExample, frontendEnv);
    console.log('✓ Created apps/frontend/.env from .env.example');
  } else {
    console.log('ℹ apps/frontend/.env already exists, skipping...');
  }
} else {
  console.warn('⚠ apps/frontend/.env.example not found');
}

// Generate RSA key pair for license management
console.log('\n🔑 Generating RSA key pair for license management...');

const { privateKey, publicKey } = generateRSAKeyPair();

// Ensure utils directory exists
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// Save RSA keys
fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

console.log('✓ Generated RSA private key (2048-bit)');
console.log('✓ Generated RSA public key (2048-bit)');
console.log(`✓ Saved to apps/backend/src/utils/private_key.pem`);
console.log(`✓ Saved to apps/backend/src/utils/public_key.pem`);

console.log('\n✅ Environment setup complete!');
console.log('\n📋 Generated Keys Summary:');
console.log('  • JWT_SECRET: 64-character hex string');
console.log('  • API_KEY_SECRET: 64-character hex string');
console.log('  • RSA Key Pair: 2048-bit for license signing');
console.log('\n⚠️  SECURITY WARNING:');
console.log('  • NEVER commit private_key.pem to version control');
console.log('  • Keep your private key secure and backed up');
console.log('  • The private key is used to sign license keys');
console.log('  • The public key is used by clients to verify licenses');
console.log('\n💡 Next steps:');
console.log('  1. Review and update apps/backend/.env with your SMTP and reCAPTCHA configuration');
console.log('  2. Review and update apps/frontend/.env if needed');
console.log('  3. Run "pnpm dev" to start the development servers');
