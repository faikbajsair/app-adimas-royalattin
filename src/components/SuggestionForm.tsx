'use client';

import { useState } from 'react';
import { submitSuggestionAction } from '@/actions/infoActions';
import styles from '@/app/page.module.css';

export default function SuggestionForm() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await submitSuggestionAction(null, formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(true);
        // Reset form
        (e.target as HTMLFormElement).reset();
      }
    } catch (err) {
      setError('Gagal mengirim data. Hubungan terputus.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`glass-panel ${styles.formCard}`}>
      <h3 style={{ marginBottom: '24px', textAlign: 'center' }}>Kirim Masukan & Saran</h3>
      
      <form onSubmit={handleSubmit}>
        {error && (
          <div className={`${styles.formStatus} ${styles.statusError}`}>
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className={`${styles.formStatus} ${styles.statusSuccess}`}>
            ✓ Masukan Anda berhasil terkirim. Terima kasih atas partisipasi Anda!
          </div>
        )}

        <div className="form-group">
          <label htmlFor="name" className="form-label">Nama Lengkap</label>
          <input
            type="text"
            id="name"
            name="name"
            className="form-input"
            required
            placeholder="Masukkan nama lengkap Anda"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">Alamat Email</label>
          <input
            type="email"
            id="email"
            name="email"
            className="form-input"
            required
            placeholder="nama@email.com"
          />
        </div>

        <div className="form-group" style={{ marginBottom: '32px' }}>
          <label htmlFor="message" className="form-label">Masukan / Saran</label>
          <textarea
            id="message"
            name="message"
            className="form-input"
            rows={5}
            required
            placeholder="Tuliskan saran atau masukan Anda di sini (minimal 10 karakter)..."
            style={{ resize: 'vertical' }}
          ></textarea>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Mengirim...' : 'Kirim Sekarang'}
        </button>
      </form>
    </div>
  );
}
