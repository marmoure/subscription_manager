import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Key,
  Search,
  RotateCcw,
  ShieldAlert,
  Plus,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Activity,
  Trash2
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
import { Pagination } from '@/components/Pagination';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { getApiKeys, createApiKey, revokeApiKey, type ApiKeyDataItem } from '@/services/admin';

const ApiKeys: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [apiKeys, setApiKeys] = useState<ApiKeyDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || '20', 10);
  
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [isActiveFilter, setIsActiveFilter] = useState<string>(searchParams.get('status') || 'all');
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  // Revocation states
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingRevokeId, setPendingRevokeId] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Creation states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createdKey, setCreatedKey] = useState<{ key: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchApiKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getApiKeys(page, pageSize, isActiveFilter !== 'all' ? isActiveFilter : undefined, debouncedSearchTerm || undefined);
      if (response.success) {
        setApiKeys(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalResults(response.pagination.total);
      } else {
        setError('Failed to fetch API keys');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching API keys');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, isActiveFilter, debouncedSearchTerm]);

  useEffect(() => {
    fetchApiKeys();
    
    const params: any = { page: page.toString() };
    if (pageSize !== 20) params.limit = pageSize.toString();
    if (isActiveFilter !== 'all') params.status = isActiveFilter;
    if (searchTerm) params.q = searchTerm;
    
    setSearchParams(params, { replace: true });
  }, [page, pageSize, isActiveFilter, debouncedSearchTerm, fetchApiKeys, setSearchParams]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  };

  const openRevokeConfirm = (id: number) => {
    setPendingRevokeId(id);
    setIsConfirmOpen(true);
  };

  const handleRevoke = async (reason: string) => {
    if (!pendingRevokeId) return;
    
    setIsUpdating(true);
    try {
      const response = await revokeApiKey(pendingRevokeId, reason);
      if (response.success) {
        setSuccessMessage('API key successfully revoked');
        setIsConfirmOpen(false);
        fetchApiKeys();
        setTimeout(() => setSuccessMessage(null), 5000);
      } else {
        setError(response.message || 'Failed to revoke API key');
      }
    } catch (err: any) {
      setError(err.message || 'Error revoking API key');
    } finally {
      setIsUpdating(false);
      setPendingRevokeId(null);
    }
  };

  const handleCreateKey = async () => {
    if (!newKeyName.trim()) return;
    
    setIsUpdating(true);
    setError(null);
    try {
      const response = await createApiKey(newKeyName);
      if (response.success) {
        setCreatedKey({ key: response.data.key, name: response.data.name });
        setNewKeyName('');
        fetchApiKeys();
      } else {
        setError(response.message || 'Failed to create API key');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating API key');
    } finally {
      setIsUpdating(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdKey) return;
    navigator.clipboard.writeText(createdKey.key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateString: string | Date | null) => {
    if (!dateString) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">API Keys</h1>
            <p className="text-muted-foreground">Manage authentication keys for software integration.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchApiKeys()} disabled={loading}>
              <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => { setIsCreateOpen(true); setCreatedKey(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              New API Key
            </Button>
          </div>
        </div>

        {successMessage && (
          <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400">
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {createdKey && (
          <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/50 dark:text-blue-400">
            <AlertTitle className="flex items-center gap-2 text-lg">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
              API Key Created: {createdKey.name}
            </AlertTitle>
            <AlertDescription className="mt-4">
              <p className="font-semibold text-red-600 mb-2">IMPORTANT: This is the only time the full API key will be shown. Please save it securely.</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="bg-white dark:bg-slate-900 px-3 py-2 rounded border font-mono text-sm flex-1 break-all">
                  {createdKey.key}
                </code>
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="mt-4" onClick={() => setCreatedKey(null)}>
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {isCreateOpen && !createdKey && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle>Create New API Key</CardTitle>
              <CardDescription>Enter a name for this key to identify its purpose.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input 
                  placeholder="e.g. Production Mobile App" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  disabled={isUpdating}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
                />
                <Button onClick={handleCreateKey} disabled={isUpdating || !newKeyName.trim()}>
                  {isUpdating ? 'Creating...' : 'Create'}
                </Button>
                <Button variant="ghost" onClick={() => setIsCreateOpen(false)} disabled={isUpdating}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select 
                  className="flex h-10 w-full md:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={isActiveFilter}
                  onChange={(e) => {
                    setIsActiveFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All Keys</option>
                  <option value="true">Active Only</option>
                  <option value="false">Revoked Only</option>
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
                    <TableHead>Name</TableHead>
                    <TableHead>API Key</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Usage</TableHead>
                    <TableHead className="hidden lg:table-cell">Last Used</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && apiKeys.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : apiKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        No API keys found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell className="font-mono text-xs">{key.maskedKey}</TableCell>
                        <TableCell>
                          {key.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Revoked</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            {key.usageCount} calls
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3" />
                            {formatDate(key.lastUsedAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {key.isActive && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => openRevokeConfirm(key.id)}
                              title="Revoke API Key"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
        onConfirm={handleRevoke}
        title="REVOKE API KEY PERMANENTLY"
        description="WARNING: This action CANNOT be undone. This API key will immediately stop working for all applications using it. You will need to create a new key and update your applications if you want to restore access."
        destructive={true}
        isLoading={isUpdating}
        confirmText="Revoke Permanently"
      />
    </AdminLayout>
  );
};

export default ApiKeys;
