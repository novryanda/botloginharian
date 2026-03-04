import { useEffect, useState } from 'react';
import { getSettings, updateSettings } from '../api';

export default function Settings() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const fetchSettings = async () => {
        try {
            const res = await getSettings();
            setSettings(res.data.data);
        } catch {
            // offline
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (key: string, value: string) => {
        setSettings({ ...settings, [key]: value });
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateSettings(settings);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h2>Pengaturan</h2>
                <p>Konfigurasi global bot login harian</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                <div className="form-group">
                    <label>Wait Time (menit)</label>
                    <input
                        className="form-input"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.waitTimeMinutes || '5'}
                        onChange={(e) => handleChange('waitTimeMinutes', e.target.value)}
                    />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Durasi bot tetap online setelah login sebelum logout
                    </p>
                </div>

                <div className="form-group">
                    <label>Max Concurrent Workers</label>
                    <input
                        className="form-input"
                        type="number"
                        min="1"
                        max="50"
                        value={settings.maxConcurrent || '10'}
                        onChange={(e) => handleChange('maxConcurrent', e.target.value)}
                    />
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        Jumlah worker Playwright yang berjalan paralel (BullMQ concurrency)
                    </p>
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
                    <div className="btn-group">
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? '⏳ Menyimpan...' : '💾 Simpan Pengaturan'}
                        </button>
                        {saved && (
                            <span style={{ color: 'var(--success)', fontSize: '13px', alignSelf: 'center' }}>
                                ✅ Tersimpan!
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="card" style={{ maxWidth: '600px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '16px' }}>ℹ️ Informasi</h3>
                <table style={{ fontSize: '13px' }}>
                    <tbody>
                        <tr>
                            <td style={{ fontWeight: 600, paddingRight: '16px' }}>Target URL</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                visa.ktbfuso.id/login
                            </td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 600, paddingRight: '16px' }}>Redirect</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                runner.ktbfuso.co.id/dashboard
                            </td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 600, paddingRight: '16px' }}>Logout</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                runner.ktbfuso.co.id/profile
                            </td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 600, paddingRight: '16px' }}>Scheduler</td>
                            <td>Setiap hari pukul 07:00 WIB (otomatis)</td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 600, paddingRight: '16px' }}>Default Proxy</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                WARP Docker (socks5://warp:1080)
                            </td>
                        </tr>
                        <tr>
                            <td style={{ fontWeight: 600, paddingRight: '16px' }}>Queue Monitor</td>
                            <td>
                                <a
                                    href="http://localhost:3000/admin/queues"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: 'var(--accent)' }}
                                >
                                    Bull Board →
                                </a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </>
    );
}
