import { useEffect, useState, useRef } from 'react';
import {
    getAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    startOneWorker,
    downloadTemplate,
    importAccounts,
} from '../api';

interface Account {
    id: number;
    username: string;
    password: string;
    label: string | null;
    isActive: boolean;
    latitude: number | null;
    longitude: number | null;
    city: string | null;
    proxyUrl: string | null;
}

const CITIES = [
    { name: 'Jakarta', lat: -6.2088, lng: 106.8456 },
    { name: 'Surabaya', lat: -7.2575, lng: 112.7521 },
    { name: 'Bandung', lat: -6.9175, lng: 107.6191 },
    { name: 'Medan', lat: 3.5952, lng: 98.6722 },
    { name: 'Semarang', lat: -6.9666, lng: 110.4196 },
    { name: 'Makassar', lat: -5.1477, lng: 119.4327 },
    { name: 'Palembang', lat: -2.9761, lng: 104.7754 },
    { name: 'Denpasar', lat: -8.6705, lng: 115.2126 },
    { name: 'Yogyakarta', lat: -7.7956, lng: 110.3695 },
    { name: 'Balikpapan', lat: -1.2654, lng: 116.8311 },
];

const EMPTY_FORM = {
    username: '',
    password: '',
    label: '',
    city: 'Jakarta',
    latitude: -6.2088,
    longitude: 106.8456,
    proxyUrl: '',
    isActive: true,
};

