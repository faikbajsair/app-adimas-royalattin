'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions/authActions';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAction(null, formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(true);
        // Refresh router untuk membersihkan/memperbarui cookies state
        router.refresh();
        // Arahkan ke halaman dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 800);
      }
    } catch (err) {
      setError('Koneksi terputus. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      {/* Background ambient blobs */}
      <div className={`${styles.bgBlob} ${styles.blob1}`}></div>
      <div className={`${styles.bgBlob} ${styles.blob2}`}></div>

      <div className={`glass-panel ${styles.loginCard}`}>
        <div className={styles.cardHeader}>
          <h2 className={styles.title}>Portal ADIMAS</h2>
          <p className={styles.subtitle}>Gunakan akun terdaftar Anda untuk masuk portal</p>
        </div>

        <form onSubmit={handleLogin}>
          {error && (
            <div className={styles.errorAlert}>
              <span>⚠</span> {error}
            </div>
          )}
          {success && (
            <div className={styles.successAlert}>
              ✓ Login Berhasil! Mengalihkan ke dashboard...
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              className="form-input"
              required
              disabled={loading}
              placeholder="Masukkan username Anda"
              autoComplete="username"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '36px' }}>
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              className="form-input"
              required
              disabled={loading}
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', height: '48px' }}
            disabled={loading}
          >
            {loading ? 'Memverifikasi...' : 'Masuk'}
          </button>
        </form>

        <div className={styles.footerLinks}>
          <Link href="/" className={styles.backLink}>
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
