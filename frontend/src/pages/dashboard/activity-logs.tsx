import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/dashboard-layout';
// import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
// import { Badge } from '@/components/ui/badge';
import api from '@/lib/axios';
import { format } from 'date-fns';
import { Loader2, AlertCircle } from 'lucide-react';
// import { Alert, AlertDescription } from '@/components/ui/alert';

interface ActivityLog {
    id: number;
    user_id: number;
    action: string;
    entity_type: string;
    entity_id: number;
    details: any;
    created_at: string;
}

export default function ActivityLogsPage() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get('/activity-logs/');
            setLogs(res.data);
        } catch (err: any) {
            console.error(err);
            setError('Failed to fetch activity logs. You might not have permission.');
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action: string) => {
        if (action.includes('CREATE')) return 'bg-white/10 text-white border border-white/20';
        if (action.includes('UPDATE')) return 'bg-white/10 text-white border border-white/20';
        if (action.includes('DELETE')) return 'bg-white/10 text-white border border-white/20';
        if (action.includes('RECEIVE')) return 'bg-white/10 text-white border border-white/20';
        return 'bg-white/5 text-gray-400 border border-white/10';
    };

    const formatDetails = (details: any) => {
        if (!details) return '-';
        return (
            <pre className="text-xs bg-white/5 p-2 rounded overflow-x-auto max-w-xs text-gray-300 border border-white/10">
                {JSON.stringify(details, null, 2)}
            </pre>
        );
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Activity Logs</h1>
                </div>

                {error && (
                    <div className="bg-white/10 border border-white/20 text-white px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <div className="bg-black border border-white/20 shadow-none rounded-lg p-6">
                    <h2 className="text-xl font-semibold mb-4 text-white">Audit Trail</h2>
                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-white" />
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date & Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Entity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-black divide-y divide-white/10">
                                    {logs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                                No activity logs found.
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log) => (
                                            <tr key={log.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                    {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    {/* <Badge variant="outline" className={getActionColor(log.action)}>
                            {log.action}
                          </Badge> */}
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${getActionColor(log.action)}`}>
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300 capitalize">
                                                    {log.entity_type} #{log.entity_id}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">User #{log.user_id}</td>
                                                <td className="px-6 py-4 text-sm text-gray-400">{formatDetails(log.details)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
