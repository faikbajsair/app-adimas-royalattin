import Link from 'next/link';
import { SchoolInfoModel } from '@/models/infoModel';
import SuggestionForm from '@/components/SuggestionForm';
import styles from './page.module.css';

export const revalidate = 60; // Revalidate home page cache every 60 seconds

export default async function HomePage() {
  let info;
  try {
    const infoModel = new SchoolInfoModel();
    info = await infoModel.getInfo();
  } catch (e) {
    console.error('Gagal mengambil data profil sekolah dari Sheets:', e);
    // Data fallback
    info = {
      name: 'KB-TK Royal Attin',
      sub_name: 'Islamic Character School',
      address: 'Jalan Vila Nusa Indah Raya, Blok M-1, Gunung Putri, Bogor',
      tagline: 'Membentuk Generasi Karakter Islami yang Cerdas & Berakhlak Mulia',
      logo_url: 'https://royalattin.sch.id/assets/img/logo-yayasan-only-removebg.png',
      youtube_url: 'https://www.youtube.com/@tamanmainroyalat-tin7654',
      instagram_url: 'https://www.instagram.com/royalattin',
      whatsapp_admin: '6281290008811',
      maps_url: 'https://maps.google.com'
    };
  }

  return (
    <div className={styles.wrapper}>
      {/* 1. Header Navigation */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.brand}>
            <div className={styles.logoRow}>
              <img src="https://royalattin.sch.id/assets/img/logo-taman-main-removebg.png" alt="Taman Main" className={styles.logoItem} />
              <img src="https://royalattin.sch.id/assets/img/logo-royal-at-tin-removebg.png" alt="Royal At-Tin" className={styles.logoItem} />
              <img src="https://royalattin.sch.id/assets/img/logo-yayasan-only-removebg.png" alt="Yayasan" className={styles.logoItem} />
            </div>
            <span className={styles.brandName}>{info.name}</span>
          </div>
          <nav className={styles.nav}>
            <a href="#profil" className={styles.navLink}>Profil</a>
            <a href="#youtube" className={styles.navLink}>YouTube</a>
            <a href="#artikel" className={styles.navLink}>Artikel</a>
            <a href="#kajian" className={styles.navLink}>Kajian</a>
            <a href="#faq" className={styles.navLink}>FAQ</a>
            <a href="#hubungi" className={styles.navLink}>Saran</a>
            <Link href="/login" className="btn-primary">
              Masuk Portal
            </Link>
          </nav>
        </div>
      </header>

      {/* 2. Hero Section: Landing Page PPDB/SPMB */}
      <section className={styles.hero}>
        <div className={styles.container}>
          <div className={styles.heroLogos}>
            <img src="https://royalattin.sch.id/assets/img/logo-taman-main-removebg.png" alt="Taman Main" className={styles.heroLogoItem} />
            <img src="https://royalattin.sch.id/assets/img/logo-royal-at-tin-removebg.png" alt="Royal At-Tin" className={styles.heroLogoItem} />
            <img src="https://royalattin.sch.id/assets/img/logo-yayasan-only-removebg.png" alt="Yayasan" className={styles.heroLogoItem} />
          </div>
          <div className={styles.heroBadge}>Penerimaan Peserta Didik Baru (PPDB) TA 2026/2027</div>
          <h1 className={styles.heroTitle}>{info.tagline}</h1>
          <p className={styles.heroSubtitle}>
            Selamat datang di portal resmi pendaftaran & manajemen akademik **{info.name}**. Kami mendidik generasi sholeh, cerdas, berkarakter Islami, serta mandiri sejak usia dini.
          </p>

          {/* Quick Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={`glass-panel ${styles.statCard}`}>
              <div className={styles.statVal}>15 Kursi</div>
              <div className={styles.statLabel}>Kuota KB-TK Tersisa</div>
            </div>
            <div className={`glass-panel ${styles.statCard}`}>
              <div className={styles.statVal}>20 Kursi</div>
              <div className={styles.statLabel}>Kuota SD Tersisa</div>
            </div>
            <div className={`glass-panel ${styles.statCard}`}>
              <div className={styles.statVal}>Aktif</div>
              <div className={styles.statLabel}>Gelombang I Terbuka</div>
            </div>
          </div>

          <div className={styles.heroActions}>
            <Link href="/login" className="btn-primary" style={{ padding: '16px 36px', fontSize: '1rem', fontWeight: 'bold' }}>
              Daftar PPDB Online Sekarang
            </Link>
            <a href="#profil" className={styles.btnSecondary}>
              Pelajari Profil Sekolah
            </a>
          </div>
        </div>
      </section>

      {/* 3. Tentang Sekolah (About) */}
      <section id="profil" className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Tentang Sekolah Kami</h2>
          <p className={styles.sectionSubtitle}>
            Yayasan Taman At-Tin menaungi unit-unit pendidikan berkualitas dengan kurikulum yang terintegrasi nilai-nilai Islam, sains, dan pembentukan karakter anak sejak usia dini.
          </p>
          <div className={styles.aboutGrid}>
            <div className={`glass-panel ${styles.aboutCard}`}>
              <span className={styles.aboutIcon}>🎨</span>
              <h3 className={styles.aboutUnitTitle}>KB-TK Taman Main</h3>
              <p className={styles.aboutUnitDesc}>
                Mengembangkan motorik kasar-halus, kemandirian sosial-emosional, serta pengenalan dasar Al-Qur'an dalam lingkungan bermain yang ceria dan merangsang kreativitas anak.
              </p>
            </div>
            <div className={`glass-panel ${styles.aboutCard}`}>
              <span className={styles.aboutIcon}>📚</span>
              <h3 className={styles.aboutUnitTitle}>SD Royal At-Tin</h3>
              <p className={styles.aboutUnitDesc}>
                Mengintegrasikan kurikulum nasional K-Merdeka dengan penguatan adab Islam harian, pembiasaan ibadah sunnah, serta target penguasaan hafalan Al-Qur'an secara terstruktur.
              </p>
            </div>
            <div className={`glass-panel ${styles.aboutCard}`}>
              <span className={styles.aboutIcon}>✨</span>
              <h3 className={styles.aboutUnitTitle}>NURA Tahfidz Center</h3>
              <p className={styles.aboutUnitDesc}>
                Program intensif khusus tahfidz Quran dengan pengajar berpengalaman, melatih pelafalan makhroj huruf yang fasih, tajwid dasar, serta murojaah yang konsisten.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Channel Youtube Sekolah */}
      <section id="youtube" className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Dokumentasi Channel YouTube</h2>
          <p className={styles.sectionSubtitle}>
            Lihat langsung cuplikan keseruan belajar, kegiatan luar ruangan, dan kajian edukasi melalui channel YouTube resmi kami.
          </p>
          <div className={styles.youtubeContent}>
            <div className={styles.youtubeCard}>
              <div className={styles.videoPlaceholder}>
                {/* Embed video dummy / link directly to YouTube channel */}
                <iframe
                  src="https://www.youtube.com/embed?listType=user_uploads&list=tamanmainroyalat-tin7654"
                  title="Royal At-Tin YouTube Channel"
                  className={styles.videoIframe}
                  allowFullScreen
                ></iframe>
              </div>
              <div className={styles.youtubeText}>
                <h4>Kunjungi & Subscribe Channel Kami</h4>
                <p>Ikuti video kajian keislaman, manasik haji cilik, market day, dan trial class siswa kami.</p>
                <a href={info.youtube_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex', marginTop: '12px' }}>
                  Buka YouTube Channel 🎬
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Teknologi Pendidikan di Sekolah (EdTech) */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Teknologi Pendidikan Modern</h2>
          <p className={styles.sectionSubtitle}>
            Kami menggunakan sistem teknologi mutakhir guna mendukung kegiatan administrasi, laporan absensi siswa, dan transparansi raport akademik.
          </p>
          <div className={styles.techGrid}>
            <div className={styles.techCard}>
              <div className={styles.techIcon}>📊</div>
              <h4>Database Real-Time Cloud</h4>
              <p>Mengintegrasikan sistem formulir dengan database Google Sheets secara transparan dan terenkripsi aman.</p>
            </div>
            <div className={styles.techCard}>
              <div className={styles.techIcon}>📱</div>
              <h4>Portal Wali Murid</h4>
              <p>Akses akun personal untuk orang tua guna memantau riwayat absen harian, tugas sekolah, dan pembayaran biaya PPDB.</p>
            </div>
            <div className={styles.techCard}>
              <div className={styles.techIcon}>💬</div>
              <h4>Notifikasi Otomatis</h4>
              <p>Laporan langsung terkait absensi kehadiran siswa yang terintegrasi dengan pengiriman pesan terprogram.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Gallery Tahfidz */}
      <section className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Galeri Tahfidz & Quran</h2>
          <p className={styles.sectionSubtitle}>
            Dokumentasi proses hafalan Al-Qur'an harian siswa dengan pembiasaan adab-adab keislaman.
          </p>
          <div className={styles.tahfidzGrid}>
            <div className={styles.tahfidzCard}>
              <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop" alt="Membaca Quran" className={styles.tahfidzImg} />
              <div className={styles.tahfidzCardBody}>
                <h5>Ziyadah & Murojaah</h5>
                <p>Siswa menyetorkan hafalan harian baru secara face-to-face dengan Ustadz pendamping.</p>
              </div>
            </div>
            <div className={styles.tahfidzCard}>
              <img src="https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&auto=format&fit=crop" alt="Pelajaran Tajwid" className={styles.tahfidzImg} />
              <div className={styles.tahfidzCardBody}>
                <h5>Pelajaran Adab & Doa</h5>
                <p>Selain menghafal, siswa dibekali dengan adab makan, tidur, berteman, serta doa-doa harian penting.</p>
              </div>
            </div>
            <div className={styles.tahfidzCard}>
              <img src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop" alt="Evaluasi Tahfidz" className={styles.tahfidzImg} />
              <div className={styles.tahfidzCardBody}>
                <h5>Wisuda Tahfidz Juz 30</h5>
                <p>Apresiasi kelulusan setoran Juz 30 lengkap bagi siswa berprestasi yang siap lanjut ke Juz 29.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Newsletter */}
      <section className={styles.newsletterSection}>
        <div className={styles.container}>
          <div className={`glass-panel ${styles.newsletterBox}`}>
            <h3>Langganan Informasi & Tips Parenting</h3>
            <p>Dapatkan berkala tips mendidik anak secara Islami, info webinar parenting, serta agenda event penting sekolah gratis.</p>
            <form className={styles.newsletterForm} action="/#newsletter" method="GET">
              <input type="email" placeholder="Masukkan alamat email Anda..." required className={styles.newsletterInput} name="email" />
              <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>Daftar Sekarang</button>
            </form>
          </div>
        </div>
      </section>

      {/* 8. Artikel Diniyah */}
      <section id="artikel" className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Artikel Diniyah & Parenting</h2>
          <p className={styles.sectionSubtitle}>
            Kumpulan tulisan ilmiah ringan seputar pendidikan anak dalam kacamata syariat Islam yang sholih.
          </p>
          <div className={styles.articlesGrid}>
            <div className={`glass-panel ${styles.articleCard}`}>
              <div className={styles.articleBadge}>PARENTING</div>
              <h4>Membentuk Karakter Anak Sesuai Sunnah Nabi</h4>
              <p>Pentingnya melatih kemandirian dan kesabaran anak usia dini melalui teladan adab harian Rasulullah SAW.</p>
              <span className={styles.articleReadMore}>Baca Selengkapnya →</span>
            </div>
            <div className={`glass-panel ${styles.articleCard}`}>
              <div className={styles.articleBadge}>AQIDAH</div>
              <h4>Menanamkan Tauhid Sejak Anak Belajar Bicara</h4>
              <p>Metode sederhana mengajarkan anak mengenal Allah sebagai Sang Pencipta melalui alam sekitar.</p>
              <span className={styles.articleReadMore}>Baca Selengkapnya →</span>
            </div>
            <div className={`glass-panel ${styles.articleCard}`}>
              <div className={styles.articleBadge}>ADAB</div>
              <h4>Mengajarkan Adab Sebelum Ilmu di Sekolah</h4>
              <p>Mengapa penanaman sopan santun, menghormati guru, dan adab belajar harus mendahului materi hafalan akademik.</p>
              <span className={styles.articleReadMore}>Baca Selengkapnya →</span>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Informasi Kajian */}
      <section id="kajian" className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Informasi Kajian Bulanan</h2>
          <p className={styles.sectionSubtitle}>
            Ikuti majelis ilmu rutin bulanan sekolah yang membahas tema diniyah, keluarga sakinah, dan psikologi perkembangan anak.
          </p>
          <div className={`glass-panel ${styles.kajianCard}`}>
            <div className={styles.kajianBadge}>SEMINAR PARENTING RUTIN</div>
            <h3>Kajian Bulanan: "Membimbing Buah Hati di Era Digital Sesuai Syariat"</h3>
            <div className={styles.kajianDetails}>
              <div><strong>🎙️ Pemateri:</strong> Ustadz Syarif Hidayatullah, Lc., M.A.</div>
              <div><strong>📅 Tanggal:</strong> Sabtu, 22 Agustus 2026</div>
              <div><strong>⏰ Waktu:</strong> 09.00 - 11.30 WIB</div>
              <div><strong>📍 Tempat:</strong> Aula Sekolah Royal At-Tin & Live Streaming YouTube</div>
            </div>
            <a href={`https://wa.me/${info.whatsapp_admin}?text=Halo%20Admin,%20saya%20tertarik%20mengikuti%20Kajian%20Parenting%20Royal%20Attin.`} target="_blank" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '16px' }}>
              Daftar Kajian (Gratis)
            </a>
          </div>
        </div>
      </section>

      {/* 10. Testimoni Sekolah */}
      <section className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Apa Kata Orang Tua Murid?</h2>
          <p className={styles.sectionSubtitle}>
            Pengalaman nyata wali murid setelah menyekolahkan putra-putri mereka di sekolah Royal At-Tin.
          </p>
          <div className={styles.testimonialGrid}>
            <div className={`glass-panel ${styles.testimonialCard}`}>
              <p className={styles.testiText}>
                "Alhamdulillah, perkembangan adab dan kemandirian Zhafran luar biasa setelah 6 bulan di KB-TK Taman Main. Hafalan dzikir pagi petang dan doa hariannya selalu dipraktikkan secara konsisten di rumah."
              </p>
              <div className={styles.testiAuthor}>
                <strong>Bunda Fatimah</strong>
                <span>Orang Tua Zhafran (KB-TK)</span>
              </div>
            </div>
            <div className={`glass-panel ${styles.testimonialCard}`}>
              <p className={styles.testiText}>
                "Sistem raport digital dan monitoring absensinya memudahkan kami memantau aktivitas belajar anak dari kantor. Kurikulum akademiknya sangat berimbang dengan penguatan akidah dan tahfidz."
              </p>
              <div className={styles.testiAuthor}>
                <strong>Abi Ibrahim</strong>
                <span>Orang Tua Lionel (SD Kelas 2)</span>
              </div>
            </div>
            <div className={`glass-panel ${styles.testimonialCard}`}>
              <p className={styles.testiText}>
                "Anak saya sebelumnya sulit diajak menghafal, namun guru di NURA Tahfidz Center punya metode yang asyik sehingga anak justru antusias menyetor hafalan barunya setiap hari."
              </p>
              <div className={styles.testiAuthor}>
                <strong>Bunda Sarah</strong>
                <span>Orang Tua Aisyah (NURA)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 11. Gallery Kegiatan Siswa */}
      <section className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Galeri Kegiatan Siswa</h2>
          <p className={styles.sectionSubtitle}>
            Dokumentasi keceriaan belajar, olahraga sunnah, praktek ibadah, dan outing class para siswa.
          </p>
          <div className={styles.galleryGrid}>
            <div className={styles.galleryItem}>
              <img src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=400&auto=format&fit=crop" alt="Belajar Panahan" />
              <div className={styles.galleryOverlay}>Latihan Memanah</div>
            </div>
            <div className={styles.galleryItem}>
              <img src="https://images.unsplash.com/photo-1564419320461-6870880221ad?q=80&w=400&auto=format&fit=crop" alt="Bermain Bersama" />
              <div className={styles.galleryOverlay}>Interaksi Sosial & Bermain</div>
            </div>
            <div className={styles.galleryItem}>
              <img src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400&auto=format&fit=crop" alt="Market Day" />
              <div className={styles.galleryOverlay}>Kreativitas Market Day</div>
            </div>
            <div className={styles.galleryItem}>
              <img src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=400&auto=format&fit=crop" alt="Praktek Sholat" />
              <div className={styles.galleryOverlay}>Praktek Manasik & Sholat</div>
            </div>
          </div>
        </div>
      </section>

      {/* 12. Question & Answer (FAQ) */}
      <section id="faq" className={styles.section}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Pertanyaan yang Sering Diajukan (FAQ)</h2>
          <p className={styles.sectionSubtitle}>
            Temukan jawaban cepat seputar proses pendaftaran PPDB, kurikulum diniyah, dan operasional sekolah kami.
          </p>
          <div className={styles.faqList}>
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>Kapan Pendaftaran PPDB TA 2026/2027 dibuka?</summary>
              <div className={styles.faqAnswer}>
                Pendaftaran PPDB Gelombang I telah dibuka resmi mulai Agustus 2026. Gelombang I akan ditutup otomatis apabila kuota kelas untuk KB-TK (15 orang) dan SD (20 orang) telah terisi penuh.
              </div>
            </details>
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>Apakah ada fasilitas antar-jemput bagi siswa?</summary>
              <div className={styles.faqAnswer}>
                Ya, sekolah kami menyediakan jasa antar-jemput berlangganan dengan wilayah jangkauan meliputi area Gunung Putri, Vila Nusa Indah, Ciangsana, dan sekitarnya menggunakan armada ber-AC yang aman.
              </div>
            </details>
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>Berapa target hafalan Al-Qur'an untuk SD?</summary>
              <div className={styles.faqAnswer}>
                Untuk jenjang SD, kami menargetkan siswa minimal mampu menghafal 2 Juz (Juz 30 & 29) secara lancar (mutqin) dengan tajwid dasar yang benar pada saat kelulusan kelas 6.
              </div>
            </details>
            <details className={styles.faqItem}>
              <summary className={styles.faqQuestion}>Bagaimana cara memantau kehadiran anak di sekolah?</summary>
              <div className={styles.faqAnswer}>
                Wali murid dapat login ke Portal Akademik kami untuk melihat rekap kehadiran absensi anak yang terupdate harian secara real-time dari guru kelas.
              </div>
            </details>
          </div>
        </div>
      </section>

      {/* 13. Kontak & Pendaftaran (Footer / Saran) */}
      <section id="hubungi" className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>Hubungi & Kirim Masukan</h2>
          <p className={styles.sectionSubtitle}>
            Ada pertanyaan atau ingin menyampaikan saran kritik kepada manajemen sekolah? Kirim pesan Anda melalui formulir di bawah ini.
          </p>
          <div className={styles.contactGrid}>
            <div className={styles.contactDetails}>
              <h4>Kontak Informasi</h4>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Silakan hubungi kami atau kunjungi lokasi sekolah kami langsung.</p>
              
              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📍</span>
                <div>
                  <strong>Alamat Sekolah:</strong>
                  <p>{info.address}</p>
                </div>
              </div>

              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📞</span>
                <div>
                  <strong>WhatsApp PPDB / Admin:</strong>
                  <p>
                    <a href={`https://wa.me/${info.whatsapp_admin}`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                      +{info.whatsapp_admin}
                    </a>
                  </p>
                </div>
              </div>

              <div className={styles.contactItem}>
                <span className={styles.contactIcon}>📸</span>
                <div>
                  <strong>Sosial Media:</strong>
                  <p>
                    <a href={info.instagram_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none', marginRight: '16px' }}>Instagram</a>
                    <a href={info.youtube_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-color)', textDecoration: 'none' }}>YouTube</a>
                  </p>
                </div>
              </div>

              <div className={styles.mapContainer}>
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.748530364966!2d106.96328227448375!3d-6.2967341936924845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d9ab7df7bbf%3A0xc3f588a44ec2be84!2sVila%20Nusa%20Indah%202!5e0!3m2!1sid!2sid!4v1722000000000!5m2!1sid!2sid"
                  width="100%"
                  height="180px"
                  style={{ border: 0, borderRadius: '8px' }}
                  allowFullScreen={false}
                  loading="lazy"
                ></iframe>
              </div>
            </div>

            <div className={`glass-panel ${styles.formContainer}`}>
              <SuggestionForm />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerLogos}>
            <img src="https://royalattin.sch.id/assets/img/logo-taman-main-removebg.png" alt="Taman Main" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <img src="https://royalattin.sch.id/assets/img/logo-royal-at-tin-removebg.png" alt="Royal At-Tin" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
            <img src="https://royalattin.sch.id/assets/img/logo-yayasan-only-removebg.png" alt="Yayasan" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <p>© {new Date().getFullYear()} Royal Attin. Seluruh hak cipta dilindungi.</p>
          <p style={{ fontSize: '0.75rem', marginTop: '6px', opacity: 0.5 }}>Development by F-Develop</p>
        </div>
      </footer>
    </div>
  );
}
