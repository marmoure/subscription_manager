import { apiClient } from './api';

export interface LicenseListResponse {
  success: boolean;
  data: LicenseDataItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SubmissionDataItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  shopName: string;
  machineId: string;
  numberOfCashiers: number;
  submissionDate: string;
  ipAddress?: string;
  licenseKey?: {
    id: number;
    licenseKey: string;
    status: string;
    expiresAt: string | null;
  } | null;
}

export interface SubmissionListResponse {
  success: boolean;
  data: SubmissionDataItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LicenseDataItem {
  id: number;
  licenseKey: string;
  machineId: string;
  status: 'active' | 'inactive' | 'revoked';
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  submission: {
    id: number;
    name: string;
    email: string;
    phone: string;
    shopName: string;
    numberOfCashiers: number;
    submissionDate: string;
  } | null;
  verificationLogs?: Array<{
    id: number;
    timestamp: string;
    status: 'success' | 'failed';
    message: string;
    ipAddress: string | null;
  }>;
  statusLogs?: Array<{
    id: number;
    oldStatus: string | null;
    newStatus: string;
    reason: string | null;
    timestamp: string;
    admin: {
      username: string;
      email: string;
    } | null;
  }>;
  metadata?: {
    verificationAttempts: number;
    lastVerification: string | null;
  };
}

export const getLicenses = async (
  page: number = 1,
  limit: number = 20,
  status?: string,
  search?: string
): Promise<LicenseListResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status) {
    params.append('status', status);
  }
  if (search) {
    params.append('search', search);
  }

  const response = await apiClient.get<LicenseListResponse>(`/api/admin/licenses?${params.toString()}`);
  return response.data;
};

export const getLicenseDetails = async (id: number): Promise<{ success: boolean; data: LicenseDataItem; message?: string }> => {
  const response = await apiClient.get<{ success: boolean; data: LicenseDataItem; message?: string }>(`/api/admin/licenses/${id}`);
  return response.data;
};

export const getSubmissions = async (
  page: number = 1,
  limit: number = 20,
  search?: string,
  startDate?: string,
  endDate?: string,
  minCashiers?: number,
  maxCashiers?: number
): Promise<SubmissionListResponse> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (search) params.append('search', search);
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (minCashiers !== undefined) params.append('minCashiers', minCashiers.toString());
  if (maxCashiers !== undefined) params.append('maxCashiers', maxCashiers.toString());

  const response = await apiClient.get<SubmissionListResponse>(`/api/admin/submissions?${params.toString()}`);
  return response.data;
};

export const updateLicenseStatus = async (
  id: number,
  status: 'active' | 'inactive' | 'revoked',
  reason?: string
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await apiClient.patch(`/api/admin/licenses/${id}/status`, {
    status,
    reason,
  });
  return response.data;
};

export const revokeLicense = async (
  id: number,
  reason?: string
): Promise<{ success: boolean; message: string; data: any }> => {
  const response = await apiClient.delete(`/api/admin/licenses/${id}`, {
    data: { reason },
  });
  return response.data;
};
