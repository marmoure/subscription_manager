import React, { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { AdminLayout } from '../../layouts/AdminLayout';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Users, Key, FileText, TrendingUp, RefreshCcw, ArrowRight, Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getDashboardStats, DashboardStatsResponse } from '@/services/admin';
import { cn } from '@/lib/utils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardStatsResponse | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState('30'); // Days

  const fetchData = useCallback(async () => {
    try {
      // In a real app we would pass dateRange to the API if supported
      const stats = await getDashboardStats();
      if (stats) {
        setData(stats);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  const StatCard = ({ title, value, subtext, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {trend !== undefined && (
                <span className={cn("font-medium", trend > 0 ? "text-green-600" : "text-red-600")}>
                  {trend > 0 ? "+" : ""}{trend}%
                </span>
              )} {subtext}
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="flex flex-col gap-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Overview of your license management system.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              Updated: {lastUpdated.toLocaleTimeString()}
            </span>
            <select
              className="h-9 w-[130px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 3 months</option>
            </select>
            <Button variant="outline" size="icon" onClick={() => { setLoading(true); fetchData(); }}>
              <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Licenses"
            value={data?.stats.totalLicenses}
            icon={Key}
            subtext="All time licenses"
          />
          <StatCard
            title="Active Licenses"
            value={data?.stats.activeLicenses}
            icon={Activity}
            subtext="Currently active"
          />
          <StatCard
            title="Submissions"
            value={data?.stats.submissionsThisMonth}
            icon={FileText}
            subtext="This month"
            trend={data?.stats.growth}
          />
          <StatCard
            title="Growth"
            value={`${data?.stats.growth}%`}
            icon={TrendingUp}
            subtext="Vs last month"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Main Chart */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>License Growth</CardTitle>
              <CardDescription>
                New licenses created over the selected period.
              </CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px] w-full">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.charts.licensesOverTime}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="date"
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => {
                          const date = new Date(value);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis
                        stroke="#888888"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line type="monotone" dataKey="count" stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pie Chart */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>License Status</CardTitle>
              <CardDescription>
                Distribution of license statuses.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                {loading ? (
                  <Skeleton className="h-full w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.charts.licenseStatus}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="count"
                        nameKey="status"
                      >
                        {data?.charts.licenseStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          {/* Recent Submissions */}
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Recent Submissions</CardTitle>
              <CardDescription>Latest license requests from users.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  !data?.activity.recentSubmissions || data.activity.recentSubmissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent submissions</p>
                  ) : (
                    data.activity.recentSubmissions.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between border-b last:border-0 pb-4 last:pb-0">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">{sub.name}</p>
                          <p className="text-xs text-muted-foreground">{sub.shopName}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{new Date(sub.submissionDate).toLocaleDateString()}</span>
                          <Link to={`/admin/submissions?search=${encodeURIComponent(sub.name)}`} className="text-primary hover:underline">
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and logs.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                ) : (
                  !data?.activity.recentStatusChanges || data.activity.recentStatusChanges.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  ) : (
                    data.activity.recentStatusChanges.map((log) => (
                      <div key={log.id} className="flex flex-col space-y-1 border-b last:border-0 pb-4 last:pb-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium">License Status Change</p>
                          <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          <span className="font-semibold">{log.adminUsername || 'System'}</span> changed status from{' '}
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{log.oldStatus || 'none'}</span> to{' '}
                          <span className="font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded">{log.newStatus}</span>
                        </p>
                      </div>
                    ))
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
