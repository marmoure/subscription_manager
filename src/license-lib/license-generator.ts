import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export interface LicensePayload {
  machineId: string;
  appName: string;
  maxUsers: number;
  issueDate: string;
  daysValid?: number;
}

export interface LicenseResult {
  serialKey: string;
  payload: LicensePayload;
  expiresDate: string | null;
  issueDate: string;
}

const PRIVATE_KEY_PATH = path.join(__dirname, 'private_key.pem');

/**
 * Generate a license key using RSA signing
 * @param machineId - Required machine ID for binding license to specific machine
 * @param appName - Required application name
 * @param maxUsers - Maximum number of users allowed
 * @param daysValid - Optional number of days until expiry (omit for permanent license)
 * @returns License object with serial key and metadata
 */
export function generateLicense(
  machineId: string,
  appName: string,
  maxUsers: number,
  daysValid?: number
): LicenseResult {
  // Check if private key exists
  if (!fs.existsSync(PRIVATE_KEY_PATH)) {
    throw new Error('private_key.pem not found. Please generate RSA key pair first.');
  }

  // Validate required fields
  if (!machineId || typeof machineId !== 'string' || machineId.trim().length === 0) {
    throw new Error('machineId is required and must be a non-empty string');
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
  const payload: LicensePayload = {
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
 * Verify a license key (for testing purposes)
 * @param serialKey - The license serial key to verify
 * @param publicKeyPath - Path to the public key file
 * @returns Verification result with validity status and payload
 */
export function verifyLicense(serialKey: string, publicKeyPath: string) {
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
    return { 
      valid: false, 
      error: err instanceof Error ? err.message : String(err)
    };
  }
}