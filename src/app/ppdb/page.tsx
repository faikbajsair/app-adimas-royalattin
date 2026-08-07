'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getQuotaAction,
  submitPpdbRegistrationAction,
  searchPpdbAction,
  selectPaymentMethodAction,
  uploadQuotaPaymentProofAction,
  getSchoolFeesAction
} from '@/actions/ppdbActions';
import { PPDBRegistration } from '@/models/ppdbModel';
import { generateQRISPayload } from '@/lib/qris';
import styles from './ppdb.module.css';

// Data Profil Unit Sekolah Static
const UNIT_PROFILES = [
  {
    id: 'kbtk',
    name: 'KB & TK Taman Main Royal At-Tin',
    shortName: 'KB-TK Taman Main',
    visi: 'Terwujudnya generasi Islam yang berakhlak mulia, cerdas, kreatif, mandiri, dan berpeduli lingkungan sejak dini.',
    misi: 'Menyelenggarakan pendidikan Islam anak usia dini secara holistik, membina kemandirian motorik dan kognitif dengan metode bermain sambil belajar, serta memupuk rasa empati sosial.',
    akreditasi: 'A (Sangat Baik)',
    fasilitas: 'Ruang kelas full AC, area bermain luar (outdoor playground), ruang sensorik dalam, perpustakaan anak, sentra agama, kebun edukasi tanaman.',
    whatsapp: '6281290008811',
    namaNarahubung: 'Bunda Indri (CS Admin)',
    alamat: 'Perumahan Taman Royal, Blok A-1, Tangerang, Banten',
    mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.5212680165996!2d106.66632617448293!3d-6.194741293792949!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f9a456bf8f47%3A0xe54ef92c815942f6!2sTaman%20Royal!5e0!3m2!1sid!2sid!4v1722000000000!5m2!1sid!2sid',
    imgUrl: 'https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'sd',
    name: 'SD Royal At-Tin Islamic School',
    shortName: 'SD Royal At-Tin',
    visi: 'Mencetak ilmuwan Muslim masa depan yang bertauhid kokoh, unggul dalam sains dan teknologi, serta berjiwa kepemimpinan Qur\'ani.',
    misi: 'Mengintegrasikan kurikulum nasional dengan muatan tahfidz (target 3 Juz), membudayakan pemikiran kritis dan riset ilmiah sederhana, serta membekali literasi digital sehat.',
    akreditasi: 'A (Unggul)',
    fasilitas: 'Laboratorium sains terpadu, laboratorium komputer ber-AC, masjid sekolah, lapangan basket & futsal, perpustakaan digital, kantin bersih.',
    whatsapp: '6281290008822',
    namaNarahubung: 'Ustadz Roni (Humas Akademik)',
    alamat: 'Perumahan Taman Royal, Blok B-3, Tangerang, Banten',
    mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3966.5212680165996!2d106.66632617448293!3d-6.194741293792949!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f9a456bf8f47%3A0xe54ef92c815942f6!2sTaman%20Royal!5e0!3m2!1sid!2sid!4v1722000000000!5m2!1sid!2sid',
    imgUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=600&auto=format&fit=crop'
  },
  {
    id: 'nura',
    name: 'NURA',
    shortName: 'NURA Tahfidz Center',
    visi: 'Menjadi pusat percontohan tahfidz Al-Qur\'an anak usia dini yang berkarakter mulia, mandiri, dan berwawasan global.',
    misi: 'Membiasakan interaksi harian bersama Al-Qur\'an melalui metode tahsin yang menyenangkan, menanamkan kemandirian ibadah praktis, serta melatih percakapan bahasa Arab dasar.',
    akreditasi: 'Terakreditasi Baik (B)',
    fasilitas: 'Gedung khusus asri full AC, ruang tahfidz karpet tebal, sensory indoor playground, kebun herbal (Kebun Qur\'an), pojok baca anak.',
    whatsapp: '6281290008833',
    namaNarahubung: 'Ustadzah Fatimah (Admin Pendaftaran)',
    alamat: 'Jalan Vila Nusa Indah Raya, Blok M-1, Gunung Putri, Bogor, Jawa Barat',
    mapsUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.748530364966!2d106.96328227448375!3d-6.2967341936924845!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e698d9ab7df7bbf%3A0xc3f588a44ec2be84!2sVila%20Nusa%20Indah%202!5e0!3m2!1sid!2sid!4v1722000000000!5m2!1sid!2sid',
    imgUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=600&auto=format&fit=crop'
  }
];

