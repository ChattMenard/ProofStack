'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Shield, 
  Eye, 
  Activity, 
  XCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Search
} from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id: string;
  success: boolean;
  failure_reason?: string;
  suspicious: boolean;
  ip_address?: string;
  metadata?: any;
}

interface SecurityStats {
  total_events_24h: number;
  suspicious_events_24h: number;
  failed_attempts_24h: number;
  unique_users_24h: number;
  most_accessed_samples: Array<{ resource_id: string; count: number }>;
}

export default function AdminSecurityDashboard() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [suspiciousLogs, setSuspiciousLogs] = useState<AuditLog[]>([]);
  const [failedAttempts, setFailedAttempts] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const supabase = createClient();

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      // Check if user has admin role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        setError('Access denied. Admin role required.');
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await loadSecurityData();
    } catch (err) {
      setError('Failed to verify admin status');
      setLoading(false);
    }
  };

  const loadSecurityData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRecentLogs(),
        loadSuspiciousActivity(),
        loadFailedAttempts(),
        loadSecurityStats()
      ]);
    } catch (err) {
      setError('Failed to load security data');
    } finally {
      setLoading(false);
    }
  };

  const loadRecentLogs = async () => {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(100);

    if (error) throw error;
    setLogs(data || []);
  };

  const loadSuspiciousActivity = async () => {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('suspicious', true)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    setSuspiciousLogs(data || []);
  };

  const loadFailedAttempts = async () => {
    const { data, error } = await supabase
      .from('security_audit_log')
      .select('*')
      .eq('success', false)
      .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) throw error;
    setFailedAttempts(data || []);
  };

  const loadSecurityStats = async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Get total events
    const { count: totalCount } = await supabase
      .from('security_audit_log')
      .select('*', { count: 'exact', head: true })
      .gte('timestamp', twentyFourHoursAgo);

    // Get suspicious events
    const { count: suspiciousCount } = await supabase
      .from('security_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('suspicious', true)
      .gte('timestamp', twentyFourHoursAgo);

    // Get failed attempts
    const { count: failedCount } = await supabase
      .from('security_audit_log')
      .select('*', { count: 'exact', head: true })
      .eq('success', false)
      .gte('timestamp', twentyFourHoursAgo);

    // Get unique users
    const { data: uniqueUsers } = await supabase
      .from('security_audit_log')
      .select('user_email')
      .gte('timestamp', twentyFourHoursAgo);

    const uniqueUserCount = new Set(uniqueUsers?.map(u => u.user_email)).size;

    // Get most accessed samples
    const { data: accessData } = await supabase
      .from('security_audit_log')
      .select('resource_id')
      .eq('action', 'work_sample_view')
      .gte('timestamp', twentyFourHoursAgo);

    const sampleCounts = (accessData || []).reduce((acc, curr) => {
      acc[curr.resource_id] = (acc[curr.resource_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostAccessed = Object.entries(sampleCounts)
      .map(([resource_id, count]) => ({ resource_id, count: count as number }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    setStats({
      total_events_24h: totalCount || 0,
      suspicious_events_24h: suspiciousCount || 0,
      failed_attempts_24h: failedCount || 0,
      unique_users_24h: uniqueUserCount,
      most_accessed_samples: mostAccessed
    });
  };

  const runSuspiciousActivityDetection = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.rpc('detect_suspicious_activity');
      
      if (error) throw error;
      
      await loadSecurityData();
      alert('Suspicious activity detection completed. Check the Suspicious Activity tab for results.');
    } catch (err) {
      alert('Failed to run detection: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exportLogs = async () => {
    try {
      const csv = [
        ['Timestamp', 'User Email', 'Action', 'Resource Type', 'Resource ID', 'Success', 'Suspicious', 'IP Address'].join(','),
        ...logs.map(log => [
          log.timestamp,
          log.user_email || '',
          log.action,
          log.resource_type,
          log.resource_id || '',
          log.success,
          log.suspicious,
          log.ip_address || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `security-audit-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (err) {
      alert('Failed to export logs');
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource_id?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = selectedAction === 'all' || log.action === selectedAction;
    
    return matchesSearch && matchesAction;
  });

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)));

  if (!isAdmin && !loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Access denied. Admin role required.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading && logs.length === 0) {
    return (
      <div className="container mx-auto py-8 px-4 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading security dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Security Audit Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Monitor and investigate security events across ProofStack
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSecurityData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={exportLogs}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={runSuspiciousActivityDetection} disabled={loading}>
              <Activity className="h-4 w-4 mr-2" />
              Run Detection
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Events (24h)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total_events_24h}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  Suspicious Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {stats.suspicious_events_24h}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Failed Attempts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {stats.failed_attempts_24h}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unique Users
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.unique_users_24h}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            <Eye className="h-4 w-4 mr-2" />
            All Events
          </TabsTrigger>
          <TabsTrigger value="suspicious">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Suspicious ({suspiciousLogs.length})
          </TabsTrigger>
          <TabsTrigger value="failed">
            <XCircle className="h-4 w-4 mr-2" />
            Failed ({failedAttempts.length})
          </TabsTrigger>
          <TabsTrigger value="stats">
            <Activity className="h-4 w-4 mr-2" />
            Statistics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>All Audit Logs</CardTitle>
              <CardDescription>
                Complete audit trail of all security events
              </CardDescription>
              <div className="flex gap-2 mt-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search by email, action, or resource ID..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-md"
                    />
                  </div>
                </div>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value)}
                  className="border rounded-md px-4 py-2"
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map(action => (
                    <option key={action} value={action}>{action}</option>
                  ))}
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <AuditLogTable logs={filteredLogs} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Suspicious Activity (Last 24 Hours)
              </CardTitle>
              <CardDescription>
                Events flagged by automated detection rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No suspicious activity detected</p>
                </div>
              ) : (
                <AuditLogTable logs={suspiciousLogs} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Failed Access Attempts (Last 24 Hours)
              </CardTitle>
              <CardDescription>
                Unauthorized or failed access attempts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {failedAttempts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>No failed attempts detected</p>
                </div>
              ) : (
                <AuditLogTable logs={failedAttempts} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          {stats && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Most Accessed Work Samples (24h)</CardTitle>
                  <CardDescription>
                    Work samples with the highest view count
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {stats.most_accessed_samples.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      No work sample views recorded
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stats.most_accessed_samples.map((sample, index) => (
                        <div key={sample.resource_id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">#{index + 1}</Badge>
                            <span className="font-mono text-sm">{sample.resource_id.slice(0, 8)}...</span>
                          </div>
                          <Badge>{sample.count} views</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Monitoring Guidelines</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">🚨 Red Flags to Watch For:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>More than 100 work sample views in 1 hour (potential scraping)</li>
                      <li>Access to more than 20 different professionals' samples in 1 hour</li>
                      <li>More than 10 failed access attempts in 1 hour (brute force)</li>
                      <li>Same IP accessing multiple accounts</li>
                      <li>Unusual access patterns outside business hours</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">✅ Recommended Actions:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Run suspicious activity detection daily</li>
                      <li>Review suspicious events within 24 hours</li>
                      <li>Export logs weekly for compliance</li>
                      <li>Investigate any user with &gt;3 failed attempts</li>
                      <li>Monitor most accessed samples for potential targets</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-3 text-sm font-medium">Timestamp</th>
            <th className="text-left p-3 text-sm font-medium">User</th>
            <th className="text-left p-3 text-sm font-medium">Action</th>
            <th className="text-left p-3 text-sm font-medium">Resource</th>
            <th className="text-left p-3 text-sm font-medium">Status</th>
            <th className="text-left p-3 text-sm font-medium">Flags</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} className="border-b hover:bg-muted/50">
              <td className="p-3 text-sm">
                {new Date(log.timestamp).toLocaleString()}
              </td>
              <td className="p-3 text-sm font-mono">
                {log.user_email || 'Anonymous'}
                {log.ip_address && (
                  <div className="text-xs text-muted-foreground">{log.ip_address}</div>
                )}
              </td>
              <td className="p-3">
                <Badge variant="outline">{log.action}</Badge>
              </td>
              <td className="p-3 text-sm font-mono">
                <div>{log.resource_type}</div>
                {log.resource_id && (
                  <div className="text-xs text-muted-foreground">
                    {log.resource_id.slice(0, 8)}...
                  </div>
                )}
              </td>
              <td className="p-3">
                {log.success ? (
                  <Badge variant="default" className="bg-green-500">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Success
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                  </Badge>
                )}
              </td>
              <td className="p-3">
                {log.suspicious && (
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Suspicious
                  </Badge>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No audit logs found
        </div>
      )}
    </div>
  );
}
