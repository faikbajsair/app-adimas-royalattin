import Link from 'next/link';
import { SchoolInfoModel } from '@/models/infoModel';
import { LandingSectionModel, LandingSectionItemModel, LandingSection, LandingSectionItem, seedDefaultLandingData } from '@/models/landingModel';
import SuggestionForm from '@/components/SuggestionForm';
import styles from './page.module.css';

export const revalidate = 60; // Revalidate home page cache every 60 seconds

export default async function HomePage() {
  let info;
  let dbSections: LandingSection[] = [];
  let dbItems: LandingSectionItem[] = [];

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

  try {
    const sectionModel = new LandingSectionModel();
    const itemModel = new LandingSectionItemModel();

    dbSections = await sectionModel.getSections();
    dbItems = await itemModel.getItems();

    // Jika kosong, lakukan inisialisasi/seeding data default ke Google Sheets
    if (dbSections.length === 0) {
      console.log('Landing sections kosong di Sheets. Menjalankan inisialisasi data default...');
      await seedDefaultLandingData();
      dbSections = await sectionModel.getSections();
      dbItems = await itemModel.getItems();
    }
  } catch (e) {
    console.error('Gagal mengambil data CMS Landing dari Sheets:', e);
  }

  // Pengelompokan item berdasarkan Section ID
  const itemsBySection: Record<string, LandingSectionItem[]> = {};
  dbItems.forEach(item => {
    if (!itemsBySection[item.section_id]) {
      itemsBySection[item.section_id] = [];
    }
    itemsBySection[item.section_id].push(item);
  });

  // Urutkan item di masing-masing section berdasarkan order_index
  Object.keys(itemsBySection).forEach(secId => {
    itemsBySection[secId].sort((a, b) => Number(a.order_index) - Number(b.order_index));
  });

  // Urutkan section utama berdasarkan order_index dan saring hanya yang Active
  const activeSections = dbSections
    .filter(sec => sec.status === 'Active')
    .sort((a, b) => Number(a.order_index) - Number(b.order_index));

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

      {/* RENDER DYNAMIC ACTIVE SECTIONS */}
      {activeSections.map(sec => {
        const secItems = itemsBySection[sec.id] || [];

        switch (sec.id) {
          case 'hero': {
            return (
              <section key={sec.id} className={styles.hero}>
                <div className={styles.container}>
                  <div className={styles.heroLogos}>
                    <img src="https://royalattin.sch.id/assets/img/logo-taman-main-removebg.png" alt="Taman Main" className={styles.heroLogoItem} />
                    <img src="https://royalattin.sch.id/assets/img/logo-royal-at-tin-removebg.png" alt="Royal At-Tin" className={styles.heroLogoItem} />
                    <img src="https://royalattin.sch.id/assets/img/logo-yayasan-only-removebg.png" alt="Yayasan" className={styles.heroLogoItem} />
                  </div>
                  <div className={styles.heroBadge}>Penerimaan Peserta Didik Baru (PPDB) TA 2026/2027</div>
                  <h1 className={styles.heroTitle}>{sec.title || info.tagline}</h1>
                  <p className={styles.heroSubtitle}>
                    {sec.subtitle || `Selamat datang di portal resmi pendaftaran & manajemen akademik ${info.name}. Kami mendidik generasi sholeh, cerdas, berkarakter Islami, serta mandiri sejak usia dini.`}
                  </p>

                  {/* Quick Stats Grid */}
                  {secItems.length > 0 && (
                    <div className={styles.statsGrid}>
                      {secItems.map(item => (
                        <div key={item.id} className={`glass-panel ${styles.statCard}`}>
                          <div className={styles.statVal}>{item.title}</div>
                          <div className={styles.statLabel}>{item.description}</div>
                        </div>
                      ))}
                    </div>
                  )}

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
            );
          }

          case 'about': {
            return (
              <section key={sec.id} id="profil" className={styles.section}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Tentang Sekolah Kami'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Yayasan Taman At-Tin menaungi unit-unit pendidikan berkualitas dengan kurikulum yang terintegrasi nilai-nilai Islam, sains, dan pembentukan karakter anak sejak usia dini.'}
                  </p>
                  {secItems.length > 0 && (
                    <div className={styles.aboutGrid}>
                      {secItems.map(item => (
                        <div key={item.id} className={`glass-panel ${styles.aboutCard}`}>
                          <span className={styles.aboutIcon}>{item.badge}</span>
                          <h3 className={styles.aboutUnitTitle}>{item.title}</h3>
                          <p className={styles.aboutUnitDesc}>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case 'youtube': {
            let ytData = {
              video_url: 'https://www.youtube.com/embed?listType=user_uploads&list=tamanmainroyalat-tin7654',
              cta_title: 'Kunjungi & Subscribe Channel Kami',
              cta_desc: 'Ikuti video kajian keislaman, manasik haji cilik, market day, dan trial class siswa kami.'
            };
            try {
              if (sec.extra_data) {
                const parsed = JSON.parse(sec.extra_data);
                ytData = { ...ytData, ...parsed };
              }
            } catch (e) {}

            return (
              <section key={sec.id} id="youtube" className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Dokumentasi Channel YouTube'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Lihat langsung cuplikan keseruan belajar, kegiatan luar ruangan, dan kajian edukasi melalui channel YouTube resmi kami.'}
                  </p>
                  <div className={styles.youtubeContent}>
                    <div className={styles.youtubeCard}>
                      <div className={styles.videoPlaceholder}>
                        <iframe
                          src={ytData.video_url}
                          title="Royal At-Tin YouTube Channel"
                          className={styles.videoIframe}
                          allowFullScreen
                        ></iframe>
                      </div>
                      <div className={styles.youtubeText}>
                        <h4>{ytData.cta_title}</h4>
                        <p>{ytData.cta_desc}</p>
                        <a href={info.youtube_url} target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ display: 'inline-flex', marginTop: '12px' }}>
                          Buka YouTube Channel 🎬
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          case 'tech': {
            return (
              <section key={sec.id} className={styles.section}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Teknologi Pendidikan Modern'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Kami menggunakan sistem teknologi mutakhir guna mendukung kegiatan administrasi, laporan absensi siswa, dan transparansi raport akademik.'}
                  </p>
                  {secItems.length > 0 && (
                    <div className={styles.techGrid}>
                      {secItems.map(item => (
                        <div key={item.id} className={styles.techCard}>
                          <div className={styles.techIcon}>{item.badge}</div>
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case 'tahfidz': {
            return (
              <section key={sec.id} className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Galeri Tahfidz & Quran'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Dokumentasi proses hafalan Al-Qur\'an harian siswa dengan pembiasaan adab-adab keislaman.'}
                  </p>
                  {secItems.length > 0 && (
                    <div className={styles.tahfidzGrid}>
                      {secItems.map(item => (
                        <div key={item.id} className={styles.tahfidzCard}>
                          {item.image_url && <img src={item.image_url} alt={item.title} className={styles.tahfidzImg} />}
                          <div className={styles.tahfidzCardBody}>
                            <h5>{item.title}</h5>
                            <p>{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case 'newsletter': {
            return (
              <section key={sec.id} className={styles.newsletterSection}>
                <div className={styles.container}>
                  <div className={`glass-panel ${styles.newsletterBox}`}>
                    <h3>{sec.title || 'Langganan Informasi & Tips Parenting'}</h3>
                    <p>{sec.subtitle || 'Dapatkan berkala tips mendidik anak secara Islami, info webinar parenting, serta agenda event penting sekolah gratis.'}</p>
                    <form className={styles.newsletterForm} action="/#newsletter" method="GET">
                      <input type="email" placeholder="Masukkan alamat email Anda..." required className={styles.newsletterInput} name="email" />
                      <button type="submit" className="btn-primary" style={{ flexShrink: 0 }}>Daftar Sekarang</button>
                    </form>
                  </div>
                </div>
              </section>
            );
          }

          case 'articles': {
            return (
              <section key={sec.id} id="artikel" className={styles.section}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Artikel Diniyah & Parenting'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Kumpulan tulisan ilmiah ringan seputar pendidikan anak dalam kacamata syariat Islam yang sholih.'}
                  </p>
                  {secItems.length > 0 && (
                    <div className={styles.articlesGrid}>
                      {secItems.map(item => (
                        <div key={item.id} className={`glass-panel ${styles.articleCard}`}>
                          {item.badge && <div className={styles.articleBadge}>{item.badge}</div>}
                          <h4>{item.title}</h4>
                          <p>{item.description}</p>
                          <span className={styles.articleReadMore}>Baca Selengkapnya →</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case 'kajian': {
            let kajianData = {
              kajian_title: 'Kajian Bulanan: "Membimbing Buah Hati di Era Digital Sesuai Syariat"',
              pemateri: 'Ustadz Syarif Hidayatullah, Lc., M.A.',
              tanggal: 'Sabtu, 22 Agustus 2026',
              waktu: '09.00 - 11.30 WIB',
              tempat: 'Aula Sekolah Royal At-Tin & Live Streaming YouTube'
            };
            try {
              if (sec.extra_data) {
                const parsed = JSON.parse(sec.extra_data);
                kajianData = { ...kajianData, ...parsed };
              }
            } catch (e) {}

            return (
              <section key={sec.id} id="kajian" className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Informasi Kajian Bulanan'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Ikuti majelis ilmu rutin bulanan sekolah yang membahas tema diniyah, keluarga sakinah, dan psikologi perkembangan anak.'}
                  </p>
                  <div className={`glass-panel ${styles.kajianCard}`}>
                    <div className={styles.kajianBadge}>SEMINAR PARENTING RUTIN</div>
                    <h3>{kajianData.kajian_title}</h3>
                    <div className={styles.kajianDetails}>
                      <div><strong>🎙️ Pemateri:</strong> {kajianData.pemateri}</div>
                      <div><strong>📅 Tanggal:</strong> {kajianData.tanggal}</div>
                      <div><strong>⏰ Waktu:</strong> {kajianData.waktu}</div>
                      <div><strong>📍 Tempat:</strong> {kajianData.tempat}</div>
                    </div>
                    <a href={`https://wa.me/${info.whatsapp_admin}?text=Halo%20Admin,%20saya%20tertarik%20mengikuti%20Kajian%20Parenting%20Royal%20Attin.`} target="_blank" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: '16px' }}>
                      Daftar Kajian (Gratis)
                    </a>
                  </div>
                </div>
              </section>
            );
          }

          case 'testimonials': {
            return (
              <section key={sec.id} className={styles.section}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Apa Kata Orang Tua Murid?'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Pengalaman nyata wali murid setelah menyekolahkan putra-putri mereka di sekolah Royal At-Tin.'}
                  </p>
                  {secItems.length > 0 && (
                    <div className={styles.testimonialGrid}>
                      {secItems.map(item => (
                        <div key={item.id} className={`glass-panel ${styles.testimonialCard}`}>
                          <p className={styles.testiText}>
                            "{item.description}"
                          </p>
                          <div className={styles.testiAuthor}>
                            <strong>{item.title}</strong>
                            <span>{item.badge}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case 'gallery': {
            return (
              <section key={sec.id} className={styles.section} style={{ backgroundColor: 'var(--bg-secondary)' }}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Galeri Kegiatan Siswa'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Dokumentasi keceriaan belajar, olahraga sunnah, praktek ibadah, dan outing class para siswa.'}
                  </p>
                  {secItems.length > 0 && (
                    <div className={styles.galleryGrid}>
                      {secItems.map(item => (
                        <div key={item.id} className={styles.galleryItem}>
                          {item.image_url && <img src={item.image_url} alt={item.title} />}
                          <div className={styles.galleryOverlay}>{item.title}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          case 'faq': {
            return (
              <section key={sec.id} id="faq" className={styles.section}>
                <div className={styles.container}>
                  <h2 className={styles.sectionTitle}>{sec.title || 'Pertanyaan yang Sering Diajukan (FAQ)'}</h2>
                  <p className={styles.sectionSubtitle}>
                    {sec.subtitle || 'Temukan jawaban cepat seputar proses pendaftaran PPDB, kurikulum diniyah, dan operasional sekolah kami.'}
                  </p>
                  {secItems.length > 0 && (
                    <div className={styles.faqList}>
                      {secItems.map(item => (
                        <details key={item.id} className={styles.faqItem}>
                          <summary className={styles.faqQuestion}>{item.title}</summary>
                          <div className={styles.faqAnswer}>
                            {item.description}
                          </div>
                        </details>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            );
          }

          default:
            return null;
        }
      })}

      {/* 13. Kontak & Pendaftaran (Footer / Saran) - Selalu statis di paling bawah */}
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
