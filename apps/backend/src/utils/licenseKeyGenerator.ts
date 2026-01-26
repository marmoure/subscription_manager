/**
 * License Key Generator Utility
 * 
 * This utility generates RSA-signed license keys for FastFood applications.
 * 
 * SETUP:
 * 1. Generate RSA key pair (run once):
 *    openssl genrsa -out private_key.pem 2048
 *    openssl rsa -in private_key.pem -pubout -out public_key.pem
 * 
 * 2. Copy the public key content to LICENSE_CONFIG.PUBLIC_KEY in src/lib/license.ts
 * 
 * 3. Keep private_key.pem SECURE and NEVER distribute it with the app
 * 
 * USAGE:
 * node generate-license.js <machineID> <appName> <maxUsers> [daysLeft]
 * 
 * Parameters:
 * - machineID: Required, unique hardware identifier (from app)
 * - appName: Required, application name (e.g., "Le Grill Food")
 * - maxUsers: Required, maximum number of users allowed
 * - daysLeft: Optional, number of valid days (omit for permanent license)
 * 
 * Examples:
 * node generate-license.js ABCD1234EFGH "Le Grill Food" 5 90
 * node generate-license.js ABCD1234EFGH "Le Grill Food" 10     (permanent license)
 * 
 * The machine ID can be obtained from the app by:
 * - Going to Owner > License page
 * - Viewing the Machine ID
 * - Or calling GET /api/license/machine-id
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Helper to handle both ESM and CJS (for Jest compatibility)
const getPathInfo = () => {
  try {
    const metaUrl = eval('import.meta.url');
    const filename = fileURLToPath(metaUrl);
    return {
      __filename: filename,
      __dirname: path.dirname(filename)
    };
  } catch {
    // Fallback for environments where import.meta is not available (like some Jest configs)
    return {
      __filename: typeof __filename !== 'undefined' ? __filename : '',
      __dirname: typeof __dirname !== 'undefined' ? __dirname : process.cwd()
    };
  }
};

const { __filename: __filename_val, __dirname: __dirname_val } = getPathInfo();

// Configuration
const PRIVATE_KEY_PATH = path.join(__dirname_val, 'private_key.pem');

/**
 * Generate a license key
 * @param machineId - Required machine ID for binding license to specific machine
 * @param appName - Required application name
 * @param maxUsers - Maximum number of users allowed
 * @param daysValid - Optional number of days until expiry (omit for permanent license)
 */
function generateLicense(
  machineId: string,
  appName: string,
  maxUsers: number, 
  daysValid?: number
): { serialKey: string; payload: any; expiresDate: string | null; issueDate: string } {
  // Check if private key exists
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error('Private key not found for license generation. Please ensure private_key.pem exists in the utils directory.');
  }

  // Validate required fields
  if (!machineId || typeof machineId !== 'string' || machineId.trim().length === 0) {
    throw new Error('machineID is required and must be a non-empty string');
  }

  if (!appName || typeof appName !== 'string' || appName.trim().length === 0) {
    throw new Error('appName is required and must be a non-empty string');
  }

  if (!maxUsers || typeof maxUsers !== 'number' || maxUsers < 1) {
    throw new Error('maxUsers is required and must be a positive number');
  }

  // Read private key
  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');

  // Create license payload with issue date
  const issueDate = new Date().toISOString();
  const payload: any = {
    machineId: machineId.trim(),
    appName: appName.trim(),
    maxUsers,
    issueDate,
  };
  
  // Add daysValid only if provided (for expiring licenses)
  let expiryDate: string | null = null;
  if (daysValid !== undefined && daysValid !== null) {
    payload.daysValid = daysValid;
    expiryDate = new Date(Date.now() + (daysValid * 24 * 60 * 60 * 1000)).toISOString();
  }

  // Convert payload to JSON
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadJson).toString('base64');

  // Sign the payload
  const signer = crypto.createSign('SHA256');
  signer.update(payloadJson);
  const signature = signer.sign(privateKey);
  const signatureB64 = signature.toString('base64');

  // Create serial key: <payload>.<signature>
  const serialKey = `${payloadB64}.${signatureB64}`;

  return {
    serialKey,
    payload,
    expiresDate: expiryDate,
    issueDate,
  };
}

/**
 * Verify a license key (for testing)
 */
function verifyLicense(serialKey: string, publicKeyPath: string) {
  try {
    const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
    
    const parts = serialKey.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid serial format' };
    }

    const [payloadB64, signatureB64] = parts;
    const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson);
    const signature = Buffer.from(signatureB64, 'base64');

    const verifier = crypto.createVerify('SHA256');
    verifier.update(payloadJson);
    const isValid = verifier.verify(publicKey, signature);

    return { valid: isValid, payload };
  } catch (err) {
    console.error('❌ Error verifying license key:', err);
    return { valid: false, error: err instanceof Error ? err.message : String(err)};
  }
}

// ====================
// CLI Interface
// ====================

