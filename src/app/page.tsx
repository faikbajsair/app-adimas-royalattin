import Link from 'next/link';
import { SchoolInfoModel } from '@/models/infoModel';
import SuggestionForm from '@/components/SuggestionForm';
import styles from './page.module.css';

export const revalidate = 60; // Revalidasi cache halaman utama setiap 60 detik

export default async function HomePage() {
  let info;
  try {
    const infoModel = new SchoolInfoModel();
    info = await infoModel.getInfo();
  } catch (e) {
    console.error('Gagal mengambil data profil sekolah dari Sheets:', e);
    // Data fallback jika koneksi database belum dikonfigurasi di environment variables
    info = {
      name: 'KB-TK ADIMAS',
      sub_name: 'Islamic Character School',
      address: 'Jalan Vila Nusa Indah Raya, Blok M-1, Gunung Putri, Bogor',
      tagline: 'Membentuk Generasi Karakter Islami yang Cerdas & Berakhlak Mulia',
      logo_url: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d28?q=80&w=200&auto=format&fit=crop',
      youtube_url: 'https://youtube.com',
      instagram_url: 'https://instagram.com',
      whatsapp_admin: '6281234567890',
      maps_url: 'https://maps.google.com'
    };
  }

  return (
    <div className="animate-fade-in">
      {/* Header Navigation */}
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.header}`} style={{ padding: 0 }}>
          <div className={styles.brand}>
            <img src={info.logo_url} alt="Logo" className={styles.logo} />
            <span className={styles.brandName}>{info.name}</span>
          </div>
          <nav className={styles.nav}>
            <a href="#profil" className={styles.navLink}>Profil</a>
            <a href="#hubungi" className={styles.navLink}>Saran</a>
            <Link href="/login" className="btn-primary">
              Masuk Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroTagline}>{info.sub_name}</div>
          <h1 className={styles.heroTitle}>{info.tagline}</h1>
          <p className={styles.heroSubtitle}>
            Selamat datang di portal resmi {info.name}. Kami hadir mendidik generasi sholeh, cerdas, berkarakter Islami, dan mandiri sejak usia dini.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
            <Link href="/login" className="btn-primary" style={{ padding: '14px 32px', fontSize: '1rem' }}>
              Daftar PPDB Online
            </Link>
            <a href="#profil" className={styles.navLink} style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '14px 32px' }}>
              Lihat Profil
            </a>
          </div>
        </div>
      </section>

      {/* Cards Portal */}
      <section className={styles.container}>
        <div className={styles.portalGrid}>
          <div className={`glass-panel ${styles.portalCard}`}>
            <span className={styles.cardIcon}>🎒</span>
            <h3 className={styles.cardTitle}>Pendaftaran Murid Baru (PPDB)</h3>
            <p className={styles.cardDesc}>
              Formulir online resmi untuk pendaftaran siswa baru KB-TK Adimas. Efektif, efisien, dan langsung terhubung dengan admin sekolah.
            </p>
            <Link href="/login" className="btn-primary" style={{ marginTop: 'auto' }}>
              Mulai Daftar
            </Link>
          </div>

          <div className={`glass-panel ${styles.portalCard}`}>
            <span className={styles.cardIcon}>🎪</span>
            <h3 className={styles.cardTitle}>Agenda & Kegiatan Event</h3>
            <p className={styles.cardDesc}>
              Ikuti berbagai event sekolah seperti open house, trial class, kajian parenting, dan seminar edukasi menarik.
            </p>
            <Link href="/login" className="btn-primary" style={{ marginTop: 'auto' }}>
              Lihat Event
            </Link>
          </div>

          <div className={`glass-panel ${styles.portalCard}`}>
            <span className={styles.cardIcon}>💼</span>
            <h3 className={styles.cardTitle}>Karir & Lowongan Pendidik</h3>
            <p className={styles.cardDesc}>
              Bergabunglah bersama kami untuk memajukan pendidikan anak usia dini dengan dasar karakter dan akhlak Islami yang mulia.
            </p>
            <Link href="/login" className="btn-primary" style={{ marginTop: 'auto' }}>
              Kirim Lamaran
            </Link>
          </div>
        </div>
      </section>

      {/* Profile & Info Section */}
      <section id="profil" className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Profil & Informasi Kontak</h2>
          
          <div className={styles.infoGrid}>
            <div className={styles.infoContent}>
              <div>
                <h4 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>{info.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  KB-TK Adimas merupakan lembaga pendidikan anak usia dini yang berfokus pada pembentukan akhlakul karimah, karakter kemandirian anak, serta stimulasi kecerdasan motorik dan kognitif secara optimal.
                </p>
              </div>

              <div className={styles.infoItem}>
                <span style={{ fontSize: '1.2rem' }}>📍</span>
                <div>
                  <div className={styles.infoLabel}>Alamat Lembaga</div>
                  <div className={styles.infoVal}>{info.address}</div>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span style={{ fontSize: '1.2rem' }}>💬</span>
                <div>
                  <div className={styles.infoLabel}>WhatsApp Admin</div>
                  <a href={`https://wa.me/${info.whatsapp_admin}`} target="_blank" className={styles.infoVal} style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: '600' }}>
                    +{info.whatsapp_admin} (Hubungi via WA)
                  </a>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span style={{ fontSize: '1.2rem' }}>🌐</span>
                <div>
                  <div className={styles.infoLabel}>Media Sosial</div>
                  <div style={{ display: 'flex', gap: '16px', marginTop: '6px' }}>
                    <a href={info.instagram_url} target="_blank" style={{ textDecoration: 'none', color: 'var(--accent-color)', fontWeight: '500' }}>Instagram</a>
                    <a href={info.youtube_url} target="_blank" style={{ textDecoration: 'none', color: 'var(--accent-color)', fontWeight: '500' }}>YouTube</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Iframe */}
            <div className={styles.mapWrapper}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.748530364966!2d106.96328227448375!3d-6.2967341936924845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d9ab7df7bbf%3A0xc3f588a44ec2be84!2sVila%20Nusa%20Indah%202!5e0!3m2!1sid!2sid!4v1722000000000!5m2!1sid!2sid"
                className={styles.mapFrame}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>
        </div>
      </section>

      {/* Saran Section */}
      <section id="hubungi" className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className={styles.container}>
          <SuggestionForm />
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <p>© {new Date().getFullYear()} {info.name}. Seluruh hak cipta dilindungi.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '6px', opacity: 0.6 }}>Berdasarkan Arsitektur MVC terintegrasi Google Sheets Database & Vercel Serverless.</p>
        </div>
      </footer>
    </div>
  );
}
