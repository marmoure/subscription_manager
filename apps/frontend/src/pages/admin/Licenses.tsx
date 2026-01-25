import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  RotateCcw,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  CheckCircle,
  ShieldAlert,
  XCircle
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AdminLayout } from '@/layouts/AdminLayout';
import { Pagination } from '@/components/Pagination';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getLicenses, updateLicenseStatus, revokeLicense, type LicenseDataItem } from '@/services/admin';

const Licenses: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState<LicenseDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get initial page from URL or default to 1
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || '20', 10);
  
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>(searchParams.get('status') || '');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Status change states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ id: number; status: 'active' | 'inactive' | 'revoked' } | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previousState, setPreviousState] = useState<{ id: number; status: 'active' | 'inactive' } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1); // Reset to first page on search
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLicenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLicenses(page, pageSize, statusFilter || undefined, debouncedSearchTerm || undefined);
      if (response.success) {
        setLicenses(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalResults(response.pagination.total);
      } else {
        setError('Failed to fetch licenses');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching licenses');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, statusFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchLicenses();
    
    // Update URL query params
    const params: any = { page: page.toString() };
    if (pageSize !== 20) params.limit = pageSize.toString();
    if (statusFilter) params.status = statusFilter;
    if (searchTerm) params.q = searchTerm;
    
    setSearchParams(params, { replace: true });
  }, [page, pageSize, statusFilter, debouncedSearchTerm, fetchLicenses, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1); // Reset to first page when changing page size
  };

  const openStatusConfirm = (id: number, status: 'active' | 'inactive' | 'revoked') => {
    setPendingAction({ id, status });
    setIsConfirmOpen(true);
  };

  const handleStatusUpdate = async (reason: string) => {
    if (!pendingAction) return;
    
    const license = licenses.find(l => l.id === pendingAction.id);
    const oldStatus = license?.status as 'active' | 'inactive';
    
    setIsUpdating(true);
    try {
      let response;
      if (pendingAction.status === 'revoked') {
        response = await revokeLicense(pendingAction.id, reason);
        setPreviousState(null);
      } else {
        response = await updateLicenseStatus(pendingAction.id, pendingAction.status, reason);
        setPreviousState({ id: pendingAction.id, status: oldStatus });
      }

      if (response.success) {
        setSuccessMessage(`License successfully ${pendingAction.status === 'revoked' ? 'revoked' : 'updated'}`);
        setIsConfirmOpen(false);
        fetchLicenses();
        setTimeout(() => {
          setSuccessMessage(null);
          setPreviousState(null);
        }, 10000);
      } else {
        setError(response.message || 'Failed to update status');
      }
    } catch (err: any) {
      setError(err.message || 'Error updating status');
    } finally {
      setIsUpdating(false);
      setPendingAction(null);
    }
  };

  const handleUndo = async () => {
    if (!previousState) return;
    
    setIsUpdating(true);
    try {
      const response = await updateLicenseStatus(previousState.id, previousState.status, 'Undo previous status change');
      if (response.success) {
        setSuccessMessage('Action undone successfully');
        setPreviousState(null);
        fetchLicenses();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(response.message || 'Failed to undo action');
      }
    } catch (err: any) {
      setError(err.message || 'Error undoing action');
    } finally {
      setIsUpdating(false);
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

  const getConfirmDialogDetails = () => {
    if (!pendingAction) return { title: '', description: '', destructive: false };
    
    if (pendingAction.status === 'active') {
      return {
        title: 'Activate License',
        description: 'This will enable the license key. The user will be able to use the software.',
        destructive: false
      };
    } else if (pendingAction.status === 'inactive') {
      return {
        title: 'Deactivate License',
        description: 'This will temporarily disable the license key. Future verification attempts will fail.',
        destructive: true
      };
    } else if (pendingAction.status === 'revoked') {
      return {
        title: 'REVOKE LICENSE PERMANENTLY',
        description: 'WARNING: This action CANNOT be undone. The license will be permanently disabled.',
        destructive: true
      };
    }
    return { title: '', description: '', destructive: false };
  };

  const { title, description, destructive } = getConfirmDialogDetails();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Licenses</h1>
            <p className="text-muted-foreground">Manage and monitor all generated license keys.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchLicenses()} disabled={loading}>
              <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {successMessage && (
          <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400 flex items-center justify-between">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              <div>
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{successMessage}</AlertDescription>
              </div>
            </div>
            {previousState && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleUndo}
                disabled={isUpdating}
                className="ml-4 bg-white dark:bg-slate-950"
              >
                Undo
              </Button>
            )}
          </Alert>
        )}

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
                  {loading && licenses.length === 0 ? (
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
                  ) : licenses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <CreditCard className="h-8 w-8 mb-2 opacity-20" />
                          <p>No licenses found matching your criteria.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    licenses.map((license) => (
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
                              onClick={() => navigate(`/admin/licenses/${license.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {license.status !== 'revoked' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" disabled={isUpdating}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    disabled={license.status === 'active'}
                                    onClick={() => openStatusConfirm(license.id, 'active')}
                                    className="text-green-600 focus:text-green-600"
                                  >
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Activate
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    disabled={license.status === 'inactive'}
                                    onClick={() => openStatusConfirm(license.id, 'inactive')}
                                    className="text-amber-600 focus:text-amber-600"
                                  >
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Deactivate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => openStatusConfirm(license.id, 'revoked')}
                                    className="text-red-600 focus:text-red-600 font-medium"
                                  >
                                    <ShieldAlert className="mr-2 h-4 w-4" />
                                    Revoke
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              pageSize={pageSize}
              onPageSizeChange={handlePageSizeChange}
              totalResults={totalResults}
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleStatusUpdate}
        title={title}
        description={description}
        destructive={destructive}
        isLoading={isUpdating}
      />
    </AdminLayout>
  );
};

export default Licenses;