function printUsage() {
  console.log('\n' + '='.repeat(70));
  console.log('🔑 FastFood License Key Generator');
  console.log('='.repeat(70));
  console.log('\nUSAGE:');
  console.log('  node generate-license.js <machineID> <appName> <maxUsers> [daysLeft]');
  console.log('\nEXAMPLES:');
  console.log('  node generate-license.js ABCD1234EFGH "Le Grill Food" 5 90');
  console.log('  node generate-license.js ABCD1234EFGH "My Restaurant" 10');
  console.log('  (second example = permanent license, never expires)');
  console.log('\nPARAMETERS:');
  console.log('  machineID       - Required. Unique hardware identifier');
  console.log('                    Get from app: Owner > License page');
  console.log('                    Or call: GET /api/license/machine-id');
  console.log('  appName         - Required. Application name (e.g., "Le Grill Food")');
  console.log('                    This name will be displayed in the app');
  console.log('  maxUsers        - Required. Maximum number of users allowed');
  console.log('  daysLeft        - Optional. Number of days until expiry');
  console.log('                    If omitted, license is PERMANENT (never expires)');
  console.log('\nIMPORTANT:');
  console.log('  - Machine binding is MANDATORY for security');
  console.log('  - appName comes ONLY from the serial key, not from config');
  console.log('  - appName and machineID are immutable once issued');
  console.log('  - Business information (address, phone) is set after activation');
  console.log('  - Permanent licenses never expire and have no grace period');
  console.log('\nVERIFY:');
  console.log('  node generate-license.js --verify <serialKey> <publicKeyPath>');
  console.log('='.repeat(70) + '\n');
}

// Parse command line arguments
const args = process.argv.slice(2);

// Check if this file is being run directly
const isMain = process.argv[1] && (
  process.argv[1] === __filename_val || 
  process.argv[1].endsWith('licenseKeyGenerator.ts') ||
  process.argv[1].endsWith('licenseKeyGenerator.js')
);

if (isMain) {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  // Verify mode
  if (args[0] === '--verify') {
    if (args.length < 3) {
      console.error('❌ Error: --verify requires <serialKey> and <publicKeyPath>');
      process.exit(1);
    }

    const serialKey = args[1];
    const publicKeyPath = args[2];

    console.log('\n🔍 Verifying license key...\n');
    const result = verifyLicense(serialKey, publicKeyPath);

    if (result.valid) {
      console.log('✅ License key is VALID');
      console.log('\nPayload:');
      console.log(JSON.stringify(result.payload, null, 2));
    } else {
      console.log('❌ License key is INVALID');
      if (result.error) {
        console.log(`Error: ${result.error}`);
      }
    }
    console.log('');
    process.exit(result.valid ? 0 : 1);
  }

  // Generate mode
  const machineId = args[0] || '';
  const appName = args[1] || '';
  const maxUsers = args[2] ? parseInt(args[2]) : null;
  const daysValid = args[3] ? parseInt(args[3]) : undefined;

  // Validate required parameters
  if (!machineId || machineId.trim().length === 0) {
    console.error('❌ Error: machineID is required');
    printUsage();
    process.exit(1);
  }

  if (!appName || appName.trim().length === 0) {
    console.error('❌ Error: appName is required');
    printUsage();
    process.exit(1);
  }

  if (!maxUsers || maxUsers < 1) {
    console.error('❌ Error: maxUsers is required and must be a positive number');
    printUsage();
    process.exit(1);
  }

  console.log('\n' + '='.repeat(70));
  console.log('🔑 Generating License Key');
  console.log('='.repeat(70));

  const license = generateLicense(machineId, appName, maxUsers, daysValid);

  console.log('\n✅ License key generated successfully!\n');
  console.log('Machine ID:    ', machineId);
  console.log('App Name:      ', appName);
  console.log('Max Users:     ', maxUsers);
  console.log('Issue Date:    ', license.issueDate);
  console.log('Expires:       ', license.expiresDate || 'Never (Permanent)');
  console.log('\n' + '-'.repeat(70));
  console.log('SERIAL KEY:');
  console.log('-'.repeat(70));
  console.log(license.serialKey);
  console.log('-'.repeat(70));
  console.log('\n⚠️  IMPORTANT:');
  console.log('  - Keep this serial key secure');
  console.log('  - Provide it to the customer for activation');
  console.log('  - Keep a record of issued licenses');
  console.log('  - Never share your private_key.pem file');
  console.log('  - This license is bound to machine: ' + machineId);
  console.log('='.repeat(70) + '\n');

  // Save to log file
  const logEntry: any = {
    machineId,
    appName,
    maxUsers,
    issueDate: license.issueDate,
    daysValid: daysValid || null,
    expiresDate: license.expiresDate,
    generatedAt: new Date().toISOString(),
    serialKey: license.serialKey,
  };

  const logPath = path.join(__dirname_val, 'license-log.json');
  let logs = [];

  if (fs.existsSync(logPath)) {
    try {
      logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    } catch (err) {
      console.warn('⚠️  Warning: Could not read existing log file');
    }
  }

  logs.push(logEntry);
  fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

  console.log(`📝 License logged to: ${logPath}\n`);
}

export { generateLicense, verifyLicense };