export default function Accounts() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [page, setPage] = useState(1);
    const [totalPage, setTotalPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState<number | null>(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchAccounts = async () => {
        try {
            const res = await getAccounts(page, 15);
            setAccounts(res.data.data);
            setTotalPage(res.data.paging.totalPage);
        } catch {
            // offline
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [page]);

    const openCreate = () => {
        setEditId(null);
        setForm(EMPTY_FORM);
        setShowModal(true);
    };

    const openEdit = (acc: Account) => {
        setEditId(acc.id);
        setForm({
            username: acc.username,
            password: acc.password,
            label: acc.label || '',
            city: acc.city || 'Jakarta',
            latitude: acc.latitude || -6.2088,
            longitude: acc.longitude || 106.8456,
            proxyUrl: acc.proxyUrl || '',
            isActive: acc.isActive,
        });
        setShowModal(true);
    };

    const handleCityChange = (cityName: string) => {
        const city = CITIES.find((c) => c.name === cityName);
        if (city) {
            setForm({ ...form, city: city.name, latitude: city.lat, longitude: city.lng });
        } else {
            setForm({ ...form, city: cityName });
        }
    };

    const handleSave = async () => {
        const payload = {
            ...form,
            proxyUrl: form.proxyUrl || undefined,
            label: form.label || undefined,
        };
        if (editId) {
            await updateAccount(editId, payload);
        } else {
            await createAccount(payload);
        }
        setShowModal(false);
        fetchAccounts();
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Yakin hapus akun ini?')) return;
        await deleteAccount(id);
        fetchAccounts();
    };

    const handleRun = async (id: number) => {
        await startOneWorker(id);
        alert('Akun ditambahkan ke queue!');
    };

    const handleDownloadTemplate = async () => {
        try {
            const res = await downloadTemplate();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'template-import-akun.xlsx');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch {
            alert('Gagal download template');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input agar bisa upload file yang sama lagi
        e.target.value = '';

        if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
            alert('File harus berformat .xlsx atau .xls');
            return;
        }

        setImporting(true);
        try {
            const res = await importAccounts(file);
            const { imported, failed, errors } = res.data;

            let message = `✅ Import selesai!\n\nBerhasil: ${imported} akun`;
            if (failed > 0) {
                message += `\n❌ Gagal: ${failed} akun`;
                if (errors?.length > 0) {
                    message += `\n\nDetail error:\n${errors.slice(0, 5).join('\n')}`;
                    if (errors.length > 5) {
                        message += `\n... dan ${errors.length - 5} error lainnya`;
                    }
                }
            }

            alert(message);
            fetchAccounts();
        } catch (err: any) {
            const errMsg = err?.response?.data?.message || 'Gagal import file';
            alert(`❌ ${errMsg}`);
        } finally {
            setImporting(false);
        }
    };

    return (
        <>
            <div className="page-header">
                <h2>Manajemen Akun</h2>
                <p>Tambah, edit, dan jalankan akun untuk login harian</p>
            </div>

            <div className="toolbar">
                <div className="btn-group">
                    <button className="btn btn-primary" onClick={openCreate}>
                        + Tambah Akun
                    </button>
                    <button className="btn btn-secondary" onClick={handleDownloadTemplate}>
                        📥 Download Template
                    </button>
                    <button
                        className="btn btn-success"
                        onClick={handleImportClick}
                        disabled={importing}
                    >
                        {importing ? '⏳ Mengimpor...' : '📤 Import Excel'}
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                </div>
                <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                    Halaman {page} / {totalPage}
                </span>
            </div>

            <div className="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Username</th>
                            <th>Label</th>
                            <th>Kota</th>
                            <th>Proxy</th>
                            <th>Status</th>
                            <th>Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 ? (
                            <tr>
                                <td colSpan={7}>
                                    <div className="empty-state">
                                        <div className="icon">👥</div>
                                        <p>Belum ada akun. Klik "Tambah Akun" untuk mulai.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            accounts.map((acc) => (
                                <tr key={acc.id}>
                                    <td style={{ color: 'var(--text-muted)' }}>#{acc.id}</td>
                                    <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                                        {acc.username}
                                    </td>
                                    <td>{acc.label || '—'}</td>
                                    <td>{acc.city || '—'}</td>
                                    <td style={{ fontSize: '12px', fontFamily: 'monospace' }}>
                                        {acc.proxyUrl ? acc.proxyUrl.substring(0, 25) + '...' : 'WARP'}
                                    </td>
                                    <td>
                                        <span className={`status-dot ${acc.isActive ? 'active' : 'inactive'}`} />
                                        {acc.isActive ? 'Aktif' : 'Nonaktif'}
                                    </td>
                                    <td>
                                        <div className="btn-group">
                                            <button className="btn btn-success btn-sm" onClick={() => handleRun(acc.id)}>
                                                ▶
                                            </button>
                                            <button className="btn btn-secondary btn-sm" onClick={() => openEdit(acc)}>
                                                ✏️
                                            </button>
                                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(acc.id)}>
                                                🗑
                                            </button>
                                        </div>
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

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{editId ? 'Edit Akun' : 'Tambah Akun Baru'}</h3>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Username</label>
                                <input
                                    className="form-input"
                                    placeholder="username"
                                    value={form.username}
                                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    className="form-input"
                                    type="password"
                                    placeholder="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Label (Opsional)</label>
                            <input
                                className="form-input"
                                placeholder="Misal: Akun Kantor 1"
                                value={form.label}
                                onChange={(e) => setForm({ ...form, label: e.target.value })}
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Kota / Lokasi</label>
                                <select
                                    className="form-input"
                                    value={form.city}
                                    onChange={(e) => handleCityChange(e.target.value)}
                                >
                                    {CITIES.map((c) => (
                                        <option key={c.name} value={c.name}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Proxy (Opsional)</label>
                                <input
                                    className="form-input"
                                    placeholder="socks5://host:port"
                                    value={form.proxyUrl}
                                    onChange={(e) => setForm({ ...form, proxyUrl: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="form-row-3">
                            <div className="form-group">
                                <label>Latitude</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    step="0.0001"
                                    value={form.latitude}
                                    onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Longitude</label>
                                <input
                                    className="form-input"
                                    type="number"
                                    step="0.0001"
                                    value={form.longitude}
                                    onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    className="form-input"
                                    value={form.isActive ? 'true' : 'false'}
                                    onChange={(e) => setForm({ ...form, isActive: e.target.value === 'true' })}
                                >
                                    <option value="true">Aktif</option>
                                    <option value="false">Nonaktif</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Batal
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                {editId ? 'Simpan' : 'Tambah'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
