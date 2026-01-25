import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Mail,
  RefreshCw,
  History,
  User,
  Shield,
  Clock,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { getLicenseDetails, updateLicenseStatus, revokeLicense, type LicenseDataItem } from '@/services/admin';

const LicenseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [license, setLicense] = useState<LicenseDataItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedMachineId, setCopiedMachineId] = useState(false);

  const fetchLicenseDetails = useCallback(async () => {
    if (!id) return;
    const licenseId = parseInt(id, 10);
    if (isNaN(licenseId)) {
      setError('Invalid license ID');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await getLicenseDetails(licenseId);
      if (response.success) {
        setLicense(response.data);
      } else {
        setError(response.message || 'License not found');
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('License not found');
      } else {
        setError(err.message || 'An error occurred while fetching license details');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLicenseDetails();
  }, [fetchLicenseDetails]);

  const handleCopy = (text: string, setter: (val: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  const handleStatusChange = async () => {
    if (!license) return;
    const newStatus = license.status === 'active' ? 'inactive' : 'active';
    const reason = window.prompt(`Changing status to ${newStatus}. Enter reason (optional):`);
    
    if (reason === null) return; // User cancelled prompt

    try {
      const response = await updateLicenseStatus(license.id, newStatus, reason || undefined);
      if (response.success) {
        fetchLicenseDetails();
      } else {
        alert(response.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleRevoke = async () => {
    if (!license) return;
    if (!confirm('Are you sure you want to PERMANENTLY revoke this license? This action cannot be undone.')) return;

    const reason = window.prompt('Reason for revocation:');
    if (reason === null) return;

    try {
      const response = await revokeLicense(license.id, reason || undefined);
      if (response.success) {
        fetchLicenseDetails();
      } else {
        alert(response.message || 'Failed to revoke license');
      }
    } catch (err: any) {
      alert(err.message || 'Error revoking license');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'revoked':
        return <Badge variant="destructive">Revoked</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-[300px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
          <Skeleton className="h-[400px] w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !license) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] text-center">
          <XCircle className="h-16 w-16 text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-muted-foreground mb-6">{error || 'License not found'}</p>
          <Button onClick={() => navigate('/admin/licenses')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Licenses
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/licenses')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">License Details</h1>
                {getStatusBadge(license.status)}
              </div>
              <p className="text-muted-foreground font-mono text-sm">{license.licenseKey}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => alert('Email resending feature coming soon!')}
            >
              <Mail className="h-4 w-4 mr-2" />
              Resend Email
            </Button>
            {license.status !== 'revoked' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm"
                  className={license.status === 'active' ? 'text-amber-600 border-amber-200 hover:bg-amber-50' : 'text-green-600 border-green-200 hover:bg-green-50'}
                  onClick={handleStatusChange}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {license.status === 'active' ? 'Deactivate' : 'Activate'}
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleRevoke}
                >
                  <ShieldAlert className="h-4 w-4 mr-2" />
                  Revoke License
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* License Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                License Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">License Key</span>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded border">
                  <code className="text-sm font-mono flex-1 truncate">{license.licenseKey}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => handleCopy(license.licenseKey, setCopiedKey)}
                  >
                    {copiedKey ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase">Machine ID</span>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 p-2 rounded border">
                  <code className="text-sm font-mono flex-1 truncate">{license.machineId}</code>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={() => handleCopy(license.machineId, setCopiedMachineId)}
                  >
                    {copiedMachineId ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Created Date</span>
                  <p className="text-sm font-medium">{formatDate(license.createdAt)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Last Updated</span>
                  <p className="text-sm font-medium">{formatDate(license.updatedAt)}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-muted-foreground uppercase">Expires At</span>
                  <p className="text-sm font-medium">{formatDate(license.expiresAt)}</p>
                </div>
                {license.revokedAt && (
                  <div>
                    <span className="text-xs font-medium text-destructive uppercase">Revoked At</span>
                    <p className="text-sm font-medium text-destructive">{formatDate(license.revokedAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {license.submission ? (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Full Name</span>
                      <p className="text-sm font-semibold">{license.submission.name}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Email Address</span>
                      <p className="text-sm flex items-center gap-1">
                        {license.submission.email}
                        <Link to={`mailto:${license.submission.email}`} className="text-primary">
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Phone Number</span>
                      <p className="text-sm">{license.submission.phone}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs font-medium text-muted-foreground uppercase">Shop Name</span>
                      <p className="text-sm font-semibold">{license.submission.shopName}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Cashiers</span>
                      <p className="text-sm">{license.submission.numberOfCashiers}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Submission Date</span>
                      <p className="text-sm">{formatDate(license.submission.submissionDate)}</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
                  <p>No user submission data available for this license.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity Log - Two tabs or sections: Status Changes and Verifications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Activity Log
            </CardTitle>
            <CardDescription>Recent status changes and license verification attempts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Status Logs */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Status Change History
              </h3>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Change</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!license.statusLogs || license.statusLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          No status changes recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      license.statusLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-muted-foreground line-through">{log.oldStatus || 'none'}</span>
                              <span className="text-xs">→</span>
                              {getStatusBadge(log.newStatus)}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.admin?.username || 'System'}
                          </TableCell>
                          <TableCell className="text-xs italic text-muted-foreground">
                            {log.reason || 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Verification Logs */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Recent Verifications
                {license.metadata && (
                  <Badge variant="outline" className="ml-2 font-normal">
                    Total: {license.metadata.verificationAttempts}
                  </Badge>
                )}
              </h3>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!license.verificationLogs || license.verificationLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          No verification attempts recorded.
                        </TableCell>
                      </TableRow>
                    ) : (
                      license.verificationLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {formatDate(log.timestamp)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={log.status === 'success' ? 'success' : 'destructive'} className="text-[10px] px-1.5 py-0">
                              {log.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {log.ipAddress || 'Unknown'}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {log.message}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default LicenseDetail;
