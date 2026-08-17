'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginAction } from '@/actions/authActions';
import Link from 'next/link';
import styles from './page.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState<string | null>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setShowErrorPopup(null);
    setShowSuccessPopup(false);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await loginAction(null, formData);
      if (res.error) {
        setShowErrorPopup(res.error);
      } else if (res.success) {
        setShowSuccessPopup(true);
        // Refresh router untuk membersihkan/memperbarui cookies state
        router.refresh();
        // Arahkan ke halaman dashboard
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (err) {
      setShowErrorPopup('Koneksi terputus. Silakan coba lagi.');
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
        <div className={styles.cardHeader} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginBottom: '8px' }}>
            <img src="https://royalattin.sch.id/assets/img/logo-taman-main-removebg.png" alt="Taman Main" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <img src="https://royalattin.sch.id/assets/img/logo-royal-at-tin-removebg.png" alt="Royal At-Tin" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <img src="https://royalattin.sch.id/assets/img/logo-yayasan-only-removebg.png" alt="Yayasan" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <h2 className={styles.title} style={{ margin: 0 }}>Portal Royal Attin</h2>
          <p className={styles.subtitle} style={{ margin: 0 }}>Gunakan akun terdaftar Anda untuk masuk portal</p>
        </div>

        <form onSubmit={handleLogin}>
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
            Masuk
          </button>
        </form>

        <div className={styles.footerLinks}>
          <Link href="/ppdb" className={styles.backLink}>
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>

      {/* 1. Loading Overlay with Buffer Spinner */}
      {loading && (
        <div className={styles.loaderOverlay}>
          <div className={styles.loaderContent}>
            <div className={styles.spinner}></div>
            <p style={{ fontWeight: 600, fontSize: '1rem', margin: '12px 0 0 0' }}>Memverifikasi Akun Anda...</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.8, margin: '4px 0 0 0' }}>Mohon tunggu sebentar</p>
          </div>
        </div>
      )}

      {/* 2. Success Alert Popup */}
      {showSuccessPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupCard} style={{ borderTop: '6px solid #22c55e' }}>
            <span className={styles.popupIcon}>🎉</span>
            <h3 className={styles.popupTitle} style={{ color: '#22c55e' }}>Login Berhasil!</h3>
            <p className={styles.popupDesc}>
              Selamat datang kembali. Anda akan dialihkan ke Dashboard dalam beberapa saat.
            </p>
            <div className={styles.spinner} style={{ margin: '0 auto', width: '28px', height: '28px', borderTopColor: '#22c55e' }}></div>
          </div>
        </div>
      )}

      {/* 3. Error Alert Popup */}
      {showErrorPopup && (
        <div className={styles.popupOverlay}>
          <div className={styles.popupCard} style={{ borderTop: '6px solid #ef4444' }}>
            <span className={styles.popupIcon}>⚠️</span>
            <h3 className={styles.popupTitle} style={{ color: '#ef4444' }}>Login Gagal</h3>
            <p className={styles.popupDesc}>{showErrorPopup}</p>
            <button 
              type="button" 
              className={styles.popupButton} 
              style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
              onClick={() => setShowErrorPopup(null)}
            >
              Coba Lagi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
