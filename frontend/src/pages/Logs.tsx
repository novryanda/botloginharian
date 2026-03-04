import { useEffect, useState } from 'react';
import { getLogs } from '../api';

interface LogEntry {
    id: number;
    accountId: number;
    status: string;
    message: string | null;
    ipAddress: string | null;
    startedAt: string | null;
    finishedAt: string | null;
    createdAt: string;
    account: { username: string; label: string | null };
}

const STATUS_BADGE: Record<string, string> = {
    queued: 'badge-muted',
    running: 'badge-info',
    login_success: 'badge-success',
    login_failed: 'badge-error',
    logout_success: 'badge-success',
    error: 'badge-error',
};

function formatDate(d: string | null) {
    if (!d) return '—';
    return new Date(d).toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

function formatDuration(start: string | null, end: string | null) {
    if (!start || !end) return '—';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

export default function Logs() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [filterAccount, setFilterAccount] = useState('');

    const fetchLogs = async () => {
        try {
            const params: any = { page, size: 20 };
            if (filterAccount) params.accountId = filterAccount;
            const res = await getLogs(
                page,
                20,
                filterAccount ? parseInt(filterAccount) : undefined,
            );
            setLogs(res.data.data);
            setTotalPage(res.data.paging.totalPage);
        } catch {
            // offline
        }
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, [page, filterAccount]);

    return (
        <>
            <div className="page-header">
                <h2>Log Aktivitas</h2>
                <p>Riwayat login/logout semua akun — auto-refresh 5 detik</p>
            </div>

            <div className="toolbar">
                <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                    <input
                        className="form-input"
                        placeholder="Filter by Account ID..."
                        value={filterAccount}
                        onChange={(e) => {
                            setFilterAccount(e.target.value);
                            setPage(1);
                        }}
                    />
                </div>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Waktu</th>
                            <th>Akun</th>
                            <th>Status</th>
                            <th>Pesan</th>
                            <th>IP</th>
                            <th>Durasi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={6}>
                                    <div className="empty-state">
                                        <div className="icon">📋</div>
                                        <p>Belum ada log. Jalankan worker untuk mulai.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            logs.map((log) => (
                                <tr key={log.id}>
                                    <td style={{ fontSize: '12px', whiteSpace: 'nowrap' }}>
                                        {formatDate(log.createdAt)}
                                    </td>
                                    <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                                        {log.account?.username || `#${log.accountId}`}
                                        {log.account?.label && (
                                            <span style={{ color: 'var(--text-muted)', fontSize: '11px', marginLeft: '6px' }}>
                                                {log.account.label}
                                            </span>
                                        )}
                                    </td>
                                    <td>
                                        <span className={`badge ${STATUS_BADGE[log.status] || 'badge-muted'}`}>
                                            {log.status.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {log.message || '—'}
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                        {log.ipAddress || '—'}
                                    </td>
                                    <td style={{ fontSize: '12px' }}>
                                        {formatDuration(log.startedAt, log.finishedAt)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="pagination">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    ← Prev
                </button>
                <span>
                    {page} / {totalPage}
                </span>
                <button onClick={() => setPage((p) => Math.min(totalPage, p + 1))} disabled={page >= totalPage}>
                    Next →
                </button>
            </div>
        </>
    );
}
