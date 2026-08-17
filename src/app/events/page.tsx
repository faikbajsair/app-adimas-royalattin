import Link from 'next/link';
import { EventModel } from '@/models/eventModel';
import EventsListClient from '@/components/EventsListClient';
import styles from './events.module.css';

export const dynamic = 'force-dynamic'; // Selalu render secara dinamis di server

export default async function EventsPage() {
  let events: any[] = [];
  try {
    const eventModel = new EventModel();
    events = await eventModel.getEvents();
  } catch (e) {
    console.error('Gagal mengambil daftar event:', e);
  }

  return (
    <div className={styles.container}>
      <header style={{ marginBottom: '40px', textAlign: 'center' }}>
        <h1 className={styles.title}>Agenda & Event Sekolah</h1>
        <p className={styles.subtitle}>KB-TK Royal Attin - Islamic Character School</p>
      </header>

      {/* List Event (Client Interactive Component) */}
      <EventsListClient events={events} />

      <div style={{ textAlign: 'center', marginTop: '40px' }}>
        <Link href="/ppdb" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'none' }}>
          ← Kembali ke Halaman Utama
        </Link>
      </div>
    </div>
  );
}
