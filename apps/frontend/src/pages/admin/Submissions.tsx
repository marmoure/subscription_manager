import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Search,
  RotateCcw,
  Eye,
  AlertCircle,
  ExternalLink,
  Calendar,
  User,
  Hash
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
import { getSubmissions, type SubmissionDataItem } from '@/services/admin';

const Submissions: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [submissions, setSubmissions] = useState<SubmissionDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const initialLimit = parseInt(searchParams.get('limit') || '20', 10);
  
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      if (searchTerm !== (searchParams.get('q') || '')) {
        setPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, searchParams]);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSubmissions(page, pageSize, debouncedSearchTerm || undefined);
      if (response.success) {
        setSubmissions(response.data);
        setTotalPages(response.pagination.totalPages);
        setTotalResults(response.pagination.total);
      } else {
        setError('Failed to fetch submissions');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching submissions');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, debouncedSearchTerm]);

  useEffect(() => {
    fetchSubmissions();
    
    const params: any = { page: page.toString() };
    if (pageSize !== 20) params.limit = pageSize.toString();
    if (searchTerm) params.q = searchTerm;
    
    setSearchParams(params, { replace: true });
  }, [page, pageSize, debouncedSearchTerm, searchTerm, fetchSubmissions, setSearchParams]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(1);
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

  const getStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge variant="outline">No License</Badge>;
    
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Submissions</h1>
            <p className="text-muted-foreground">Review user requests for license keys.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchSubmissions()}>
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
                  placeholder="Search by name, email or shop..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
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
                    <TableHead>User / Shop</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="hidden lg:table-cell">Cashiers</TableHead>
                    <TableHead>Submission Date</TableHead>
                    <TableHead>License Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </TableCell>
                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell className="hidden lg:table-cell"><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                        <TableCell className="text-right"><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : submissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <FileText className="h-8 w-8 mb-2 opacity-20" />
                          <p>No submissions found.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{submission.name}</span>
                            <span className="text-xs text-muted-foreground">{submission.shopName}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col">
                            <span className="text-xs">{submission.email}</span>
                            <span className="text-[10px] text-muted-foreground">{submission.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {submission.numberOfCashiers}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(submission.submissionDate)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(submission.licenseKey?.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="View Details"
                              onClick={() => alert(`Name: ${submission.name}\nEmail: ${submission.email}\nShop: ${submission.shopName}\nMachine ID: ${submission.machineId}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
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
    </AdminLayout>
  );
};

export default Submissions;
