import { LicenseRequestFormValues } from '@/schemas/licenseRequest.schema';
import { client } from '../lib/rpc-client';

export interface LicenseResponse {
  success: boolean;
  message: string;
  data?: {
    licenseKey: string;
    expiresAt: string;
  };
  error?: string;
  errors?: any; // For validation errors
}

export class ApiError extends Error {
  constructor(public message: string, public data?: any) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Submits a new license request.
 * @param data The license request form data
 */
export const submitLicenseRequest = async (data: LicenseRequestFormValues): Promise<LicenseResponse> => {
  const response = await client.api.public['submit-license-request'].$post({
    json: data
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to submit license request', errorData);
  }

  const result = await response.json();
  // Ensure the result matches LicenseResponse structure.
  // The backend returns { success: true, message: string, data: { licenseKey, expiresAt } }
  // which matches LicenseResponse.
  return result as unknown as LicenseResponse;
};

/**
 * Verifies a license key by machine ID.
 * @param machineId The machine ID to verify
 */
export const verifyLicense = async (machineId: string) => {
  const response = await client.api.v1['verify-license'].$post({
    json: { machineId }
  });

  if (!response.ok) {
     const errorData = await response.json() as any;
     throw new ApiError(errorData.message || 'Failed to verify license', errorData);
  }

  return await response.json();
};