export default function PpdbPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'ppdb' | 'form' | 'status'>('profile');
  const [guideOpen, setGuideOpen] = useState(true);

  // State untuk Tab 1: Profil Sekolah
  const [profileSelectedUnit, setProfileSelectedUnit] = useState(UNIT_PROFILES[0]);

  // State untuk Tab 2: PPDB Quota Selection
  const [ppdbUnit, setPpdbUnit] = useState('KB & TK Taman Main Royal At-Tin');
  const [ppdbYear, setPpdbYear] = useState('2026/2027');
  const [sisaKuota, setSisaKuota] = useState<number | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);

  // State untuk Tab 3: Formulir Pendaftaran
  const [selectedRegUnit, setSelectedRegUnit] = useState('');
  const [selectedRegYear, setSelectedRegYear] = useState('');
  const [selectedRegQuota, setSelectedRegQuota] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [generatedNo, setGeneratedNo] = useState('');

  // State untuk Tab 4: Status Tracker
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PPDBRegistration[]>([]);
  const [activeReg, setActiveReg] = useState<PPDBRegistration | null>(null);

  // State untuk Aksi Upload/Update Pembayaran di Tracker
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // State untuk Modal QRIS Checkout
  const [qrisModalOpen, setQrisModalOpen] = useState(false);
  const [qrisAmount, setQrisAmount] = useState(0);
  const [qrisTitle, setQrisTitle] = useState('');
  const [qrisField, setQrisField] = useState('');

  function openQrisCheckout(title: string, amount: number, field: string) {
    setQrisTitle(title);
    setQrisAmount(amount);
    setQrisField(field);
    setQrisModalOpen(true);
  }

  // Mengambil kuota real-time saat pilihan unit/tahun ajaran di Tab 2 berubah
  useEffect(() => {
    async function fetchQuota() {
      setQuotaLoading(true);
      try {
        const res = await getQuotaAction(ppdbUnit, ppdbYear);
        setSisaKuota(res.sisa);
      } catch (e) {
        setSisaKuota(50);
      } finally {
        setQuotaLoading(false);
      }
    }
    fetchQuota();
  }, [ppdbUnit, ppdbYear]);

  // State untuk Biaya Sekolah Autopopulate (Spec No. 8)
  const [schoolFees, setSchoolFees] = useState<any>(null);
  const [feesLoading, setFeesLoading] = useState(false);

  useEffect(() => {
    async function fetchFees() {
      if (!activeReg || !activeReg.metode_pembayaran) {
        setSchoolFees(null);
        return;
      }
      setFeesLoading(true);
      try {
        const fees = await getSchoolFeesAction(
          activeReg.nama_unit,
          activeReg.tahun_ajaran,
          activeReg.metode_pembayaran as any
        );
        setSchoolFees(fees);
      } catch (e) {
        console.error('Error fetching fees:', e);
        setSchoolFees(null);
      } finally {
        setFeesLoading(false);
      }
    }
    fetchFees();
  }, [activeReg?.id, activeReg?.metode_pembayaran]);

  // Handler Lanjut dari Tab 2 ke Tab 3
  function handleNextToForm() {
    if (sisaKuota === null) return;
    if (sisaKuota <= 0) {
      setWarningOpen(true);
      return;
    }

    // Set data yang dilock ke formulir
    setSelectedRegUnit(ppdbUnit);
    setSelectedRegYear(ppdbYear);
    setSelectedRegQuota(sisaKuota);

    // Ganti tab ke formulir
    setActiveTab('form');
  }

  // Submit Formulir PPDB
  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    setConfirmOpen(false);
    setRegLoading(true);
    setRegError(null);
    setRegSuccess(false);

    const formElement = document.getElementById('ppdb-form') as HTMLFormElement;
    if (!formElement) return;

    const formData = new FormData(formElement);
    formData.append('nama_unit', selectedRegUnit);
    formData.append('tahun_ajaran', selectedRegYear);

    try {
      const res = await submitPpdbRegistrationAction(null, formData);
      if (res.error) {
        setRegError(res.error);
      } else if (res.success && res.noPendaftaran) {
        setRegSuccess(true);
        setGeneratedNo(res.noPendaftaran);
        formElement.reset();
        
        // Auto-search untuk status tracker
        setSearchQuery(res.noPendaftaran);
      }
    } catch (err) {
      setRegError('Koneksi terputus. Silakan coba kembali.');
    } finally {
      setRegLoading(false);
    }
  }

  // Cari Status Pendaftaran
  async function handleSearchStatus(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearchLoading(true);
    setSearchError(null);
    setActiveReg(null);

    try {
      const res = await searchPpdbAction(searchQuery);
      if (res.error) {
        setSearchError(res.error);
      } else if (res.success && res.data) {
        setSearchResults(res.data);
        if (res.data.length > 0) {
          setActiveReg(res.data[0]); // Pilih pendaftaran pertama
        } else {
          setSearchError('Nomor Pendaftaran tidak ditemukan.');
        }
      }
    } catch (err) {
      setSearchError('Gagal memuat status dari database.');
    } finally {
      setSearchLoading(false);
    }
  }

  // Pilih Metode Pembayaran (OTM)
  async function handleSelectPaymentMethod(metode: 'Cash' | 'Angsuran') {
    if (!activeReg) return;
    setSubmittingPayment(true);
    try {
      const res = await selectPaymentMethodAction(activeReg.id, metode);
      if (res.error) {
        alert(res.error);
      } else {
        // Refresh pencarian untuk mengambil status ter-update
        const refreshed = await searchPpdbAction(activeReg.no_pendaftaran);
        if (refreshed.success && refreshed.data) {
          setActiveReg(refreshed.data[0]);
        }
      }
    } catch (e) {
      alert('Gagal memilih metode.');
    } finally {
      setSubmittingPayment(false);
    }
  }

  // Upload Angsuran / Full Payment (OTM)
  async function handleUploadPaymentProof(e: React.FormEvent<HTMLFormElement>, field: any) {
    e.preventDefault();
    if (!activeReg) return;
    setSubmittingPayment(true);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await uploadQuotaPaymentProofAction(activeReg.id, field, formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert('Bukti pembayaran berhasil diunggah!');
        (e.target as HTMLFormElement).reset();
        // Refresh status
        const refreshed = await searchPpdbAction(activeReg.no_pendaftaran);
        if (refreshed.success && refreshed.data) {
          setActiveReg(refreshed.data[0]);
        }
      }
    } catch (e) {
      alert('Gagal mengupload bukti pembayaran.');
    } finally {
      setSubmittingPayment(false);
    }
  }

  // Hitung persentase baris tahapan tracker untuk visual stepper (12 tahapan)
  const statusStepsOrder = [
    'Menunggu Verifikasi',
    'Terverifikasi',
    'Menunggu Hasil Psikotest',
    'Menunggu Surat Penerimaan Sekolah',
    'Selesai & Tidak Lanjut',
    'Menunggu Metode Pembayaran',
    'Menunggu Pembayaran Angsuran 1',
    'Menunggu Pembayaran Angsuran 2',
    'Menunggu Pembayaran Angsuran 3',
    'Menunggu Pembayaran Full Payment',
    'Menunggu Username & Password',
    'Selesai'
  ];

  function getStepStatus(stepName: string) {
    if (!activeReg) return 'idle';
    const activeIndex = statusStepsOrder.indexOf(activeReg.status);
    const stepIndex = statusStepsOrder.indexOf(stepName);

    if (activeReg.status === 'Selesai & Tidak Lanjut' && stepName !== 'Selesai & Tidak Lanjut' && stepIndex > 3) {
      return 'disabled';
    }

    if (stepIndex < activeIndex) return 'completed';
    if (stepIndex === activeIndex) return 'active';
    return 'idle';
  }

  return (
    <div className={styles.container}>
      <header style={{ marginBottom: '32px', textAlign: 'center' }}>
        <h1 className={styles.title}>Portal Penerimaan Murid Baru (PPDB)</h1>
        <p className={styles.subtitle}>KB & TK Taman Main At-Tin - SD Royal At-Tin Islamic School - NURA</p>
      </header>

      {/* 🧭 Panduan Cepat Langkah Pendaftaran (Fungsi Direction) */}
      <div className="glass-panel" style={{ padding: '16px 24px', marginBottom: '24px', borderLeft: '4px solid var(--accent-color)', backgroundColor: 'var(--bg-secondary)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setGuideOpen(!guideOpen)}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
            🧭 Panduan Penggunaan Portal PPDB (Klik untuk {guideOpen ? 'Tutup' : 'Buka'})
          </h4>
          <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{guideOpen ? '▲' : '▼'}</span>
        </div>
        
        {guideOpen && (
          <div className="animate-fade-in" style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <p style={{ marginBottom: '12px', color: 'var(--text-primary)' }}><strong>Langkah Awal Pendaftaran:</strong></p>
                <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <li>📖 Buka tab <strong>"Profil Sekolah Unit"</strong> untuk melihat keunggulan, visi-misi, fasilitas, dan kontak narahubung WA sekolah.</li>
                  <li>🎒 Buka tab <strong>"Penerimaan Siswa Baru (PPDB)"</strong>, tentukan sekolah pilihan dan tahun ajaran, lalu periksa sisa kuota yang tertera.</li>
                  <li>✍ Jika kuota tersedia, klik <strong>"Lanjut"</strong> untuk mengisi data lengkap anak, data orang tua, dan mengunggah bukti pendaftaran.</li>
                </ol>
              </div>
              <div>
                <p style={{ marginBottom: '12px', color: 'var(--text-primary)' }}><strong>Pelacakan Status & Pembayaran Uang Pangkal:</strong></p>
                <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }} start={4}>
                  <li>🔑 Setelah mengirim, catat <strong>Nomor Pendaftaran</strong> yang tertera pada layar.</li>
                  <li>🔍 Buka tab <strong>"Status Pendaftaran"</strong>, cari nomor Anda untuk memantau kelulusan berkas, jadwal psikotes, dan hasil kelulusan.</li>
                  <li>💳 Jika dinyatakan <strong>LULUS</strong>, Anda akan diarahkan memilih skema pembayaran (Cash/Angsuran 3x) dan mengunggah berkas transfer.</li>
                </ol>
              </div>
            </div>
            <div style={{ marginTop: '16px', backgroundColor: 'rgba(5, 150, 105, 0.05)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--accent-color)', color: 'var(--accent-color)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
              💡 <span>Kami hadir membimbing Anda. Butuh bantuan? Silakan klik tombol bantuan WhatsApp di pojok kanan bawah layar.</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Top Tabs */}
      <div className={styles.tabsContainer}>
        <Link href="/" className={styles.tabBtn} style={{ textDecoration: 'none' }}>
          🏠 Halaman Utama
        </Link>
        <button
          className={`${styles.tabBtn} ${activeTab === 'profile' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profil Sekolah Unit
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'ppdb' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('ppdb')}
        >
          Penerimaan Murid Baru (PPDB)
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'form' ? styles.tabBtnActive : ''}`}
          onClick={() => {
            if (!selectedRegUnit) {
              alert('Silakan pilih Unit Sekolah dan Tahun Ajaran terlebih dahulu di tab "Penerimaan Murid Baru"!');
              setActiveTab('ppdb');
            } else {
              setActiveTab('form');
            }
          }}
        >
          Formulir Pendaftaran
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'status' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('status')}
        >
          Status Pendaftaran
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PROFIL SEKOLAH UNIT */}
      {activeTab === 'profile' && (
        <div className={`${styles.profileLayout} animate-fade-in`}>
          {/* Sidebar selector */}
          <div className={styles.unitSidebar}>
            {UNIT_PROFILES.map((unit) => (
              <div
                key={unit.id}
                className={`${styles.unitSelectCard} ${profileSelectedUnit.id === unit.id ? styles.unitSelectCardActive : ''}`}
                onClick={() => setProfileSelectedUnit(unit)}
              >
                <div className={styles.unitSelectName}>{unit.shortName}</div>
                <div className={styles.unitSelectDesc}>{unit.name}</div>
              </div>
            ))}
          </div>

          {/* Profil details */}
          <div className={`glass-panel ${styles.profileContent}`}>
            <span className={styles.badgeUnit}>{profileSelectedUnit.akreditasi} Akreditasi</span>
            <h2 className={styles.profileTitle}>{profileSelectedUnit.name}</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
              <img
                src={profileSelectedUnit.imgUrl}
                alt="Foto Unit"
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
              />
              <div className={styles.textSection}>
                <div className={styles.sectionHeading}>📍 Alamat Lengkap</div>
                <p className={styles.textBody}>{profileSelectedUnit.alamat}</p>
                <div className={styles.sectionHeading} style={{ marginTop: '16px' }}>📞 Narahubung WA</div>
                <a
                  href={`https://wa.me/${profileSelectedUnit.whatsapp}`}
                  target="_blank"
                  className={styles.textBody}
                  style={{ color: 'var(--accent-color)', fontWeight: '700', textDecoration: 'none' }}
                >
                  +{profileSelectedUnit.whatsapp} ({profileSelectedUnit.namaNarahubung})
                </a>
              </div>
            </div>

            <div className={styles.textSection}>
              <div className={styles.sectionHeading}>🌟 Visi</div>
              <p className={styles.textBody}>{profileSelectedUnit.visi}</p>
            </div>

            <div className={styles.textSection}>
              <div className={styles.sectionHeading}>🎯 Misi</div>
              <p className={styles.textBody}>{profileSelectedUnit.misi}</p>
            </div>

            <div className={styles.textSection}>
              <div className={styles.sectionHeading}>🏫 Fasilitas Unggulan</div>
              <p className={styles.textBody}>{profileSelectedUnit.fasilitas}</p>
            </div>

            {/* Google Map */}
            <div style={{ marginTop: '24px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', height: '240px', border: '1px solid var(--border-color)' }}>
              <iframe
                src={profileSelectedUnit.mapsUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen={false}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center' }}>
              <button className="btn-primary" onClick={() => { setPpdbUnit(profileSelectedUnit.name); setActiveTab('ppdb'); }}>
                Daftar Sekarang ke Unit Ini →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PENERIMAAN SISWA BARU (PPDB) - SELEKSI KUOTA */}
      {activeTab === 'ppdb' && (
        <div className={`${styles.wizardGrid} animate-fade-in`}>
          {/* Pilihan form */}
          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 700 }}>Pilih Jenjang & Tahun Ajaran</h3>
            
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>1. Unit Lembaga Pendidikan</label>
              {UNIT_PROFILES.map((unit) => (
                <label
                  key={unit.id}
                  className={`form-input`}
                  style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', margin: '8px 0', padding: '12px', border: ppdbUnit === unit.name ? '1px solid var(--accent-color)' : '1px solid var(--border-color)', backgroundColor: ppdbUnit === unit.name ? 'rgba(59,130,246,0.02)' : 'transparent' }}
                >
                  <input
                    type="radio"
                    name="ppdbUnit"
                    value={unit.name}
                    checked={ppdbUnit === unit.name}
                    onChange={() => setPpdbUnit(unit.name)}
                  />
                  <div>
                    <span style={{ fontWeight: 600, display: 'block', fontSize: '0.9rem' }}>{unit.name}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: '32px' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>2. Tahun Ajaran Pendaftaran</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                {['2026/2027', '2027/2028'].map((ta) => (
                  <label
                    key={ta}
                    className="form-input"
                    style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', border: ppdbYear === ta ? '1px solid var(--accent-color)' : '1px solid var(--border-color)' }}
                  >
                    <input
                      type="radio"
                      name="ppdbYear"
                      value={ta}
                      checked={ppdbYear === ta}
                      onChange={() => setPpdbYear(ta)}
                    />
                    TA {ta}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleNextToForm}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={quotaLoading || sisaKuota === null}
            >
              {quotaLoading ? 'Mengecek Kuota...' : 'Lanjut Mengisi Formulir →'}
            </button>
          </div>

          {/* Sisa kuota visual display */}
          <div className="glass-panel" style={{ padding: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className={styles.quotaDisplay}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '24px', fontWeight: 600 }}>Alokasi & Sisa Kuota Terbuka</h3>
              
              <div className={`${styles.quotaCircle} ${sisaKuota !== null && sisaKuota > 0 ? styles.quotaCircleActive : styles.quotaCircleEmpty}`}>
                {quotaLoading ? (
                  <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Loading...</span>
                ) : (
                  <>
                    <span className={styles.quotaNumber} style={{ color: sisaKuota !== null && sisaKuota > 0 ? 'var(--accent-color)' : '#ef4444' }}>
                      {sisaKuota}
                    </span>
                    <span className={styles.quotaNumLabel}>Sisa Tiket</span>
                  </>
                )}
              </div>

              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {sisaKuota !== null && sisaKuota > 0 ? (
                  <span>
                    Kuota pendaftaran saat ini masih **Tersedia**. Silakan klik tombol <strong>"Lanjut Mengisi Formulir"</strong> untuk mengisi formulir pendaftaran siswa baru.
                  </span>
                ) : sisaKuota === 0 ? (
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    ⚠ Pendaftaran ditutup. Kuota pendaftaran untuk pilihan unit dan tahun ajaran tersebut telah habis / penuh.
                  </span>
                ) : (
                  <span>Pilih Unit Lembaga & Tahun Ajaran di sebelah kiri untuk melihat sisa kuota murid baru.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WARNING POPUP (Jika kuota 0 & klik lanjut) */}
      {warningOpen && (
        <div className={styles.overlay}>
          <div className={`glass-panel ${styles.modalCard}`} style={{ borderTop: '4px solid #ef4444' }}>
            <div className={styles.modalIcon}>❌</div>
            <h3 className={styles.modalTitle} style={{ color: '#ef4444' }}>Kuota Sudah Penuh!</h3>
            <p className={styles.modalDesc}>
              Mohon maaf, kuota pendaftaran untuk **{ppdbUnit}** pada tahun ajaran **{ppdbYear}** telah terisi penuh. 
              Anda tidak dapat melanjutkan pengisian formulir pendaftaran. Silakan pilih unit sekolah atau tahun ajaran lainnya.
            </p>
            <div className={styles.modalActions}>
              <button className="btn-primary" style={{ backgroundColor: '#ef4444', backgroundImage: 'none' }} onClick={() => setWarningOpen(false)}>
                Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: FORMULIR PENDAFTARAN */}
      {activeTab === 'form' && (
        <div className="animate-fade-in">
          {/* Locked Selection Info */}
          <div className={styles.formLockedBanner}>
            <div>
              <div className={styles.formLockedLabel}>Unit Lembaga Pilihan</div>
              <div className={styles.formLockedVal}>{selectedRegUnit}</div>
            </div>
            <div>
              <div className={styles.formLockedLabel}>Tahun Ajaran</div>
              <div className={styles.formLockedVal}>TA {selectedRegYear}</div>
            </div>
            <div>
              <div className={styles.formLockedLabel}>Sisa Kuota Terbuka</div>
              <div className={styles.formLockedVal} style={{ color: 'var(--accent-color)' }}>{selectedRegQuota} Kursi</div>
            </div>
            <button className="btn-primary" style={{ background: 'var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setActiveTab('ppdb')}>
              Ubah Pilihan
            </button>
          </div>

          <div className={`glass-panel`} style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            {regSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🎉</span>
                <h3 style={{ color: '#22c55e', fontSize: '1.5rem', marginBottom: '12px', fontWeight: 700 }}>Kirim Pendaftaran Sukses!</h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Pendaftaran atas nama anak Anda berhasil disimpan ke database. Catat Nomor Pendaftaran Anda:
                </p>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '0.05em', margin: '20px 0', fontFamily: 'var(--font-title)' }}>
                  {generatedNo}
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '32px', lineHeight: '1.5' }}>
                  *Notifikasi pemberitahuan telah dikirimkan ke No. WhatsApp Orang Tua/Wali & Admin. 
                  Silakan ikuti instruksi pembayaran pendaftaran di tab **"Status Pendaftaran"**.
                </p>
                <button className="btn-primary" onClick={() => { setActiveTab('status'); }}>
                  Lihat Status Pendaftaran Sekarang →
                </button>
              </div>
            ) : (
              <form id="ppdb-form" onSubmit={handleFormSubmit} encType="multipart/form-data">
                {regError && (
                  <div className={`${styles.alert} ${styles.statusError}`}>
                    ⚠ {regError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div className="form-group">
                    <label htmlFor="nama_anak" className="form-label">Nama Lengkap Anak</label>
                    <input type="text" id="nama_anak" name="nama_anak" className="form-input" required placeholder="Masukkan nama lengkap anak" />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tanggal_lahir" className="form-label">Tanggal Lahir Anak</label>
                    <input type="date" id="tanggal_lahir" name="tanggal_lahir" className="form-input" required />
                  </div>

                  <div className="form-group">
                    <label htmlFor="nama_orang_tua" className="form-label">Nama Orang Tua / Wali</label>
                    <input type="text" id="nama_orang_tua" name="nama_orang_tua" className="form-input" required placeholder="Masukkan nama orang tua / wali" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
                  <div className="form-group">
                    <label htmlFor="whatsapp" className="form-label">No. WhatsApp Orang Tua (Format: 628xxx)</label>
                    <input
                      type="text"
                      id="whatsapp"
                      name="whatsapp"
                      className="form-input"
                      required
                      placeholder="Masukkan nomor WA aktif"
                      defaultValue="628"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      *Diawali kode negara 628, contoh: 628123456789.
                    </small>
                  </div>

                  <div className="form-group">
                    <label htmlFor="alamat_rumah" className="form-label">Alamat Rumah Lengkap</label>
                    <input type="text" id="alamat_rumah" name="alamat_rumah" className="form-input" required placeholder="Jalan, Blok, No, Kecamatan, Kota" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                  <div className="form-group">
                    <label className="form-label">Informasi Biaya PPDB & Formulir</label>
                    <a
                      href="/dummy/brosur_biaya.html"
                      target="_blank"
                      style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none', fontSize: '0.9rem', display: 'block', padding: '12px', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}
                    >
                      📄 Brosur Rincian Biaya (Klik Preview)
                    </a>
                  </div>

                  <div className="form-group">
                    <label htmlFor="bukti_bayar_file" className="form-label">Upload Bukti Transfer Pendaftaran (Gambar / PDF)</label>
                    <input type="file" id="bukti_bayar_file" name="bukti_bayar_file" className="form-input" required accept="image/*,application/pdf" style={{ padding: '8px' }} />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      *Silakan unggah berkas bukti transfer biaya pendaftaran Rp 250.000 langsung dari galeri atau penyimpanan perangkat Anda.
                    </small>
                  </div>
                </div>

                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
                  <button type="submit" className="btn-primary" style={{ width: '200px', justifyContent: 'center' }}>
                    Kirim Pendaftaran
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG (Formulir Pendaftaran) */}
      {confirmOpen && (
        <div className={styles.overlay}>
          <div className={`glass-panel ${styles.modalCard}`} style={{ borderTop: '4px solid var(--accent-color)' }}>
            <div className={styles.modalIcon}>📝</div>
            <h3 className={styles.modalTitle}>Konfirmasi Pendaftaran</h3>
            <p className={styles.modalDesc}>
              Apakah Anda yakin telah mengisi dan melengkapi seluruh data pendaftaran secara benar? Data yang sudah dikirim akan masuk ke proses verifikasi dokumen.
            </p>
            <div className={styles.modalActions}>
              <button className="btn-primary" style={{ background: 'var(--border-color)', color: 'var(--text-primary)' }} onClick={() => setConfirmOpen(false)}>
                Kembali
              </button>
              <button className="btn-primary" onClick={handleConfirmSubmit}>
                Ya, Kirim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: STATUS PENDAFTARAN (TRACKER) */}
      {activeTab === 'status' && (
        <div className="animate-fade-in">
          {/* Form Pencarian */}
          <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', maxWidth: '700px', margin: '0 auto 32px' }}>
            <form onSubmit={handleSearchStatus}>
              <div className="form-group" style={{ margin: 0 }}>
                <label htmlFor="trackerSearch" className="form-label" style={{ fontWeight: '700' }}>Cari Berdasarkan No. Pendaftaran atau WhatsApp</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <input
                    type="text"
                    id="trackerSearch"
                    className="form-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Contoh: REG-TK-2026-0001 atau 628123456789"
                    required
                  />
                  <button type="submit" className="btn-primary" disabled={searchLoading}>
                    {searchLoading ? 'Mencari...' : 'Lacak Status'}
                  </button>
                </div>
              </div>
            </form>
            {searchError && (
              <div className={`${styles.alert} ${styles.statusError}`} style={{ marginTop: '16px', marginBottom: 0 }}>
                ⚠ {searchError}
              </div>
            )}
          </div>

          {/* Konten Tracker Status */}
          {activeReg && (
            <div className={styles.trackerLayout}>
              {/* Stepper visual (Kiri) */}
              <div className="glass-panel" style={{ padding: '32px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px' }}>Tahapan Proses PPDB</h4>
                <div className={styles.statusStepper}>
                  <div className={styles.stepNode}>
                    <span className={`${styles.stepCircle} ${styles[`stepCircle${getStepStatus('Menunggu Verifikasi').charAt(0).toUpperCase() + getStepStatus('Menunggu Verifikasi').slice(1)}`]}`}></span>
                    <div className={`${styles.stepTitle} ${styles[`stepTitle${getStepStatus('Menunggu Verifikasi').charAt(0).toUpperCase() + getStepStatus('Menunggu Verifikasi').slice(1)}`]}`}>1. Kirim Pendaftaran</div>
                  </div>

                  <div className={styles.stepNode}>
                    <span className={`${styles.stepCircle} ${styles[`stepCircle${getStepStatus('Terverifikasi').charAt(0).toUpperCase() + getStepStatus('Terverifikasi').slice(1)}`]}`}></span>
                    <div className={`${styles.stepTitle} ${styles[`stepTitle${getStepStatus('Terverifikasi').charAt(0).toUpperCase() + getStepStatus('Terverifikasi').slice(1)}`]}`}>2. Dokumen Terverifikasi</div>
                  </div>

                  <div className={styles.stepNode}>
                    <span className={`${styles.stepCircle} ${styles[`stepCircle${getStepStatus('Menunggu Hasil Psikotest').charAt(0).toUpperCase() + getStepStatus('Menunggu Hasil Psikotest').slice(1)}`]}`}></span>
                    <div className={`${styles.stepTitle} ${styles[`stepTitle${getStepStatus('Menunggu Hasil Psikotest').charAt(0).toUpperCase() + getStepStatus('Menunggu Hasil Psikotest').slice(1)}`]}`}>3. Menunggu Psikotes</div>
                  </div>

                  <div className={styles.stepNode}>
                    <span className={`${styles.stepCircle} ${styles[`stepCircle${getStepStatus('Menunggu Surat Penerimaan Sekolah').charAt(0).toUpperCase() + getStepStatus('Menunggu Surat Penerimaan Sekolah').slice(1)}`]}`}></span>
                    <div className={`${styles.stepTitle} ${styles[`stepTitle${getStepStatus('Menunggu Surat Penerimaan Sekolah').charAt(0).toUpperCase() + getStepStatus('Menunggu Surat Penerimaan Sekolah').slice(1)}`]}`}>4. Pengumuman Kelulusan</div>
                  </div>

                  <div className={styles.stepNode}>
                    <span className={`${styles.stepCircle} ${styles[`stepCircle${getStepStatus('Menunggu Metode Pembayaran').charAt(0).toUpperCase() + getStepStatus('Menunggu Metode Pembayaran').slice(1)}`]}`}></span>
                    <div className={`${styles.stepTitle} ${styles[`stepTitle${getStepStatus('Menunggu Metode Pembayaran').charAt(0).toUpperCase() + getStepStatus('Menunggu Metode Pembayaran').slice(1)}`]}`}>5. Pilihan Metode Bayar</div>
                  </div>

                  <div className={styles.stepNode}>
                    <span className={`${styles.stepCircle} ${styles[`stepCircle${getStepStatus('Menunggu Pembayaran Angsuran 1').charAt(0).toUpperCase() + getStepStatus('Menunggu Pembayaran Angsuran 1').slice(1)}`] || styles[`stepCircle${getStepStatus('Menunggu Pembayaran Full Payment').charAt(0).toUpperCase() + getStepStatus('Menunggu Pembayaran Full Payment').slice(1)}`]}`}></span>
                    <div className={`${styles.stepTitle} ${styles[`stepTitle${getStepStatus('Menunggu Pembayaran Angsuran 1').charAt(0).toUpperCase() + getStepStatus('Menunggu Pembayaran Angsuran 1').slice(1)}`] || styles[`stepTitle${getStepStatus('Menunggu Pembayaran Full Payment').charAt(0).toUpperCase() + getStepStatus('Menunggu Pembayaran Full Payment').slice(1)}`]}`}>6. Status Pembayaran</div>
                  </div>

                  <div className={styles.stepNode}>
                    <span className={`${styles.stepCircle} ${styles[`stepCircle${getStepStatus('Selesai').charAt(0).toUpperCase() + getStepStatus('Selesai').slice(1)}`]}`}></span>
                    <div className={`${styles.stepTitle} ${styles[`stepTitle${getStepStatus('Selesai').charAt(0).toUpperCase() + getStepStatus('Selesai').slice(1)}`]}`}>7. Selesai (Daftar Ulang Lengkap)</div>
                  </div>
                </div>
              </div>

              {/* Detail Tahapan Aktif (Kanan) */}
              <div className="glass-panel" style={{ padding: '32px' }}>
                <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>Nomor Pendaftaran</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 8px 0' }}>{activeReg.no_pendaftaran}</h3>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                    <span>🏫 Unit: <strong>{activeReg.nama_unit}</strong></span>
                    <span>📅 TA: <strong>{activeReg.tahun_ajaran}</strong></span>
                  </div>
                </div>

                {/* Detail Data Anak */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px', backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Nama Murid</div>
                    <div style={{ fontWeight: 600 }}>{activeReg.nama_anak}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Nama Wali</div>
                    <div style={{ fontWeight: 600 }}>{activeReg.nama_orang_tua}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>WhatsApp</div>
                    <div style={{ fontWeight: 600 }}>+{activeReg.whatsapp}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Alamat Rumah</div>
                    <div style={{ fontWeight: 600 }}>{activeReg.alamat_rumah}</div>
                  </div>
                </div>

                {/* DYNAMIC BIAYA & LEDGER REKAP CICILAN (Spec No. 8 & QRIS request) */}
                {schoolFees ? (
                  <div className="glass-panel animate-fade-in" style={{ padding: '24px', marginBottom: '24px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '0.95rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                      📊 Laporan Keuangan & Buku Besar Cicilan PPDB ({activeReg.metode_pembayaran || 'Belum Pilih Metode'})
                    </h4>
                    
                    {(() => {
                      const totalKewajiban = schoolFees.total;
                      let totalTerbayar = 0;
                      
                      if (activeReg.metode_pembayaran === 'Cash') {
                        const isPaid = ['Menunggu Username & Password', 'Selesai'].includes(activeReg.status);
                        totalTerbayar = isPaid ? totalKewajiban : 0;
                      } else if (activeReg.metode_pembayaran === 'Angsuran') {
                        const statusIdx = statusStepsOrder.indexOf(activeReg.status);
                        const limit1 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 1');
                        const limit2 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 2');
                        const limit3 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 3');
                        
                        if (statusIdx > limit1 && statusIdx !== -1) {
                          totalTerbayar += totalKewajiban * 0.5;
                        }
                        if (statusIdx > limit2 && statusIdx !== -1) {
                          totalTerbayar += totalKewajiban * 0.25;
                        }
                        if (['Menunggu Username & Password', 'Selesai'].includes(activeReg.status)) {
                          totalTerbayar += totalKewajiban * 0.25;
                        }
                      }
                      
                      const sisaTunggakan = totalKewajiban - totalTerbayar;
                      const formatCurrency = (val: number) => {
                        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
                      };

                      return (
                        <>
                          {/* Keuangan Cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                            <div className="glass-panel" style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderLeft: '4px solid var(--accent-color)' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Kewajiban Uang Pangkal</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px', color: 'var(--text-primary)' }}>
                                {formatCurrency(totalKewajiban)}
                              </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderLeft: '4px solid #22c55e' }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Terbayar</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px', color: '#22c55e' }}>
                                {formatCurrency(totalTerbayar)}
                              </div>
                            </div>
                            <div className="glass-panel" style={{ padding: '16px', backgroundColor: 'var(--bg-primary)', borderLeft: `4px solid ${sisaTunggakan > 0 ? '#ef4444' : '#22c55e'}` }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Sisa Tunggakan</div>
                              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '4px', color: sisaTunggakan > 0 ? '#ef4444' : '#22c55e' }}>
                                {formatCurrency(sisaTunggakan)}
                              </div>
                            </div>
                          </div>

                          {/* Tabel Detail Buku Besar */}
                          <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', padding: '12px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                  <th style={{ padding: '8px' }}>Komponen / Termin</th>
                                  <th style={{ padding: '8px' }}>Nominal</th>
                                  <th style={{ padding: '8px' }}>Status</th>
                                  <th style={{ padding: '8px', textAlign: 'right' }}>Aksi</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                  <td style={{ padding: '8px' }}>Uang Formulir Pendaftaran</td>
                                  <td style={{ padding: '8px' }}>{formatCurrency(250000)}</td>
                                  <td style={{ padding: '8px' }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>LUNAS</span>
                                  </td>
                                  <td style={{ padding: '8px', textAlign: 'right', color: 'var(--text-secondary)' }}>-</td>
                                </tr>
                                
                                {activeReg.metode_pembayaran === 'Cash' && (
                                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '8px' }}>Full Payment Uang Masuk</td>
                                    <td style={{ padding: '8px' }}>{formatCurrency(totalKewajiban)}</td>
                                    <td style={{ padding: '8px' }}>
                                      {activeReg.status === 'Selesai' || activeReg.status === 'Menunggu Username & Password' ? (
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>LUNAS</span>
                                      ) : activeReg.status === 'Menunggu Pembayaran Full Payment' ? (
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>BELUM BAYAR</span>
                                      ) : (
                                        <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(234,179,8,0.1)', color: '#eab308' }}>PENDING</span>
                                      )}
                                    </td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                      {activeReg.status === 'Menunggu Pembayaran Full Payment' ? (
                                        <button
                                          type="button"
                                          className="btn-primary"
                                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                          onClick={() => openQrisCheckout('Pelunasan Full Payment', totalKewajiban, 'bukti_full_payment')}
                                        >
                                          Bayar via QRIS
                                        </button>
                                      ) : activeReg.bukti_full_payment ? (
                                        <a href={activeReg.bukti_full_payment} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}>🔗 Lihat Bukti</a>
                                      ) : '-'}
                                    </td>
                                  </tr>
                                )}

                                {activeReg.metode_pembayaran === 'Angsuran' && (() => {
                                  const statusIdx = statusStepsOrder.indexOf(activeReg.status);
                                  const limit1 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 1');
                                  const limit2 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 2');
                                  const limit3 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 3');

                                  const is1Paid = statusIdx > limit1 && statusIdx !== -1;
                                  const is2Paid = statusIdx > limit2 && statusIdx !== -1;
                                  const is3Paid = ['Menunggu Username & Password', 'Selesai'].includes(activeReg.status);

                                  return (
                                    <>
                                      {/* Angsuran 1 */}
                                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '8px' }}>Angsuran 1 (50% Uang Muka)</td>
                                        <td style={{ padding: '8px' }}>{formatCurrency(totalKewajiban * 0.5)}</td>
                                        <td style={{ padding: '8px' }}>
                                          {is1Paid ? (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>LUNAS</span>
                                          ) : activeReg.status === 'Menunggu Pembayaran Angsuran 1' ? (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>BELUM BAYAR</span>
                                          ) : (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(234,179,8,0.1)', color: '#eab308' }}>PENDING</span>
                                          )}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                          {activeReg.status === 'Menunggu Pembayaran Angsuran 1' ? (
                                            <button
                                              type="button"
                                              className="btn-primary"
                                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                              onClick={() => openQrisCheckout('Angsuran 1 (DP 50%)', totalKewajiban * 0.5, 'bukti_angsuran_1')}
                                            >
                                              Bayar via QRIS
                                            </button>
                                          ) : activeReg.bukti_angsuran_1 ? (
                                            <a href={activeReg.bukti_angsuran_1} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}>🔗 Lihat Bukti</a>
                                          ) : '-'}
                                        </td>
                                      </tr>
                                      
                                      {/* Angsuran 2 */}
                                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '8px' }}>Angsuran 2 (25% Termin 2)</td>
                                        <td style={{ padding: '8px' }}>{formatCurrency(totalKewajiban * 0.25)}</td>
                                        <td style={{ padding: '8px' }}>
                                          {is2Paid ? (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>LUNAS</span>
                                          ) : activeReg.status === 'Menunggu Pembayaran Angsuran 2' ? (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>BELUM BAYAR</span>
                                          ) : (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(234,179,8,0.1)', color: '#eab308' }}>PENDING</span>
                                          )}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                          {activeReg.status === 'Menunggu Pembayaran Angsuran 2' ? (
                                            <button
                                              type="button"
                                              className="btn-primary"
                                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                              onClick={() => openQrisCheckout('Angsuran 2 (Termin 25%)', totalKewajiban * 0.25, 'bukti_angsuran_2')}
                                            >
                                              Bayar via QRIS
                                            </button>
                                          ) : activeReg.bukti_angsuran_2 ? (
                                            <a href={activeReg.bukti_angsuran_2} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}>🔗 Lihat Bukti</a>
                                          ) : '-'}
                                        </td>
                                      </tr>

                                      {/* Angsuran 3 */}
                                      <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                        <td style={{ padding: '8px' }}>Angsuran 3 (25% Pelunasan)</td>
                                        <td style={{ padding: '8px' }}>{formatCurrency(totalKewajiban * 0.25)}</td>
                                        <td style={{ padding: '8px' }}>
                                          {is3Paid ? (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>LUNAS</span>
                                          ) : activeReg.status === 'Menunggu Pembayaran Angsuran 3' ? (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>BELUM BAYAR</span>
                                          ) : (
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(234,179,8,0.1)', color: '#eab308' }}>PENDING</span>
                                          )}
                                        </td>
                                        <td style={{ padding: '8px', textAlign: 'right' }}>
                                          {activeReg.status === 'Menunggu Pembayaran Angsuran 3' ? (
                                            <button
                                              type="button"
                                              className="btn-primary"
                                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                              onClick={() => openQrisCheckout('Angsuran 3 (Pelunasan 25%)', totalKewajiban * 0.25, 'bukti_angsuran_3')}
                                            >
                                              Bayar via QRIS
                                            </button>
                                          ) : activeReg.bukti_angsuran_3 ? (
                                            <a href={activeReg.bukti_angsuran_3} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600 }}>🔗 Lihat Bukti</a>
                                          ) : '-'}
                                        </td>
                                      </tr>
                                    </>
                                  );
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                ) : feesLoading ? (
                  <div style={{ padding: '24px', marginBottom: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }} className="glass-panel">
                    🔄 Mengambil rincian biaya sekolah dari database...
                  </div>
                ) : null}

                {/* PANEL STATUS 1: MENUNGGU VERIFIKASI */}
                {activeReg.status === 'Menunggu Verifikasi' && (
                  <div style={{ border: '1px dashed var(--accent-color)', padding: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59,130,246,0.02)' }}>
                    <h4 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-color)', marginBottom: '12px' }}>
                      ⏳ Menunggu Verifikasi Dokumen
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                      Dokumen pendaftaran dan bukti transfer Anda sedang diperiksa oleh panitia PPDB. Status akan diperbarui secara berkala setelah tim administrasi melakukan verifikasi.
                    </p>
                  </div>
                )}

                {/* PANEL STATUS 2: TERVERIFIKASI / MENUNGGU JADWAL PSIKOTES */}
                {activeReg.status === 'Terverifikasi' && (
                  <div style={{ border: '1px dashed #22c55e', padding: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34,197,94,0.02)' }}>
                    <h4 style={{ fontWeight: 700, color: '#22c55e', marginBottom: '12px' }}>
                      ✓ Pembayaran Pendaftaran Terverifikasi
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      Pembayaran formulir pendaftaran Anda telah disetujui. Silakan tunggu beberapa saat lagi selagi panitia PPDB menjadwalkan pelaksanaan psikotes/observasi akademik untuk calon siswa baru.
                    </p>
                  </div>
                )}

                {/* PANEL STATUS 3: JADWAL PSIKOTES DITERBITKAN */}
                {activeReg.status === 'Menunggu Hasil Psikotest' && (
                  <div style={{ border: '1px solid var(--border-color)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>
                      📅 Jadwal Ujian / Observasi Psikotes
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', fontSize: '0.9rem', marginBottom: '16px' }}>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Tanggal Pelaksanaan</div>
                        <div style={{ fontWeight: 700 }}>{activeReg.tanggal_psikotest ? new Date(activeReg.tanggal_psikotest).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'Segera Ditentukan'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Waktu Pelaksanaan</div>
                        <div style={{ fontWeight: 700 }}>{activeReg.waktu_psikotest || '08:00 WIB'}</div>
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Lokasi / Ruang</div>
                        <div style={{ fontWeight: 700 }}>{activeReg.lokasi_psikotest || 'Ruang Observasi Utama'}</div>
                      </div>
                    </div>
                    {activeReg.catatan_psikotest && (
                      <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', marginBottom: '16px' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Catatan Penting Dari Panitia:</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-primary)', fontStyle: 'italic' }}>
                          "{activeReg.catatan_psikotest}"
                        </p>
                      </div>
                    )}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      *Orang tua diharapkan mendampingi calon siswa di lokasi ujian sesuai jadwal di atas dengan membawa bukti pendaftaran cetak/digital.
                    </p>
                  </div>
                )}

                {/* PANEL STATUS 4: PENGUMUMAN KELULUSAN (Menunggu Surat Penerimaan) */}
                {activeReg.status === 'Menunggu Surat Penerimaan Sekolah' && (
                  <div style={{ border: '1px solid #22c55e', padding: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34,197,94,0.02)' }}>
                    <h4 style={{ fontWeight: 700, color: '#22c55e', marginBottom: '12px' }}>
                      🎉 Calon Siswa Dinyatakan LULUS Psikotes!
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '16px' }}>
                      Selamat! Calon siswa dinyatakan lulus tahapan psikotes. Silakan unduh Surat Penerimaan Sekolah resmi di bawah ini:
                    </p>
                    {activeReg.surat_penerimaan_url ? (
                      <a
                        href={activeReg.surat_penerimaan_url}
                        target="_blank"
                        className="btn-primary"
                        style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none' }}
                      >
                        📄 Download Surat Penerimaan
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>*Surat keputusan kelulusan sedang diterbitkan oleh Kepala Sekolah.</span>
                    )}
                  </div>
                )}

                {/* PANEL STATUS 5: MEMILIH METODE PEMBAYARAN UANG SEKOLAH */}
                {activeReg.status === 'Menunggu Metode Pembayaran' && (
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '8px' }}>💳 Pilih Metode Pembayaran Uang Sekolah</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      Silakan pilih skema pelunasan biaya uang sekolah masuk (Uang Pangkal & SPP) yang Anda kehendaki:
                    </p>
                    
                    <div className={styles.paymentChoiceGrid}>
                      <button
                        className={styles.paymentChoiceCard}
                        onClick={() => handleSelectPaymentMethod('Cash')}
                        disabled={submittingPayment}
                      >
                        <div className={styles.paymentChoiceTitle}>Full Payment (Cash)</div>
                        <div className={styles.paymentChoiceDesc}>Pelunasan langsung sekali bayar (Diskon formulir khusus).</div>
                      </button>
                      <button
                        className={styles.paymentChoiceCard}
                        onClick={() => handleSelectPaymentMethod('Angsuran')}
                        disabled={submittingPayment}
                      >
                        <div className={styles.paymentChoiceTitle}>Cicilan (Angsuran)</div>
                        <div className={styles.paymentChoiceDesc}>Dicicil sebanyak 3 kali pembayaran sesuai tenggat waktu.</div>
                      </button>
                    </div>
                  </div>
                )}

                {/* PANEL STATUS 6: PROSES PEMBAYARAN FULL PAYMENT */}
                {activeReg.status === 'Menunggu Pembayaran Full Payment' && (
                  <div style={{ border: '1px solid var(--border-color)', padding: '24px', borderRadius: 'var(--radius-sm)' }}>
                    <h4 style={{ fontWeight: 700, marginBottom: '12px' }}>💳 Konfirmasi Pembayaran Full Payment</h4>
                    <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '16px', borderRadius: 'var(--radius-sm)', marginBottom: '20px' }}>
                      <p style={{ fontSize: '0.9rem', margin: '0 0 12px 0' }}>Batas pelunasan pembayaran:</p>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ef4444' }}>📅 {new Date(activeReg.tenggat_full_payment).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                    </div>
                    <form onSubmit={(e) => handleUploadPaymentProof(e, 'bukti_full_payment')} encType="multipart/form-data">
                      <div className="form-group" style={{ marginBottom: '16px' }}>
                        <label htmlFor="fullPaymentProof" className="form-label">Upload Berkas Bukti Transfer Pelunasan</label>
                        <input type="file" id="fullPaymentProof" name="bukti_file" className="form-input" required accept="image/*,application/pdf" style={{ padding: '8px' }} disabled={submittingPayment} />
                      </div>
                      <button type="submit" className="btn-primary" disabled={submittingPayment}>
                        {submittingPayment ? 'Mengirim...' : 'Kirim Bukti Pelunasan'}
                      </button>
                    </form>
                  </div>
                )}

                {/* PANEL STATUS 7: PROSES PEMBAYARAN ANGSURAN (ANGSURAN 1 / 2 / 3) */}
                {['Menunggu Pembayaran Angsuran 1', 'Menunggu Pembayaran Angsuran 2', 'Menunggu Pembayaran Angsuran 3'].includes(activeReg.status) && (
                  <div>
                    <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>💳 Proses Upload Cicilan / Angsuran</h4>
                    <div className={styles.paymentInstallments}>
                      {/* Angsuran 1 */}
                      <div className={styles.installmentCard}>
                        <div className={styles.installmentHeader}>
                          <div className={styles.installmentTitle}>Angsuran 1 (Uang Muka)</div>
                          {activeReg.bukti_angsuran_1 ? (
                            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>✓ Telah Dibayar</span>
                          ) : (
                            <span className={styles.installmentDue}>Tenggat: {activeReg.tenggat_angsuran_1 ? new Date(activeReg.tenggat_angsuran_1).toLocaleDateString('id-ID') : '-'}</span>
                          )}
                        </div>
                        {activeReg.bukti_angsuran_1 ? (
                          <a href={activeReg.bukti_angsuran_1} target="_blank" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none' }}>🔗 Lihat Berkas Bayar</a>
                        ) : activeReg.status === 'Menunggu Pembayaran Angsuran 1' ? (
                          <form onSubmit={(e) => handleUploadPaymentProof(e, 'bukti_angsuran_1')} encType="multipart/form-data">
                            <input type="file" name="bukti_file" className="form-input" required accept="image/*,application/pdf" style={{ marginBottom: '8px', fontSize: '0.85rem', padding: '6px' }} disabled={submittingPayment} />
                            <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={submittingPayment}>Upload</button>
                          </form>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Menunggu giliran</span>
                        )}
                      </div>

                      {/* Angsuran 2 */}
                      <div className={styles.installmentCard}>
                        <div className={styles.installmentHeader}>
                          <div className={styles.installmentTitle}>Angsuran 2</div>
                          {activeReg.bukti_angsuran_2 ? (
                            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>✓ Telah Dibayar</span>
                          ) : (
                            <span className={styles.installmentDue}>Tenggat: {activeReg.tenggat_angsuran_2 ? new Date(activeReg.tenggat_angsuran_2).toLocaleDateString('id-ID') : '-'}</span>
                          )}
                        </div>
                        {activeReg.bukti_angsuran_2 ? (
                          <a href={activeReg.bukti_angsuran_2} target="_blank" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none' }}>🔗 Lihat Berkas Bayar</a>
                        ) : activeReg.status === 'Menunggu Pembayaran Angsuran 2' ? (
                          <form onSubmit={(e) => handleUploadPaymentProof(e, 'bukti_angsuran_2')} encType="multipart/form-data">
                            <input type="file" name="bukti_file" className="form-input" required accept="image/*,application/pdf" style={{ marginBottom: '8px', fontSize: '0.85rem', padding: '6px' }} disabled={submittingPayment} />
                            <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={submittingPayment}>Upload</button>
                          </form>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Menunggu giliran</span>
                        )}
                      </div>

                      {/* Angsuran 3 */}
                      <div className={styles.installmentCard}>
                        <div className={styles.installmentHeader}>
                          <div className={styles.installmentTitle}>Angsuran 3 (Pelunasan)</div>
                          {activeReg.bukti_angsuran_3 ? (
                            <span style={{ color: '#22c55e', fontWeight: 700, fontSize: '0.85rem' }}>✓ Telah Dibayar</span>
                          ) : (
                            <span className={styles.installmentDue}>Tenggat: {activeReg.tenggat_angsuran_3 ? new Date(activeReg.tenggat_angsuran_3).toLocaleDateString('id-ID') : '-'}</span>
                          )}
                        </div>
                        {activeReg.bukti_angsuran_3 ? (
                          <a href={activeReg.bukti_angsuran_3} target="_blank" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none' }}>🔗 Lihat Berkas Bayar</a>
                        ) : activeReg.status === 'Menunggu Pembayaran Angsuran 3' ? (
                          <form onSubmit={(e) => handleUploadPaymentProof(e, 'bukti_angsuran_3')} encType="multipart/form-data">
                            <input type="file" name="bukti_file" className="form-input" required accept="image/*,application/pdf" style={{ marginBottom: '8px', fontSize: '0.85rem', padding: '6px' }} disabled={submittingPayment} />
                            <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={submittingPayment}>Upload & Konfirmasi Selesai</button>
                          </form>
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Menunggu giliran</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* PANEL STATUS 8: MENUNGGU USERNAME & PASSWORD PORTAL SISWA */}
                {activeReg.status === 'Menunggu Username & Password' && (
                  <div style={{ border: '1px dashed var(--accent-color)', padding: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59,130,246,0.02)' }}>
                    <h4 style={{ fontWeight: 700, color: 'var(--accent-color)', marginBottom: '12px' }}>
                      ⏳ Menunggu Penyerahan Akses Akun Portal
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      Seluruh proses keuangan daftar ulang Anda telah **Lunas & Terverifikasi**. Akun login portal siswa baru Anda sedang digenerate oleh Tim IT Royal Attin. Detail username dan password login akan muncul di kolom status ini sesaat lagi.
                    </p>
                  </div>
                )}

                {/* PANEL STATUS 9: SELESAI & AKUN LOGIN DITERBITKAN */}
                {activeReg.status === 'Selesai' && (
                  <div style={{ border: '1px solid #22c55e', padding: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34,197,94,0.02)' }}>
                    <h4 style={{ fontWeight: 700, color: '#22c55e', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      🎉 Selamat! Seluruh Tahapan PPDB Selesai
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '20px' }}>
                      Pendaftaran ulang anak Anda telah **Selesai Lengkap**. Di bawah ini adalah kredensial portal masuk resmi siswa baru Anda untuk digunakan dalam mengakses menu tugas dan raport akademik:
                    </p>
                    <div style={{ backgroundColor: 'var(--bg-primary)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.9rem', marginBottom: '16px' }}>
                      <div style={{ marginBottom: '8px' }}>🔑 Username: <strong>{activeReg.siswa_username || 'siswa_baru_royalattin'}</strong></div>
                      <div>🔒 Password: <strong>{activeReg.siswa_password || 'pass_siswa_123'}</strong></div>
                    </div>
                    <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none' }}>
                      Masuk ke Portal Akademik →
                    </Link>
                  </div>
                )}

                {/* PANEL STATUS 10: SELESAI & TIDAK LANJUT (Ditolak/Psikotest Gagal) */}
                {activeReg.status === 'Selesai & Tidak Lanjut' && (
                  <div style={{ border: '1px solid #ef4444', padding: '24px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(239,68,68,0.02)' }}>
                    <h4 style={{ fontWeight: 700, color: '#ef4444', marginBottom: '12px' }}>
                      🛑 Pendaftaran Selesai & Tidak Lanjut
                    </h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                      Calon siswa dinyatakan belum dapat diterima di KB-TK / SD Royal Attin berdasarkan hasil evaluasi observasi tim psikolog kami, atau karena pengajuan transfer pendaftaran ditolak admin. Terima kasih atas partisipasi pendaftaran Anda.
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL QRIS CHECKOUT */}
      {qrisModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          padding: '16px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            maxWidth: '380px',
            width: '100%',
            padding: '24px',
            backgroundColor: 'var(--bg-primary)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}>
            {/* QRIS Header */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-color)', letterSpacing: '1px' }}>QRIS</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 700 }}>GPN Standard</span>
            </div>
            
            <h4 style={{ fontWeight: 700, margin: '0 0 4px 0', fontSize: '0.95rem', color: 'var(--text-primary)' }}>{qrisTitle}</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', margin: '0 0 16px 0', lineHeight: 1.4 }}>
              Scan QR di bawah ini dengan aplikasi perbankan (BSI, Mandiri, BCA, dll.) atau e-wallet (GoPay, OVO, Dana) Anda.
            </p>
            
            {/* QR Code image */}
            <div style={{
              display: 'inline-block',
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
              marginBottom: '16px'
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(generateQRISPayload('YAYASAN ROYAL AT-TIN', 'TANGERANG', qrisAmount))}`}
                alt="QRIS Code"
                style={{ width: '220px', height: '220px', display: 'block' }}
              />
            </div>
            
            <div style={{ marginBottom: '16px', backgroundColor: 'var(--bg-secondary)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.8rem', textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Nominal Bayar:</span>
                <span style={{ fontWeight: 800, color: 'var(--accent-color)' }}>
                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(qrisAmount)}
                </span>
              </div>
              <div style={{ marginBottom: '4px' }}>🏦 <strong>Bank Syariah Indonesia (BSI)</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>No. Rek: <strong style={{ color: 'var(--text-primary)' }}>7071810850</strong></div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('7071810850');
                    alert('Nomor rekening BSI berhasil disalin!');
                  }}
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px solid var(--accent-color)',
                    color: 'var(--accent-color)',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Salin
                </button>
              </div>
              <div style={{ marginTop: '4px' }}>A.n: <strong>Faik</strong></div>
            </div>

            {/* Upload Form */}
            <form onSubmit={async (e) => {
              await handleUploadPaymentProof(e, qrisField);
              setQrisModalOpen(false);
            }} encType="multipart/form-data">
              <div className="form-group" style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label className="form-label" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Upload Bukti Pembayaran (Gambar / PDF)</label>
                <input
                  type="file"
                  name="bukti_file"
                  className="form-input"
                  required
                  accept="image/*,application/pdf"
                  style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: '0.8rem' }} disabled={submittingPayment}>
                  {submittingPayment ? 'Mengirim...' : 'Kirim Bukti'}
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    backgroundColor: 'var(--border-color)',
                    color: 'var(--text-primary)',
                    backgroundImage: 'none',
                    padding: '8px 12px',
                    fontSize: '0.8rem'
                  }}
                  onClick={() => setQrisModalOpen(false)}
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 📞 Tombol Bantuan WhatsApp Melayang (Fungsi Direction) */}
      <a
        href="https://wa.me/6281290008811?text=Halo%20Admin%20Royal%20Attin,%20saya%20butuh%20bantuan%20terkait%20portal%20PPDB."
        target="_blank"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#25d366',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          fontWeight: '700',
          fontSize: '0.85rem',
          zIndex: 9999,
          transition: 'all 0.2s ease-in-out'
        }}
      >
        <span>💬 Butuh Bantuan? Hubungi Admin</span>
      </a>
    </div>
  );
}
