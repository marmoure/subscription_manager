import { ApiError } from './api';
import { client } from '../lib/rpc-client';

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
  phone: string;
  shopName: string;
  machineId: string;
  numberOfCashiers: number;
  submissionDate: string | Date;
  ipAddress?: string;
  licenseKey?: {
    id: number;
    licenseKey: string;
    status: string;
    expiresAt: string | Date | null;
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
  createdAt: string | Date;
  updatedAt: string | Date;
  expiresAt: string | Date | null;
  revokedAt: string | Date | null;
  submission: {
    id: number;
    name: string;
    phone: string;
    shopName: string;
    numberOfCashiers: number;
    submissionDate: string | Date;
  } | null;
  verificationLogs?: Array<{
    id: number;
    timestamp: string | Date;
    status: 'success' | 'failed';
    message: string;
    ipAddress: string | null;
  }>;
  statusLogs?: Array<{
    id: number;
    oldStatus: string | null;
    newStatus: string;
    reason: string | null;
    timestamp: string | Date;
    admin: {
      username: string;
    } | null;
  }>;
  metadata?: {
    verificationAttempts: number;
    lastVerification: string | Date | null;
  };
}

export interface ApiKeyDataItem {
  id: number;
  name: string;
  maskedKey: string;
  createdAt: string | Date;
  lastUsedAt: string | Date | null;
  isActive: boolean;
  usageCount: number;
  metadata: {
    totalApiCalls: number;
    lastIpAddress: string | null;
  };
}

export interface ApiKeyListResponse {
  success: boolean;
  data: ApiKeyDataItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getLicenses = async (
  page: number = 1,
  limit: number = 20,
  status?: string,
  search?: string
): Promise<LicenseListResponse> => {
  const query: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  };

  if (status) query.status = status;
  if (search) query.search = search;

  const response = await client.api.admin.licenses.$get({ query });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to fetch licenses', errorData);
  }

  const result = await response.json();
  return result as unknown as LicenseListResponse;
};

export const getLicenseDetails = async (id: number): Promise<LicenseDataItem> => {
  const response = await client.api.admin.licenses[':id'].$get({
    param: { id: id.toString() }
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to fetch license details', errorData);
  }

  const result = await response.json();
  return result as any;
};

export const getApiKeys = async (
  page: number = 1,
  limit: number = 20,
  isActive?: string,
  search?: string
): Promise<ApiKeyListResponse> => {
  const query: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  };

  if (isActive) query.isActive = isActive;
  if (search) query.search = search;

  const response = await (client.api.admin as any)['api-keys'].$get({ query });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to fetch API keys', errorData);
  }

  const result = await response.json();
  return result as unknown as ApiKeyListResponse;
};

export const createApiKey = async (name: string): Promise<any> => {
  const response = await (client.api.admin as any)['api-keys'].$post({
    json: { name }
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to create API key', errorData);
  }

  return await response.json();
};

export const revokeApiKey = async (
  id: number,
  reason?: string
): Promise<any> => {
  const response = await (client.api.admin as any)['api-keys'][':id'].$delete({
    param: { id: id.toString() },
    json: { reason }
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to revoke API key', errorData);
  }

  return await response.json();
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
  const query: Record<string, string> = {
    page: page.toString(),
    limit: limit.toString(),
  };

  if (search) query.search = search;
  if (startDate) query.startDate = startDate;
  if (endDate) query.endDate = endDate;
  if (minCashiers !== undefined) query.minCashiers = minCashiers.toString();
  if (maxCashiers !== undefined) query.maxCashiers = maxCashiers.toString();

  const response = await client.api.admin.submissions.$get({ query });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to fetch submissions', errorData);
  }

  const result = await response.json();
  return result as unknown as SubmissionListResponse;
};

export const updateLicenseStatus = async (
  id: number,
  status: 'active' | 'inactive' | 'revoked',
  reason?: string
): Promise<any> => {
  const response = await (client.api.admin.licenses[':id'].status.$patch as any)({
    param: { id: id.toString() },
    json: { status, reason }
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to update license status', errorData);
  }

  return await response.json();
};

export const revokeLicense = async (
  id: number,
  reason?: string
): Promise<any> => {
  const response = await (client.api.admin.licenses[':id'].$delete as any)({
    param: { id: id.toString() },
    json: { reason: reason || '' }
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to revoke license', errorData);
  }

  return await response.json();
};

export interface DashboardStatsResponse {
  stats: {
    totalLicenses: number;
    activeLicenses: number;
    submissionsThisMonth: number;
    growth: number;
  };
  charts: {
    licensesOverTime: { date: string; count: number }[];
    licenseStatus: { status: string; count: number }[];
    submissionsByDay: { date: string; count: number }[];
  };
  activity: {
    recentSubmissions: {
      id: number;
      name: string;
      submissionDate: string;
      shopName: string;
    }[];
    recentStatusChanges: {
      id: number;
      oldStatus: string | null;
      newStatus: string;
      timestamp: string;
      adminUsername: string | null;
      licenseKey: { licenseKey: string } | null;
    }[];
  };
}

export const getDashboardStats = async (): Promise<DashboardStatsResponse> => {
  const response = await client.api.admin.dashboard.stats.$get();

  if (!response.ok) {
    const errorData = await response.json() as any;
    throw new ApiError(errorData.message || 'Failed to fetch dashboard stats', errorData);
  }

  const result = await response.json();
  return result as any;
};