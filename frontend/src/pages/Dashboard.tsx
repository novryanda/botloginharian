import { useEffect, useState } from 'react';
import { getAccounts, getWorkerStatus, startAllWorkers, stopAllWorkers } from '../api';

interface QueueStatus {
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
}

export default function Dashboard() {
    const [totalAccounts, setTotalAccounts] = useState(0);
    const [status, setStatus] = useState<QueueStatus | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchData = async () => {
        try {
            const [accRes, statusRes] = await Promise.all([
                getAccounts(1, 1),
                getWorkerStatus(),
            ]);
            setTotalAccounts(accRes.data.paging?.totalPage * accRes.data.paging?.size || 0);
            setStatus(statusRes.data.data);
        } catch {
            // Backend offline
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleStartAll = async () => {
        setLoading(true);
        try {
            await startAllWorkers();
            await fetchData();
        } finally {
            setLoading(false);
        }
    };

    const handleStopAll = async () => {
        setLoading(true);
        try {
            await stopAllWorkers();
            await fetchData();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h2>Dashboard</h2>
                <p>Monitoring bot login harian — status queue dan worker</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card orange">
                    <div className="stat-label">Total Akun</div>
                    <div className="stat-value">{totalAccounts}</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-label">Waiting</div>
                    <div className="stat-value">{status?.waiting ?? '—'}</div>
                </div>
                <div className="stat-card yellow">
                    <div className="stat-label">Active</div>
                    <div className="stat-value">{status?.active ?? '—'}</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-label">Completed</div>
                    <div className="stat-value">{status?.completed ?? '—'}</div>
                </div>
                <div className="stat-card red">
                    <div className="stat-label">Failed</div>
                    <div className="stat-value">{status?.failed ?? '—'}</div>
                </div>
            </div>

            <div className="btn-group">
                <button className="btn btn-primary" onClick={handleStartAll} disabled={loading}>
                    {loading ? '⏳ Processing...' : '▶️ Start All Workers'}
                </button>
                <button className="btn btn-danger" onClick={handleStopAll} disabled={loading}>
                    ⏹ Stop All
                </button>
                <a
                    href="http://localhost:3000/admin/queues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                >
                    📊 Bull Board
                </a>
            </div>
        </>
    );
}
