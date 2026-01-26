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
  Trash2,
  Calendar,
  AlertTriangle
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
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
        setIsCreateOpen(false);
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
            <Button size="sm" onClick={() => { setIsCreateOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Generate New API Key
            </Button>
          </div>
        </div>

        {successMessage && (
          <Alert className="bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400">
            <Check className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
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
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
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
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : apiKeys.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                        No API keys found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    apiKeys.map((key) => (
                      <TableRow key={key.id} className={!key.isActive ? "bg-slate-50/50 dark:bg-slate-900/20" : ""}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell className="font-mono text-xs">{key.maskedKey}</TableCell>
                        <TableCell>
                          {key.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Revoked</Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3" />
                            {formatDate(key.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 text-xs font-medium">
                              <Activity className="h-3 w-3 text-primary" />
                              {key.usageCount} calls
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              Total: {key.metadata?.totalApiCalls || 0}
                            </div>
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

      {/* Generation Dialog */}
      <AlertDialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Generate New API Key</AlertDialogTitle>
            <AlertDialogDescription>
              Give your new API key a name to help you identify it later. 
              Maximum 10 active keys allowed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label htmlFor="keyName">Key Name</Label>
            <Input
              id="keyName"
              placeholder="e.g. Production Mobile App"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              disabled={isUpdating}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateKey()}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <Button onClick={handleCreateKey} disabled={isUpdating || !newKeyName.trim()}>
              {isUpdating ? 'Generating...' : 'Generate Key'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Show Key Dialog */}
      <AlertDialog open={!!createdKey} onOpenChange={(open) => !open && setCreatedKey(null)}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-blue-600" />
              API Key Generated
            </AlertDialogTitle>
            <AlertDialogDescription>
              Save this key securely. It won't be shown again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Key Name</Label>
              <div className="text-sm font-semibold">{createdKey?.name}</div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Your API Key</Label>
              <div className="flex items-center gap-2">
                <code className="bg-slate-100 dark:bg-slate-900 px-3 py-2 rounded border font-mono text-sm flex-1 break-all select-all">
                  {createdKey?.key}
                </code>
                <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy to clipboard">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 flex gap-3 dark:bg-amber-900/20 dark:border-amber-900/50">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-800 dark:text-amber-400">
                <strong>WARNING:</strong> Save this key securely. It won't be shown again. If you lose it, you'll need to generate a new one.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <Button onClick={() => setCreatedKey(null)}>I've saved it</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
