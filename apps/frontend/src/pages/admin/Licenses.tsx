import React, { useEffect, useState } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  RotateCcw,
  Trash2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AdminLayout } from '@/layouts/AdminLayout';
import { getLicenses, updateLicenseStatus, revokeLicense, type LicenseDataItem } from '@/services/admin';

const Licenses: React.FC = () => {
  const [licenses, setLicenses] = useState<LicenseDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchLicenses = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLicenses(page, 10, statusFilter || undefined);
      if (response.success) {
        setLicenses(response.data);
        setTotalPages(response.pagination.totalPages);
      } else {
        setError('Failed to fetch licenses');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching licenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, [page, statusFilter]);

  const handleStatusChange = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;

    try {
      const response = await updateLicenseStatus(id, newStatus);
      if (response.success) {
        fetchLicenses();
      } else {
        alert(response.message || 'Failed to update status');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating status');
    }
  };

  const handleRevoke = async (id: number) => {
    if (!confirm('Are you sure you want to PERMANENTLY revoke this license? This action cannot be undone.')) return;

    try {
      const response = await revokeLicense(id, 'Admin manual revocation');
      if (response.success) {
        fetchLicenses();
      } else {
        alert(response.message || 'Failed to revoke license');
      }
    } catch (err: any) {
      alert(err.message || 'Error revoking license');
    }
  };

  const formatDate = (dateString: string) => {
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

  const filteredLicenses = licenses.filter(license => 
    license.licenseKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.submission?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.submission?.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    license.machineId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
            <p className="text-muted-foreground">Manage and monitor all generated license keys.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchLicenses()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by key, name, email or machine ID..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  className="flex h-10 w-full md:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="revoked">Revoked</option>
                </select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">License Key</TableHead>
                    <TableHead>User / Shop</TableHead>
                    <TableHead className="hidden md:table-cell">Machine ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Created Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredLicenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <CreditCard className="h-8 w-8 mb-2 opacity-20" />
                          <p>No licenses found matching your criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLicenses.map((license) => (
                      <TableRow key={license.id}>
                        <TableCell className="font-mono text-xs font-semibold">
                          {license.licenseKey}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{license.submission?.name || 'Unknown'}</span>
                            <span className="text-xs text-muted-foreground">{license.submission?.email || 'No email'}</span>
                            {license.submission?.shopName && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded w-fit mt-1">
                                {license.submission.shopName}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          <code className="bg-slate-50 dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-100 dark:border-slate-800">
                            {license.machineId}
                          </code>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(license.status)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {formatDate(license.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="View Details"
                              onClick={() => alert(`License Key: ${license.licenseKey}\nMachine ID: ${license.machineId}\nShop: ${license.submission?.shopName}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {license.status !== 'revoked' && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  title={license.status === 'active' ? 'Deactivate' : 'Activate'}
                                  onClick={() => handleStatusChange(license.id, license.status)}
                                >
                                  <RotateCcw className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Revoke Permanently"
                                  onClick={() => handleRevoke(license.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || loading}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || loading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Licenses;
