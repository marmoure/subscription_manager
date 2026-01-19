export { generateLicense, verifyLicense } from './license-generator';
export type { LicensePayload, LicenseResult } from './license-generator';

/**
 * Simple wrapper to generate license key
 * @param machineId - Machine identifier for license binding
 * @param appName - Application name
 * @param maxUsers - Maximum allowed users
 * @param daysValid - Optional days until expiry
 * @returns Generated license serial key
 */
export function generateLicenseKey(
  machineId: string,
  appName: string,
  maxUsers: number,
  daysValid?: number
): string {
  const { generateLicense: genLicense } = require('./license-generator');
  const result = genLicense(machineId, appName, maxUsers, daysValid);
  return result.serialKey;
}