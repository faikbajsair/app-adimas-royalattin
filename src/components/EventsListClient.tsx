'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { bookEventAction } from '@/actions/eventActions';
import { Event } from '@/models/eventModel';
import styles from '@/app/events/events.module.css';

interface EventsListClientProps {
  events: Event[];
}

export default function EventsListClient({ events }: EventsListClientProps) {
  const router = useRouter();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submit Booking Tiket Event
  async function handleBook(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedEvent) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.append('event_id', selectedEvent.id);

    try {
      const res = await bookEventAction(null, formData);
      if (res.error) {
        setError(res.error);
      } else if (res.success) {
        setSuccess(true);
        // Refresh router untuk memicu fetch data Server Component ulang (update kuota terisi)
        router.refresh();
        // Tutup modal setelah delay pendek agar user melihat centang sukses
        setTimeout(() => {
          setSelectedEvent(null);
          setSuccess(false);
        }, 1200);
      }
    } catch (err) {
      setError('Gagal mendaftar. Terjadi gangguan koneksi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.grid}>
      {events.length === 0 ? (
        <div className="glass-panel" style={{ gridColumn: 'span 3', padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          🍃 Belum ada agenda kegiatan atau event sekolah dalam waktu dekat.
        </div>
      ) : (
        events.map((event) => {
          const sisa = event.kuota_total - event.kuota_terisi;
          const isSoldOut = sisa <= 0;

          return (
            <div key={event.id} className={`glass-panel ${styles.eventCard}`}>
              <div className={styles.eventDate}>
                📅 {new Date(event.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <h3 className={styles.eventName}>{event.nama_event}</h3>
              <p className={styles.eventDesc}>{event.deskripsi}</p>
              
              <div className={styles.quotaInfo}>
                <span className={styles.quotaLabel}>Status Kuota:</span>
                <span className={`${styles.badge} ${isSoldOut ? styles.badgeSoldOut : styles.badgeAvailable}`}>
                  {isSoldOut ? 'Kuota Penuh' : `${sisa} Tiket Tersedia`}
                </span>
              </div>

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={isSoldOut}
                onClick={() => setSelectedEvent(event)}
              >
                {isSoldOut ? 'Tutup Pendaftaran' : 'Pesan Tiket Masuk'}
              </button>
            </div>
          );
        })
      )}

      {/* Modal Popup Booking */}
      {selectedEvent && (
        <div className={styles.overlay}>
          <div className={`glass-panel ${styles.modal}`}>
            <h3 className={styles.modalTitle}>Registrasi Event</h3>
            <p className={styles.modalSubtitle}>Agenda: <strong>{selectedEvent.nama_event}</strong></p>

            <form onSubmit={handleBook}>
              {error && (
                <div className="form-status statusError" style={{ padding: '10px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', marginBottom: '16px', fontSize: '0.85rem' }}>
                  ⚠ {error}
                </div>
              )}
              {success && (
                <div className="form-status statusSuccess" style={{ padding: '10px', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', marginBottom: '16px', fontSize: '0.85rem' }}>
                  ✓ Pendaftaran berhasil! Tiket Anda telah dipesan.
                </div>
              )}

              <div className="form-group">
                <label htmlFor="nama_pendaftar" className="form-label">Nama Lengkap</label>
                <input
                  type="text"
                  id="nama_pendaftar"
                  name="nama_pendaftar"
                  className="form-input"
                  required
                  disabled={loading || success}
                  placeholder="Masukkan nama Anda"
                />
              </div>

              <div className="form-group">
                <label htmlFor="whatsapp" className="form-label">Nomor WhatsApp (Format: 628xxx)</label>
                <input
                  type="text"
                  id="whatsapp"
                  name="whatsapp"
                  className="form-input"
                  required
                  disabled={loading || success}
                  placeholder="Contoh: 628123456789"
                />
              </div>

              <div className="form-group">
                <label htmlFor="jumlah_tiket" className="form-label">Jumlah Tiket</label>
                <select id="jumlah_tiket" name="jumlah_tiket" className="form-input" required disabled={loading || success}>
                  <option value="1">1 Tiket</option>
                  <option value="2">2 Tiket</option>
                  <option value="3">3 Tiket</option>
                  <option value="4">4 Tiket</option>
                  <option value="5">5 Tiket (Maksimal)</option>
                </select>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.btnCancel}
                  onClick={() => setSelectedEvent(null)}
                  disabled={loading}
                >
                  Batal
                </button>
                <button type="submit" className="btn-primary" disabled={loading || success}>
                  {loading ? 'Memproses...' : 'Booking Tiket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
