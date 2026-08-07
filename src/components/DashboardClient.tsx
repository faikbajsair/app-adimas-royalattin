'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/actions/authActions';
import { updateSchoolInfoAction } from '@/actions/infoActions';
import { verifyPpdbPaymentAction, updatePpdbStatusByAdminAction } from '@/actions/ppdbActions';
import { createEventAction } from '@/actions/eventActions';
import {
  recordStudentAttendanceAction,
  reportChildPermitAction,
  recordPenjemputAction,
  createNewTaskAction,
  submitTaskAssignmentAction,
  gradeStudentAssignmentAction
} from '@/actions/academicActions';
import { SchoolInfo } from '@/models/infoModel';
import styles from '@/app/dashboard/page.module.css';

function getObligationFee(unit: string, metode: string): number {
  const isSd = (unit || '').toLowerCase().includes('sd');
  const isNura = (unit || '').toLowerCase().includes('nura');
  const isInstallment = metode === 'Angsuran';
  
  if (isSd) {
    return isInstallment ? 9800000 : 9000000;
  } else if (isNura) {
    return isInstallment ? 4900000 : 4500000;
  } else {
    return isInstallment ? 6200000 : 5700000;
  }
}

function calculatePayments(reg: any) {
  if (!reg || !reg.metode_pembayaran) {
    return { obligation: 0, paid: 0, arrears: 0 };
  }
  
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
  
  const totalKewajiban = getObligationFee(reg.nama_unit || '', reg.metode_pembayaran);
  let totalTerbayar = 0;
  
  if (reg.metode_pembayaran === 'Cash') {
    const isPaid = ['Menunggu Username & Password', 'Selesai'].includes(reg.status);
    totalTerbayar = isPaid ? totalKewajiban : 0;
  } else if (reg.metode_pembayaran === 'Angsuran') {
    const statusIdx = statusStepsOrder.indexOf(reg.status);
    const limit1 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 1');
    const limit2 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 2');
    const limit3 = statusStepsOrder.indexOf('Menunggu Pembayaran Angsuran 3');
    
    if (statusIdx > limit1 && statusIdx !== -1) {
      totalTerbayar += totalKewajiban * 0.5;
    }
    if (statusIdx > limit2 && statusIdx !== -1) {
      totalTerbayar += totalKewajiban * 0.25;
    }
    if (['Menunggu Username & Password', 'Selesai'].includes(reg.status)) {
      totalTerbayar += totalKewajiban * 0.25;
    }
  }
  
  const sisaTunggakan = totalKewajiban - totalTerbayar;
  return { obligation: totalKewajiban, paid: totalTerbayar, arrears: sisaTunggakan };
}

interface DashboardClientProps {
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
  info: SchoolInfo;
  ppdbRegistrants?: any[];
  events?: any[];
  eventRegistrants?: any[];
  quotas?: any[];
  // Props Akademik
  parentChildren?: any[];
  parentClassTasks?: any[];
  parentChildAttendance?: Record<string, any[]>;
  parentChildSubmissions?: Record<string, any[]>;
  classChildren?: any[];
  classTasks?: any[];
  taskSubmissions?: Record<string, any[]>;
  todayAttendance?: any[];
}

export default function DashboardClient({
  user,
  info,
  ppdbRegistrants = [],
  events = [],
  eventRegistrants = [],
  quotas = [],
  parentChildren = [],
  parentClassTasks = [],
  parentChildAttendance = {},
  parentChildSubmissions = {},
  classChildren = [],
  classTasks = [],
  taskSubmissions = {},
  todayAttendance = [],
}: DashboardClientProps) {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState<'main' | 'school_info' | 'ppdb' | 'events' | 'academic'>('main');
  const [academicTab, setAcademicTab] = useState<'attendance' | 'tasks'>('attendance');

  // State Filter Unit PPDB & Tahun Ajaran
  const getInitialFilter = () => {
    if (user.role === 'admin_kbtk') return 'kbtk';
    if (user.role === 'admin_sd') return 'sd';
    if (user.role === 'admin_nura') return 'nura';
    return 'all';
  };
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<'all' | 'kbtk' | 'sd' | 'nura'>(getInitialFilter());
  const [selectedReportYear, setSelectedReportYear] = useState<string>('2026/2027');

  // Loading & State
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // State untuk Verifikasi PPDB
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [adminActionLoadingId, setAdminActionLoadingId] = useState<string | null>(null);
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);

  // State untuk Create Event
  const [eventLoading, setEventLoading] = useState(false);
  const [eventSuccess, setEventSuccess] = useState(false);
  const [eventError, setEventError] = useState<string | null>(null);

  // State Akademik - Orang Tua
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [penjemputLoading, setPenjemputLoading] = useState(false);
  const [penjemputSuccess, setPenjemputSuccess] = useState(false);
  const [penjemputError, setPenjemputError] = useState<string | null>(null);

  const [permitLoading, setPermitLoading] = useState(false);
  const [permitSuccess, setPermitSuccess] = useState(false);
  const [permitError, setPermitError] = useState<string | null>(null);

  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const [taskSubError, setTaskSubError] = useState<string | null>(null);

  // State Akademik - Guru
  const [attendanceLoadingId, setAttendanceLoadingId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [taskFormLoading, setTaskFormLoading] = useState(false);
  const [taskFormSuccess, setTaskFormSuccess] = useState(false);
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [gradingSubId, setGradingSubId] = useState<string | null>(null);

  // Set default selected child ID untuk OTM
  useEffect(() => {
    if (parentChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(parentChildren[0].id);
    }
  }, [parentChildren, selectedChildId]);

  // Set default selected task ID untuk Guru
  useEffect(() => {
    if (classTasks.length > 0 && !selectedTaskId) {
      setSelectedTaskId(classTasks[0].id);
    }
  }, [classTasks, selectedTaskId]);

  // Logout handler
  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await logoutAction();
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    } finally {
      setLogoutLoading(false);
    }
  }

  // Update School Info handler
  async function handleUpdateInfo(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);
    setSaveError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateSchoolInfoAction(null, formData);
      if (res.error) {
        setSaveError(res.error);
      } else if (res.success) {
        setSaveSuccess(true);
        router.refresh();
      }
    } catch (err) {
      setSaveError('Gagal menyimpan perubahan.');
    } finally {
      setSaveLoading(false);
    }
  }

  // Verifikasi Pembayaran PPDB
  async function handleVerifyPayment(id: string, isApprove: boolean) {
    setVerifyingId(id);
    try {
      const res = await verifyPpdbPaymentAction(id, isApprove);
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    } catch (e) {
      alert('Gagal memperbarui verifikasi.');
    } finally {
      setVerifyingId(null);
    }
  }

  // Create Event Handler
  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setEventLoading(true);
    setEventSuccess(false);
    setEventError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createEventAction(null, formData);
      if (res.error) {
        setEventError(res.error);
      } else if (res.success) {
        setEventSuccess(true);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } catch (err) {
      setEventError('Gagal membuat event.');
    } finally {
      setEventLoading(false);
    }
  }

  // Admin - Update Tahapan Status PPDB (Psikotes, Ujian, Akun Murid)
  async function handleAdminUpdatePpdb(e: React.FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    setAdminActionLoadingId(id);
    const formData = new FormData(e.currentTarget);
    
    const updates: any = {};
    if (formData.get('tanggal_psikotest')) {
      updates.tanggal_psikotest = formData.get('tanggal_psikotest') as string;
      updates.lokasi_psikotest = formData.get('lokasi_psikotest') as string;
      updates.waktu_psikotest = (formData.get('waktu_psikotest') as string) || '';
      updates.catatan_psikotest = (formData.get('catatan_psikotest') as string) || '';
      updates.status = 'Menunggu Hasil Psikotest';
    }
    if (formData.get('hasil_psikotest')) {
      updates.hasil_psikotest = formData.get('hasil_psikotest') as string;
      updates.surat_penerimaan_url = formData.get('surat_penerimaan_url') as string;
    }
    if (formData.get('siswa_username')) {
      updates.siswa_username = formData.get('siswa_username') as string;
      updates.siswa_password = formData.get('siswa_password') as string;
    }

    try {
      const res = await updatePpdbStatusByAdminAction(id, updates);
      if (res.error) {
        alert(res.error);
      } else {
        alert('Tahapan pendaftaran PPDB berhasil diperbarui!');
        router.refresh();
      }
    } catch (err) {
      alert('Gagal memperbarui data.');
    } finally {
      setAdminActionLoadingId(null);
    }
  }

  // OTM - Daftar Penjemput
  async function handleRegisterPenjemput(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPenjemputLoading(true);
    setPenjemputSuccess(false);
    setPenjemputError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('anak_id', selectedChildId);

    try {
      const res = await recordPenjemputAction(null, formData);
      if (res.error) {
        setPenjemputError(res.error);
      } else {
        setPenjemputSuccess(true);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } catch (err) {
      setPenjemputError('Koneksi terputus.');
    } finally {
      setPenjemputLoading(false);
    }
  }

  // OTM - Laporkan Izin/Sakit
  async function handleReportAbsence(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPermitLoading(true);
    setPermitSuccess(false);
    setPermitError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('anak_id', selectedChildId);

    try {
      const res = await reportChildPermitAction(null, formData);
      if (res.error) {
        setPermitError(res.error);
      } else {
        setPermitSuccess(true);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } catch (err) {
      setPermitError('Koneksi terputus.');
    } finally {
      setPermitLoading(false);
    }
  }

  // OTM - Kumpulkan Tugas
  async function handleCollectAssignment(e: React.FormEvent<HTMLFormElement>, taskId: string, childName: string) {
    e.preventDefault();
    setSubmittingTaskId(taskId);
    setTaskSubError(null);

    const formData = new FormData(e.currentTarget);
    formData.append('tugas_id', taskId);
    formData.append('anak_id', selectedChildId);
    formData.append('nama_anak', childName);

    try {
      const res = await submitTaskAssignmentAction(null, formData);
      if (res.error) {
        setTaskSubError(res.error);
      } else {
        alert('Tugas berhasil dikumpulkan!');
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } catch (err) {
      setTaskSubError('Gagal mengumpulkan tugas.');
    } finally {
      setSubmittingTaskId(null);
    }
  }

  // Guru - Input Absensi Murid
  async function handleGuruAttendance(e: React.FormEvent<HTMLFormElement>, childId: string, childName: string) {
    e.preventDefault();
    setAttendanceLoadingId(childId);

    const formData = new FormData(e.currentTarget);
    formData.append('anak_id', childId);
    formData.append('nama_anak', childName);
    formData.append('tanggal', new Date().toISOString().split('T')[0]);

    try {
      const res = await recordStudentAttendanceAction(null, formData);
      if (res.error) {
        alert(res.error);
      } else {
        alert(`Absensi untuk ${childName} berhasil disimpan.`);
        router.refresh();
      }
    } catch (err) {
      alert('Koneksi database bermasalah.');
    } finally {
      setAttendanceLoadingId(null);
    }
  }

  // Guru - Buat Tugas Baru
  async function handleCreateTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setTaskFormLoading(true);
    setTaskFormSuccess(false);
    setTaskFormError(null);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await createNewTaskAction(null, formData);
      if (res.error) {
        setTaskFormError(res.error);
      } else {
        setTaskFormSuccess(true);
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    } catch (err) {
      setTaskFormError('Gagal membuat tugas.');
    } finally {
      setTaskFormLoading(false);
    }
  }

  // Guru - Input Nilai Tugas
  async function handleGradeSubmission(e: React.FormEvent<HTMLFormElement>, submissionId: string) {
    e.preventDefault();
    setGradingSubId(submissionId);

    const formData = new FormData(e.currentTarget);
    const score = Number(formData.get('nilai'));
    const comment = formData.get('catatan_guru') as string || '';

    try {
      const res = await gradeStudentAssignmentAction(submissionId, score, comment);
      if (res.error) {
        alert(res.error);
      } else {
        alert('Nilai & masukan guru berhasil disimpan.');
        router.refresh();
      }
    } catch (err) {
      alert('Gagal memberikan nilai.');
    } finally {
      setGradingSubId(null);
    }
  }

  function getRoleLabel(role: string) {
    const roles: Record<string, string> = {
      admin: 'Administrator Utama',
      admin_kbtk: 'Admin KB-TK',
      admin_sd: 'Admin SD',
      admin_nura: 'Admin NURA',
      yayasan: 'Pengurus Yayasan',
      kepsek: 'Kepala Sekolah',
      guru: 'Guru / Pendidik',
      orang_tua: 'Orang Tua Murid',
      pelamar: 'Pelamar Karir',
    };
    return roles[role] || role;
  }

  // Cari absensi murid hari ini (untuk view Guru)
  function getTodayStatus(childId: string) {
    const record = todayAttendance.find(att => att.anak_id === childId);
    return record || { status: '', keterangan: '', nama_penjemput: '', relasi_penjemput: '' };
  }

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src={info.logo_url} alt="Logo" className={styles.logo} />
          <span className={styles.brandName}>{info.name}</span>
        </div>

        <ul className={styles.menuList}>
          <li>
            <button
              onClick={() => setCurrentSection('main')}
              className={`${styles.menuItem} ${currentSection === 'main' ? styles.menuItemActive : ''}`}
              style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              📁 Dashboard Utama
            </button>
          </li>
          
          {['admin', 'yayasan'].includes(user.role) && (
            <li>
              <button
                onClick={() => setCurrentSection('school_info')}
                className={`${styles.menuItem} ${currentSection === 'school_info' ? styles.menuItemActive : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                🏫 Pengaturan Portal
              </button>
            </li>
          )}

          {['admin', 'admin_kbtk', 'admin_sd', 'admin_nura', 'yayasan'].includes(user.role) && (
            <li>
              <button
                onClick={() => setCurrentSection('ppdb')}
                className={`${styles.menuItem} ${currentSection === 'ppdb' ? styles.menuItemActive : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                👥 Pendaftaran PPDB
              </button>
            </li>
          )}

          {['admin', 'yayasan'].includes(user.role) && (
            <li>
              <button
                onClick={() => setCurrentSection('events')}
                className={`${styles.menuItem} ${currentSection === 'events' ? styles.menuItemActive : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                🎪 Manajemen Event
              </button>
            </li>
          )}

          {['guru', 'orang_tua', 'admin'].includes(user.role) && (
            <li>
              <button
                onClick={() => setCurrentSection('academic')}
                className={`${styles.menuItem} ${currentSection === 'academic' ? styles.menuItemActive : ''}`}
                style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                🎓 Portal Akademik
              </button>
            </li>
          )}
        </ul>

        <div className={styles.userInfo}>
          <div className={styles.userName}>{user.name}</div>
          <div className={styles.userRole}>{getRoleLabel(user.role)}</div>
          <button
            onClick={handleLogout}
            className={styles.logoutBtn}
            disabled={logoutLoading}
          >
            {logoutLoading ? 'Keluar...' : 'Keluar Portal'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        {/* SECTION 1: MAIN DASHBOARD */}
        {currentSection === 'main' && (
          <div className="animate-fade-in">
            <div className={styles.header}>
              <div>
                <h1 className={styles.welcomeTitle}>Halo, {user.name}!</h1>
                <p className={styles.welcomeSubtitle}>Selamat datang di dashboard portal akademik KB-TK Adimas.</p>
              </div>
            </div>

            {/* Metrics */}
            <section className={styles.grid}>
              <div className={`glass-panel ${styles.statCard}`}>
                <div className={styles.statLabel}>Status Database</div>
                <div className={styles.statVal} style={{ color: '#22c55e' }}>Terhubung</div>
                <div className={styles.statLabel}>Google Apps Script API</div>
              </div>
              <div className={`glass-panel ${styles.statCard}`}>
                <div className={styles.statLabel}>Akses Sesi Aktif</div>
                <div className={styles.statVal} style={{ color: 'var(--accent-color)', fontSize: '1.5rem', fontWeight: 800 }}>
                  {getRoleLabel(user.role).toUpperCase()}
                </div>
                <div className={styles.statLabel}>Role Keanggotaan Portal</div>
              </div>
              <div className={`glass-panel ${styles.statCard}`}>
                <div className={styles.statLabel}>Jam Operasional</div>
                <div className={styles.statVal}>07.30 - 11.30</div>
                <div className={styles.statLabel}>WIB (Senin - Jumat)</div>
              </div>
            </section>

            {/* Overview Info */}
            <section className={`glass-panel ${styles.panel}`}>
              <h2 className={styles.panelTitle}>Informasi Portal Akademik</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Selamat! Portal manajemen sekolah KB-TK Adimas Anda kini sudah terkonfigurasi menggunakan Apps Script Database Proxy. Anda dapat menggunakan menu sidebar untuk melakukan monitoring absensi harian dan pembagian tugas sekolah secara real-time.
              </p>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['admin', 'admin_kbtk', 'admin_sd', 'admin_nura', 'yayasan'].includes(user.role) ? (
                  <>
                    <button className="btn-primary" onClick={() => setCurrentSection('ppdb')}>Kelola PPDB</button>
                    {['admin', 'yayasan'].includes(user.role) && (
                      <button className="btn-primary" onClick={() => setCurrentSection('events')} style={{ background: 'var(--text-primary)' }}>Kelola Event</button>
                    )}
                  </>
                ) : (
                  <button className="btn-primary" onClick={() => setCurrentSection('academic')}>Masuk Portal Akademik</button>
                )}
              </div>
            </section>
          </div>
        )}

        {/* SECTION 2: SCHOOL INFO CONFIG */}
        {currentSection === 'school_info' && (
          <section className={`glass-panel ${styles.panel} animate-fade-in`}>
            <h2 className={styles.panelTitle}>Konfigurasi Informasi Sekolah</h2>

            <form onSubmit={handleUpdateInfo}>
              {saveSuccess && (
                <div className={`${styles.alert} ${styles.statusSuccess}`}>
                  ✓ Informasi sekolah berhasil disimpan ke Google Sheets! Halaman landing page otomatis terupdate.
                </div>
              )}
              {saveError && (
                <div className={`${styles.alert} ${styles.statusError}`}>
                  ⚠ {saveError}
                </div>
              )}

              <div className={styles.adminForm}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">Nama Sekolah / Lembaga</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-input"
                    defaultValue={info.name}
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tagline" className="form-label">Slogan (Tagline)</label>
                  <input
                    type="text"
                    id="tagline"
                    name="tagline"
                    className="form-input"
                    defaultValue={info.tagline}
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="sub_name" className="form-label">Sub Tagline</label>
                  <input
                    type="text"
                    id="sub_name"
                    name="sub_name"
                    className="form-input"
                    defaultValue={info.sub_name}
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="whatsapp_admin" className="form-label">WhatsApp Admin (Format: 628xxx)</label>
                  <input
                    type="text"
                    id="whatsapp_admin"
                    name="whatsapp_admin"
                    className="form-input"
                    defaultValue={info.whatsapp_admin}
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className={`form-group ${styles.fullWidth}`}>
                  <label htmlFor="address" className="form-label">Alamat Lengkap</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    className="form-input"
                    defaultValue={info.address}
                    required
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="instagram_url" className="form-label">Instagram Link URL</label>
                  <input
                    type="url"
                    id="instagram_url"
                    name="instagram_url"
                    className="form-input"
                    defaultValue={info.instagram_url}
                    disabled={saveLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="youtube_url" className="form-label">YouTube Channel URL</label>
                  <input
                    type="url"
                    id="youtube_url"
                    name="youtube_url"
                    className="form-input"
                    defaultValue={info.youtube_url}
                    disabled={saveLoading}
                  />
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Menyimpan...' : 'Simpan Perubahan ke Sheets'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* SECTION 3: PPDB REGISTRATIONS */}
        {currentSection === 'ppdb' && (() => {
          // Helper pencocokan unit
          function matchesUnit(namaUnit: string, targetId: 'kbtk' | 'sd' | 'nura') {
            const name = (namaUnit || '').toLowerCase();
            if (targetId === 'kbtk') return name.includes('kb') || name.includes('tk') || name.includes('taman main');
            if (targetId === 'sd') return name.includes('sd') || name.includes('at-tin islamic') || name.includes('royal at-tin');
            if (targetId === 'nura') return name === 'nura' || name.includes('nura');
            return false;
          }

          // Hitung data untuk Laporan Quota PPDB secara dinamis
          const getUnitRegistrantCount = (unitName: string, ta: string) => {
            return ppdbRegistrants.filter((reg: any) => {
              const regUnit = (reg.nama_unit || '').trim().toLowerCase();
              const targetUnit = unitName.trim().toLowerCase();
              const matchesU = regUnit === targetUnit || regUnit.includes(targetUnit) || targetUnit.includes(regUnit);
              const matchesTa = (reg.tahun_ajaran || '').trim() === ta.trim();
              return matchesU && matchesTa;
            }).length;
          };

          const getUnitQuotaTotal = (unitName: string, ta: string) => {
            const match = quotas.find(
              (q: any) =>
                (q.nama_unit || '').trim().toLowerCase() === unitName.trim().toLowerCase() &&
                (q.tahun_ajaran || '').trim() === ta.trim()
            );
            return match ? Number(match.kuota_total || 50) : 50;
          };

          const count1 = getUnitRegistrantCount('KB & TK Taman Main Royal At-Tin', selectedReportYear);
          const quota1 = getUnitQuotaTotal('KB & TK Taman Main Royal At-Tin', selectedReportYear);

          const count2 = getUnitRegistrantCount('SD Royal At-Tin Islamic School', selectedReportYear);
          const quota2 = getUnitQuotaTotal('SD Royal At-Tin Islamic School', selectedReportYear);

          const count3 = getUnitRegistrantCount('NURA', selectedReportYear);
          const quota3 = getUnitQuotaTotal('NURA', selectedReportYear);

          const maxVal = Math.max(50, count1, quota1, count2, quota2, count3, quota3);
          const maxY = Math.ceil((maxVal + 10) / 10) * 10;

          const chartHeight = 200;
          const chartWidth = 500;
          const paddingLeft = 40;
          const paddingRight = 20;
          const paddingTop = 20;
          const paddingBottom = 30;
          const graphHeight = chartHeight - paddingTop - paddingBottom;
          const graphWidth = chartWidth - paddingLeft - paddingRight;
          const gridLines = [0, 0.25, 0.5, 0.75, 1];

          const chartData = [
            { label: 'KB-TK', registered: count1, quota: quota1 },
            { label: 'SD', registered: count2, quota: quota2 },
            { label: 'NURA', registered: count3, quota: quota3 }
          ];

          const unitsSummary = [
            { id: 'kbtk', title: 'KB-TK Taman Main', registered: count1, quota: quota1, color: '#6366f1' },
            { id: 'sd', title: 'SD Royal At-Tin', registered: count2, quota: quota2, color: '#3b82f6' },
            { id: 'nura', title: 'NURA Tahfidz', registered: count3, quota: quota3, color: '#10b981' }
          ];

          // Filter registran berdasarkan otorisasi role unit dan tab filter terpilih
          const filteredRegistrants = ppdbRegistrants.filter((reg: any) => {
            if (user.role === 'admin_kbtk') return matchesUnit(reg.nama_unit, 'kbtk');
            if (user.role === 'admin_sd') return matchesUnit(reg.nama_unit, 'sd');
            if (user.role === 'admin_nura') return matchesUnit(reg.nama_unit, 'nura');
            
            if (selectedUnitFilter === 'kbtk') return matchesUnit(reg.nama_unit, 'kbtk');
            if (selectedUnitFilter === 'sd') return matchesUnit(reg.nama_unit, 'sd');
            if (selectedUnitFilter === 'nura') return matchesUnit(reg.nama_unit, 'nura');
            return true;
          });

          const showUnitTabs = ['admin', 'yayasan'].includes(user.role);

          return (
            <section className={`glass-panel ${styles.panel} animate-fade-in`}>
              {/* Header section dengan selektor tahun */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <h2 className={styles.panelTitle} style={{ marginBottom: 0 }}>Portal Manajemen PPDB Online</h2>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Tahun Ajaran:</span>
                  <select
                    value={selectedReportYear}
                    onChange={(e) => setSelectedReportYear(e.target.value)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="2026/2027">2026/2027</option>
                    <option value="2027/2028">2027/2028</option>
                  </select>
                </div>
              </div>

              {/* Laporan Grafik Quota PPDB */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '24px',
                marginBottom: '32px',
                backgroundColor: 'var(--bg-secondary)',
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)'
              }}>
                {/* Kolom Kiri: Chart */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Visualisasi Pendaftar VS Kuota</h3>
                  
                  <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
                    {gridLines.map((ratio, index) => {
                      const y = chartHeight - paddingBottom - (ratio * graphHeight);
                      const val = Math.round(ratio * maxY);
                      return (
                        <g key={index}>
                          <line
                            x1={paddingLeft}
                            y1={y}
                            x2={chartWidth - paddingRight}
                            y2={y}
                            stroke="var(--border-color)"
                            strokeDasharray="4 4"
                            strokeWidth={1}
                          />
                          <text
                            x={paddingLeft - 10}
                            y={y + 4}
                            textAnchor="end"
                            fontSize="10"
                            fill="var(--text-secondary)"
                            fontWeight="bold"
                          >
                            {val}
                          </text>
                        </g>
                      );
                    })}
                    
                    {chartData.map((data, i) => {
                      const colWidth = graphWidth / chartData.length;
                      const xCenter = paddingLeft + (i * colWidth) + (colWidth / 2);
                      const barW = 24;
                      const gap = 6;
                      const xReg = xCenter - barW - (gap / 2);
                      const xQuota = xCenter + (gap / 2);
                      
                      const regH = (data.registered / maxY) * graphHeight;
                      const quotaH = (data.quota / maxY) * graphHeight;
                      
                      const yReg = chartHeight - paddingBottom - regH;
                      const yQuota = chartHeight - paddingBottom - quotaH;
                      
                      return (
                        <g key={i}>
                          {/* Bar 1: Registered */}
                          <rect
                            x={xReg}
                            y={yReg}
                            width={barW}
                            height={regH}
                            fill="#6366f1"
                            rx="4"
                            style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                          >
                            <title>{`Terdaftar: ${data.registered} Siswa`}</title>
                          </rect>
                          <text
                            x={xReg + barW/2}
                            y={yReg - 6}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="var(--text-primary)"
                          >
                            {data.registered}
                          </text>

                          {/* Bar 2: Quota */}
                          <rect
                            x={xQuota}
                            y={yQuota}
                            width={barW}
                            height={quotaH}
                            fill="#38bdf8"
                            rx="4"
                            style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                          >
                            <title>{`Kuota: ${data.quota} Siswa`}</title>
                          </rect>
                          <text
                            x={xQuota + barW/2}
                            y={yQuota - 6}
                            textAnchor="middle"
                            fontSize="10"
                            fontWeight="bold"
                            fill="var(--text-primary)"
                          >
                            {data.quota}
                          </text>

                          {/* X axis Label */}
                          <text
                            x={xCenter}
                            y={chartHeight - 10}
                            textAnchor="middle"
                            fontSize="11"
                            fontWeight="600"
                            fill="var(--text-secondary)"
                          >
                            {data.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                  
                  {/* Legend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '0.8rem', fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#6366f1', borderRadius: '3px' }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>Terdaftar ({count1 + count2 + count3})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: '12px', height: '12px', backgroundColor: '#38bdf8', borderRadius: '3px' }}></div>
                      <span style={{ color: 'var(--text-secondary)' }}>Kuota ({quota1 + quota2 + quota3})</span>
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Detail Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', justifyContent: 'center' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-primary)' }}>Detail Kuota per Unit</h3>
                  
                  {unitsSummary.map((unit) => {
                    const sisa = Math.max(0, unit.quota - unit.registered);
                    const pct = Math.min(100, Math.round((unit.registered / unit.quota) * 100));
                    return (
                      <div key={unit.id} style={{
                        backgroundColor: 'var(--bg-primary)',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-primary)' }}>{unit.title}</span>
                          <span style={{ color: unit.color }}>{unit.registered} / {unit.quota} Siswa</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden', marginTop: '8px', marginBottom: '4px' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: unit.color, borderRadius: '4px' }}></div>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                          <span>{pct}% Terisi</span>
                          <span>{sisa} Kursi Tersisa</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tabs / Filter Unit untuk List */}
              {showUnitTabs && (
                <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                  {[
                    { id: 'all', label: 'Semua Unit' },
                    { id: 'kbtk', label: 'KB-TK Taman Main' },
                    { id: 'sd', label: 'SD Royal At-Tin' },
                    { id: 'nura', label: 'NURA Tahfidz' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSelectedUnitFilter(tab.id as any)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid var(--border-color)',
                        backgroundColor: selectedUnitFilter === tab.id ? 'var(--accent-color)' : 'var(--bg-secondary)',
                        color: selectedUnitFilter === tab.id ? '#ffffff' : 'var(--text-secondary)',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
              
              {!showUnitTabs && (
                <div style={{
                  marginBottom: '16px',
                  padding: '8px 12px',
                  backgroundColor: 'rgba(99, 102, 241, 0.08)',
                  borderLeft: '4px solid var(--accent-color)',
                  borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--accent-color)'
                }}>
                  Menampilkan pendaftaran khusus unit: {user.role === 'admin_kbtk' ? 'KB & TK Taman Main' : user.role === 'admin_sd' ? 'SD Royal At-Tin' : 'NURA Tahfidz Center'}
                </div>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>No Pendaftaran</th>
                      <th style={{ padding: '12px' }}>Nama Anak</th>
                      <th style={{ padding: '12px' }}>Orang Tua / WA</th>
                      <th style={{ padding: '12px' }}>Bukti Bayar</th>
                      <th style={{ padding: '12px' }}>Buku Besar (Keuangan)</th>
                      <th style={{ padding: '12px' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistrants.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          Belum ada siswa yang mendaftar PPDB.
                        </td>
                      </tr>
                    ) : (
                      filteredRegistrants.map((reg: any) => {
                      const { obligation, paid, arrears } = calculatePayments(reg);
                      const formatCurrency = (val: number) => {
                        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
                      };
                      
                      const getDynamicCredentials = () => {
                        const firstName = (reg.nama_anak || '').trim().split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                        const username = `${firstName || 'siswa'}_adimas`;

                        let password = 'siswa123';
                        if (reg.tanggal_lahir) {
                          const parts = reg.tanggal_lahir.split('-');
                          if (parts.length === 3) {
                            if (parts[0].length === 4) {
                              const y = parts[0];
                              const m = parts[1].padStart(2, '0');
                              const d = parts[2].padStart(2, '0');
                              password = `${d}${m}${y}`;
                            } else if (parts[2].length === 4) {
                              const d = parts[0].padStart(2, '0');
                              const m = parts[1].padStart(2, '0');
                              const y = parts[2];
                              password = `${d}${m}${y}`;
                            }
                          }
                        }
                        return { username, password };
                      };
                      const dynamicCreds = getDynamicCredentials();

                      return (
                        <React.Fragment key={reg.id}>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: expandedRegId === reg.id ? 'var(--bg-secondary)' : 'transparent' }}>
                            <td style={{ padding: '16px 12px', fontWeight: 600 }}>
                              <button
                                type="button"
                                onClick={() => setExpandedRegId(expandedRegId === reg.id ? null : reg.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  padding: '0 8px 0 0',
                                  fontSize: '0.75rem',
                                  color: 'var(--accent-color)',
                                  fontWeight: 'bold',
                                  display: 'inline-flex',
                                  alignItems: 'center'
                                }}
                              >
                                {expandedRegId === reg.id ? '▼' : '▶'}
                              </button>
                              {reg.no_pendaftaran}
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                              <strong>{reg.nama_anak}</strong> <br/>
                              <small style={{ color: 'var(--text-secondary)' }}>Unit: {reg.nama_unit} | TA: {reg.tahun_ajaran}</small>
                            </td>
                            <td style={{ padding: '16px 12px' }}>{reg.nama_orang_tua} <br/> <small style={{ color: 'var(--accent-color)' }}>+{reg.whatsapp}</small></td>
                            <td style={{ padding: '16px 12px' }}>
                              {reg.bukti_bayar_url ? (
                                <a href={reg.bukti_bayar_url} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 500 }}>
                                  🔗 Lihat Bukti
                                </a>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Belum upload</span>
                              )}
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                              {reg.metode_pembayaran ? (
                                <div>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--border-color)', color: 'var(--text-primary)' }}>
                                    {reg.metode_pembayaran}
                                  </span>
                                  <div style={{ marginTop: '4px', fontSize: '0.75rem', lineHeight: 1.4 }}>
                                    <span style={{ color: '#22c55e', fontWeight: 600 }}>Bayar: {formatCurrency(paid)}</span> <br/>
                                    <span style={{ color: arrears > 0 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>Sisa: {formatCurrency(arrears)}</span>
                                  </div>
                                </div>
                              ) : (
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Belum pilih metode</span>
                              )}
                            </td>
                            <td style={{ padding: '16px 12px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '4px 8px', borderRadius: '12px', textTransform: 'uppercase', 
                                backgroundColor: reg.status === 'Selesai' ? 'rgba(34,197,94,0.1)' : reg.status === 'Selesai & Tidak Lanjut' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                                color: reg.status === 'Selesai' ? '#22c55e' : reg.status === 'Selesai & Tidak Lanjut' ? '#ef4444' : '#eab308' }}>
                                {reg.status}
                              </span>
                            </td>
                            <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                              {/* Aksi 1: Verifikasi awal dokumen */}
                              {reg.status === 'Menunggu Verifikasi' && (
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                  <button
                                    className="btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#22c55e', backgroundImage: 'none' }}
                                    disabled={verifyingId === reg.id}
                                    onClick={() => handleVerifyPayment(reg.id, true)}
                                  >
                                    Setujui
                                  </button>
                                  <button
                                    className="btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', backgroundColor: '#ef4444', backgroundImage: 'none' }}
                                    disabled={verifyingId === reg.id}
                                    onClick={() => handleVerifyPayment(reg.id, false)}
                                  >
                                    Tolak
                                  </button>
                                </div>
                              )}
    
                              {/* Aksi 2: Jadwalkan Psikotes */}
                              {reg.status === 'Terverifikasi' && (
                                <form onSubmit={(e) => handleAdminUpdatePpdb(e, reg.id)} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap', maxWidth: '480px', marginLeft: 'auto' }}>
                                  <input type="date" name="tanggal_psikotest" className="form-input" style={{ width: '130px', padding: '6px 8px', fontSize: '0.8rem' }} defaultValue="2026-08-15" required disabled={adminActionLoadingId === reg.id} />
                                  <input type="text" name="waktu_psikotest" className="form-input" style={{ width: '100px', padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Waktu (e.g. 08:00)" defaultValue="08:00 WIB" required disabled={adminActionLoadingId === reg.id} />
                                  <input type="text" name="lokasi_psikotest" className="form-input" style={{ width: '100px', padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Ruang..." defaultValue="Ruang Observasi Utama" required disabled={adminActionLoadingId === reg.id} />
                                  <input type="text" name="catatan_psikotest" className="form-input" style={{ width: '140px', padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Catatan (opsional)" disabled={adminActionLoadingId === reg.id} />
                                  <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={adminActionLoadingId === reg.id}>Jadwalkan</button>
                                </form>
                              )}
    
                              {/* Aksi 3: Input Hasil Psikotes */}
                              {reg.status === 'Menunggu Hasil Psikotest' && (
                                <form onSubmit={(e) => handleAdminUpdatePpdb(e, reg.id)} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <select name="hasil_psikotest" className="form-input" style={{ width: '100px', padding: '6px 8px', fontSize: '0.8rem' }} required disabled={adminActionLoadingId === reg.id}>
                                    <option value="">- Hasil -</option>
                                    <option value="LULUS">LULUS</option>
                                    <option value="TIDAK LULUS">TIDAK LULUS</option>
                                  </select>
                                  <input type="url" name="surat_penerimaan_url" className="form-input" style={{ width: '140px', padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Link Surat Penerimaan" defaultValue="/dummy/surat_penerimaan.html" required disabled={adminActionLoadingId === reg.id} />
                                  <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={adminActionLoadingId === reg.id}>Simpan</button>
                                </form>
                              )}
    
                              {/* Aksi 4: Buat Akun Portal Siswa Baru */}
                              {reg.status === 'Menunggu Username & Password' && (
                                <form onSubmit={(e) => handleAdminUpdatePpdb(e, reg.id)} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <input type="text" name="siswa_username" className="form-input" style={{ width: '110px', padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Username Baru" defaultValue={dynamicCreds.username} required disabled={adminActionLoadingId === reg.id} />
                                  <input type="text" name="siswa_password" className="form-input" style={{ width: '110px', padding: '6px 8px', fontSize: '0.8rem' }} placeholder="Password Baru" defaultValue={dynamicCreds.password} required disabled={adminActionLoadingId === reg.id} />
                                  <button type="submit" className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} disabled={adminActionLoadingId === reg.id}>Buat Akun</button>
                                </form>
                              )}
    
                              {/* Aksi Pasif: Selesai */}
                              {!['Menunggu Verifikasi', 'Terverifikasi', 'Menunggu Hasil Psikotest', 'Menunggu Username & Password'].includes(reg.status) && (
                                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Proses Selesai / Pasif</span>
                              )}
                            </td>
                          </tr>
                          
                          {/* Expanded Sub-Row for Ledger & Details */}
                          {expandedRegId === reg.id && (
                            <tr>
                              <td colSpan={7} style={{ padding: '16px 24px', backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                                <div className="glass-panel animate-fade-in" style={{ padding: '20px', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                                  <h5 style={{ fontWeight: 700, margin: '0 0 16px 0', fontSize: '0.85rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    📋 Buku Besar Pembayaran & Detail Siswa ({reg.metode_pembayaran || 'Belum Pilih Metode'})
                                  </h5>

                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', fontSize: '0.8rem' }}>
                                    <div>
                                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Alamat Rumah:</div>
                                      <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--text-primary)' }}>{reg.alamat_rumah || '-'}</div>
                                    </div>
                                    <div>
                                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Tanggal Lahir Anak:</div>
                                      <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--text-primary)' }}>{reg.tanggal_lahir || '-'}</div>
                                    </div>
                                    <div>
                                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Jadwal Psikotes:</div>
                                      <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                        {reg.tanggal_psikotest ? (
                                          <>
                                            <div>Tanggal: {reg.tanggal_psikotest}</div>
                                            <div>Waktu: {reg.waktu_psikotest || '-'}</div>
                                            <div>Ruang: {reg.lokasi_psikotest}</div>
                                            {reg.catatan_psikotest && (
                                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', fontStyle: 'italic', marginTop: '2px' }}>
                                                Catatan: {reg.catatan_psikotest}
                                              </div>
                                            )}
                                          </>
                                        ) : (
                                          'Belum Terjadwal'
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Akun Akses Portal:</div>
                                      <div style={{ fontWeight: 600, marginTop: '2px', color: 'var(--text-primary)' }}>
                                        {reg.siswa_username ? `User: ${reg.siswa_username} | Pass: ${reg.siswa_password}` : 'Belum Dibuat'}
                                      </div>
                                    </div>
                                  </div>

                                  {reg.metode_pembayaran && (
                                    <>
                                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px', textAlign: 'left' }}>
                                        <div style={{ borderLeft: '3px solid var(--accent-color)', paddingLeft: '8px' }}>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Kewajiban Uang Pangkal</div>
                                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>{formatCurrency(obligation)}</div>
                                        </div>
                                        <div style={{ borderLeft: '3px solid #22c55e', paddingLeft: '8px' }}>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Total Terbayar</div>
                                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#22c55e' }}>{formatCurrency(paid)}</div>
                                        </div>
                                        <div style={{ borderLeft: `3px solid ${arrears > 0 ? '#ef4444' : '#22c55e'}`, paddingLeft: '8px' }}>
                                          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Sisa Tunggakan</div>
                                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: arrears > 0 ? '#ef4444' : '#22c55e' }}>{formatCurrency(arrears)}</div>
                                        </div>
                                      </div>

                                      {/* Termin List */}
                                      <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', textAlign: 'left' }}>
                                          <thead>
                                            <tr style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                                              <th style={{ padding: '8px' }}>Termin Cicilan</th>
                                              <th style={{ padding: '8px' }}>Nominal</th>
                                              <th style={{ padding: '8px' }}>Bukti Pembayaran (Unduh)</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                              <td style={{ padding: '8px' }}>Pendaftaran (Formulir)</td>
                                              <td style={{ padding: '8px' }}>{formatCurrency(250000)}</td>
                                              <td style={{ padding: '8px' }}>
                                                {reg.bukti_bayar_url ? (
                                                  <a href={reg.bukti_bayar_url} target="_blank" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>🔗 Lihat Bukti Formulir</a>
                                                ) : 'Belum upload'}
                                              </td>
                                            </tr>
                                            
                                            {reg.metode_pembayaran === 'Cash' && (
                                              <tr>
                                                <td style={{ padding: '8px' }}>Uang Masuk Full Payment</td>
                                                <td style={{ padding: '8px' }}>{formatCurrency(obligation)}</td>
                                                <td style={{ padding: '8px' }}>
                                                  {reg.bukti_full_payment ? (
                                                    <a href={reg.bukti_full_payment} target="_blank" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>🔗 Lihat Bukti Lunas</a>
                                                  ) : (
                                                    <span style={{ color: 'var(--text-secondary)' }}>Belum upload</span>
                                                  )}
                                                </td>
                                              </tr>
                                            )}

                                            {reg.metode_pembayaran === 'Angsuran' && (
                                              <>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                  <td style={{ padding: '8px' }}>Angsuran 1 (50%)</td>
                                                  <td style={{ padding: '8px' }}>{formatCurrency(obligation * 0.5)}</td>
                                                  <td style={{ padding: '8px' }}>
                                                    {reg.bukti_angsuran_1 ? (
                                                      <a href={reg.bukti_angsuran_1} target="_blank" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>🔗 Lihat Bukti Angsuran 1</a>
                                                    ) : (
                                                      <span style={{ color: 'var(--text-secondary)' }}>Belum upload</span>
                                                    )}
                                                  </td>
                                                </tr>
                                                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                  <td style={{ padding: '8px' }}>Angsuran 2 (25%)</td>
                                                  <td style={{ padding: '8px' }}>{formatCurrency(obligation * 0.25)}</td>
                                                  <td style={{ padding: '8px' }}>
                                                    {reg.bukti_angsuran_2 ? (
                                                      <a href={reg.bukti_angsuran_2} target="_blank" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>🔗 Lihat Bukti Angsuran 2</a>
                                                    ) : (
                                                      <span style={{ color: 'var(--text-secondary)' }}>Belum upload</span>
                                                    )}
                                                  </td>
                                                </tr>
                                                <tr>
                                                  <td style={{ padding: '8px' }}>Angsuran 3 (25% Pelunasan)</td>
                                                  <td style={{ padding: '8px' }}>{formatCurrency(obligation * 0.25)}</td>
                                                  <td style={{ padding: '8px' }}>
                                                    {reg.bukti_angsuran_3 ? (
                                                      <a href={reg.bukti_angsuran_3} target="_blank" style={{ color: 'var(--accent-color)', fontWeight: 600, textDecoration: 'none' }}>🔗 Lihat Bukti Angsuran 3</a>
                                                    ) : (
                                                      <span style={{ color: 'var(--text-secondary)' }}>Belum upload</span>
                                                    )}
                                                  </td>
                                                </tr>
                                              </>
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
          );
        })()}

        {/* SECTION 4: EVENTS MANAGEMENT */}
        {currentSection === 'events' && (
          <div className="animate-fade-in">
            {/* Form Buat Event */}
            <section className={`glass-panel ${styles.panel}`}>
              <h2 className={styles.panelTitle}>Buat Agenda / Event Baru</h2>

              <form onSubmit={handleCreateEvent}>
                {eventSuccess && (
                  <div className={`${styles.alert} ${styles.statusSuccess}`}>
                    ✓ Event berhasil ditambahkan ke database! Otomatis tampil di halaman event publik.
                  </div>
                )}
                {eventError && (
                  <div className={`${styles.alert} ${styles.statusError}`}>
                    ⚠ {eventError}
                  </div>
                )}

                <div className={styles.adminForm}>
                  <div className="form-group">
                    <label htmlFor="nama_event" className="form-label">Nama Event / Agenda</label>
                    <input
                      type="text"
                      id="nama_event"
                      name="nama_event"
                      className="form-input"
                      required
                      placeholder="Contoh: Trial Class & Open House"
                      disabled={eventLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="tanggal" className="form-label">Tanggal Pelaksanaan</label>
                    <input
                      type="date"
                      id="tanggal"
                      name="tanggal"
                      className="form-input"
                      required
                      disabled={eventLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="kuota_total" className="form-label">Kuota Tiket Tersedia</label>
                    <input
                      type="number"
                      id="kuota_total"
                      name="kuota_total"
                      className="form-input"
                      required
                      placeholder="Contoh: 50"
                      min={1}
                      disabled={eventLoading}
                    />
                  </div>

                  <div className={`form-group ${styles.fullWidth}`}>
                    <label htmlFor="deskripsi" className="form-label">Deskripsi Singkat Event</label>
                    <textarea
                      id="deskripsi"
                      name="deskripsi"
                      className="form-input"
                      required
                      placeholder="Jelaskan mengenai agenda kegiatan ini..."
                      rows={3}
                      disabled={eventLoading}
                    ></textarea>
                  </div>
                </div>

                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" disabled={eventLoading}>
                    {eventLoading ? 'Menyimpan...' : 'Publish Event'}
                  </button>
                </div>
              </form>
            </section>

            {/* List Event */}
            <section className={`glass-panel ${styles.panel}`}>
              <h2 className={styles.panelTitle}>Daftar Event Sekolah</h2>
              <div style={{ overflowX: 'auto', marginBottom: '40px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Nama Event</th>
                      <th style={{ padding: '12px' }}>Tanggal</th>
                      <th style={{ padding: '12px' }}>Kuota Total</th>
                      <th style={{ padding: '12px' }}>Terisi (Booked)</th>
                      <th style={{ padding: '12px' }}>Sisa Kuota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          Belum ada event yang dibuat.
                        </td>
                      </tr>
                    ) : (
                      events.map((ev: any) => (
                        <tr key={ev.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{ev.nama_event}</td>
                          <td style={{ padding: '12px' }}>{new Date(ev.tanggal).toLocaleDateString('id-ID')}</td>
                          <td style={{ padding: '12px' }}>{ev.kuota_total} Tiket</td>
                          <td style={{ padding: '12px', color: 'var(--accent-color)', fontWeight: 600 }}>{ev.kuota_terisi} Tiket</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{ fontWeight: 700, color: (ev.kuota_total - ev.kuota_terisi) <= 0 ? '#ef4444' : '#22c55e' }}>
                              {(ev.kuota_total - ev.kuota_terisi) <= 0 ? 'Penuh' : `${ev.kuota_total - ev.kuota_terisi} Tiket`}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* List Pendaftar Event */}
              <h2 className={styles.panelTitle}>Daftar Pendaftar Event</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '12px' }}>Nama Pendaftar</th>
                      <th style={{ padding: '12px' }}>WhatsApp</th>
                      <th style={{ padding: '12px' }}>Nama Event</th>
                      <th style={{ padding: '12px' }}>Jumlah Tiket</th>
                      <th style={{ padding: '12px' }}>Waktu Booking</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventRegistrants.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          Belum ada orang yang mendaftar ke event apa pun.
                        </td>
                      </tr>
                    ) : (
                      eventRegistrants.map((reg: any) => (
                        <tr key={reg.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{reg.nama_pendaftar}</td>
                          <td style={{ padding: '12px', color: 'var(--accent-color)' }}>+{reg.whatsapp}</td>
                          <td style={{ padding: '12px' }}>{reg.nama_event}</td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{reg.jumlah_tiket} Tiket</td>
                          <td style={{ padding: '12px' }}>{new Date(reg.created_at).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {/* SECTION 5: ACADEMIC PORTAL (Fase 3) */}
        {currentSection === 'academic' && (
          <div className="animate-fade-in">
            {/* Header Tabs */}
            <div style={{ display: 'flex', gap: '16px', borderBottom: '2px solid var(--border-color)', marginBottom: '32px' }}>
              <button
                onClick={() => setAcademicTab('attendance')}
                style={{ padding: '12px 24px', background: 'transparent', border: 'none', fontWeight: '600', cursor: 'pointer',
                  color: academicTab === 'attendance' ? 'var(--accent-color)' : 'var(--text-secondary)',
                  borderBottom: academicTab === 'attendance' ? '2px solid var(--accent-color)' : 'none', marginBottom: '-2px' }}
              >
                Kehadiran & Absensi
              </button>
              <button
                onClick={() => setAcademicTab('tasks')}
                style={{ padding: '12px 24px', background: 'transparent', border: 'none', fontWeight: '600', cursor: 'pointer',
                  color: academicTab === 'tasks' ? 'var(--accent-color)' : 'var(--text-secondary)',
                  borderBottom: academicTab === 'tasks' ? '2px solid var(--accent-color)' : 'none', marginBottom: '-2px' }}
              >
                Tugas & Penilaian
              </button>
            </div>

            {/* TAB ABSENSI - ORANG TUA */}
            {academicTab === 'attendance' && user.role === 'orang_tua' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {/* Selector Anak */}
                <div className={`glass-panel ${styles.panel}`} style={{ padding: '24px' }}>
                  <label htmlFor="childSelector" className="form-label" style={{ fontWeight: '700' }}>Pilih Profil Anak:</label>
                  <select
                    id="childSelector"
                    className="form-input"
                    value={selectedChildId}
                    onChange={(e) => {
                      setSelectedChildId(e.target.value);
                      setPenjemputSuccess(false);
                      setPermitSuccess(false);
                    }}
                  >
                    {parentChildren.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama_anak} ({c.kelas})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                  {/* Form Log Penjemputan */}
                  <div className={`glass-panel ${styles.panel}`}>
                    <h3 className={styles.panelTitle} style={{ fontSize: '1.15rem' }}>🚸 Daftarkan Penjemput Anak (Hari Ini)</h3>
                    <form onSubmit={handleRegisterPenjemput}>
                      {penjemputSuccess && <div className={`${styles.alert} ${styles.statusSuccess}`}>✓ Log penjemputan berhasil dikirim!</div>}
                      {penjemputError && <div className={`${styles.alert} ${styles.statusError}`}>⚠ {penjemputError}</div>}
                      
                      <div className="form-group">
                        <label htmlFor="nama_penjemput" className="form-label">Nama Lengkap Penjemput</label>
                        <input type="text" id="nama_penjemput" name="nama_penjemput" className="form-input" required placeholder="Contoh: Budi Santoso" disabled={penjemputLoading} />
                      </div>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label htmlFor="relasi_penjemput" className="form-label">Relasi dengan Anak</label>
                        <input type="text" id="relasi_penjemput" name="relasi_penjemput" className="form-input" required placeholder="Contoh: Paman / Supir Jemputan" disabled={penjemputLoading} />
                      </div>
                      <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={penjemputLoading}>
                        {penjemputLoading ? 'Mengirim...' : 'Konfirmasi Penjemput'}
                      </button>
                    </form>
                  </div>

                  {/* Form Pengajuan Izin/Sakit */}
                  <div className={`glass-panel ${styles.panel}`}>
                    <h3 className={styles.panelTitle} style={{ fontSize: '1.15rem' }}>🏥 Ajukan Izin / Sakit</h3>
                    <form onSubmit={handleReportAbsence}>
                      {permitSuccess && <div className={`${styles.alert} ${styles.statusSuccess}`}>✓ Laporan izin berhasil dikirim ke guru!</div>}
                      {permitError && <div className={`${styles.alert} ${styles.statusError}`}>⚠ {permitError}</div>}
                      
                      <div className="form-group">
                        <label htmlFor="tanggal" className="form-label">Pilih Tanggal Izin</label>
                        <input type="date" id="tanggal" name="tanggal" className="form-input" required defaultValue={new Date().toISOString().split('T')[0]} disabled={permitLoading} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="status" className="form-label">Keterangan Status</label>
                        <select id="status" name="status" className="form-input" required disabled={permitLoading}>
                          <option value="Izin">Izin (Keperluan Keluarga, dll)</option>
                          <option value="Sakit">Sakit (Butuh Istirahat)</option>
                        </select>
                      </div>
                      <div className="form-group" style={{ marginBottom: '20px' }}>
                        <label htmlFor="keterangan" className="form-label">Alasan Detail</label>
                        <input type="text" id="keterangan" name="keterangan" className="form-input" required placeholder="Contoh: Demam tinggi sejak tadi malam" disabled={permitLoading} />
                      </div>
                      <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={permitLoading}>
                        {permitLoading ? 'Mengirim...' : 'Kirim Laporan Izin'}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Histori Absensi Anak */}
                <div className={`glass-panel ${styles.panel}`}>
                  <h3 className={styles.panelTitle} style={{ fontSize: '1.15rem' }}>📅 Riwayat Absensi & Penjemputan</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px' }}>Tanggal</th>
                          <th style={{ padding: '12px' }}>Status Kehadiran</th>
                          <th style={{ padding: '12px' }}>Alasan / Keterangan</th>
                          <th style={{ padding: '12px' }}>Penjemput Terdaftar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!(parentChildAttendance[selectedChildId] && parentChildAttendance[selectedChildId].length > 0) ? (
                          <tr>
                            <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                              Belum ada riwayat absensi terdaftar untuk anak ini.
                            </td>
                          </tr>
                        ) : (
                          parentChildAttendance[selectedChildId].map((att: any) => (
                            <tr key={att.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '12px' }}>{new Date(att.tanggal).toLocaleDateString('id-ID')}</td>
                              <td style={{ padding: '12px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '4px 8px', borderRadius: '12px', textTransform: 'uppercase',
                                  backgroundColor: att.status === 'Hadir' ? 'rgba(34,197,94,0.1)' : att.status === 'Alpa' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)',
                                  color: att.status === 'Hadir' ? '#22c55e' : att.status === 'Alpa' ? '#ef4444' : '#eab308' }}>
                                  {att.status}
                                </span>
                              </td>
                              <td style={{ padding: '12px' }}>{att.keterangan || '-'}</td>
                              <td style={{ padding: '12px' }}>
                                {att.nama_penjemput ? (
                                  <span>{att.nama_penjemput} ({att.relasi_penjemput})</span>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>Diambil Orang Tua Utama</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB ABSENSI - GURU */}
            {academicTab === 'attendance' && user.role === 'guru' && (
              <div className={`glass-panel ${styles.panel}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 className={styles.panelTitle} style={{ margin: 0 }}>📋 Absensi Harian Kelas A</h3>
                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-color)' }}>
                    📅 Hari Ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px' }}>Nama Murid</th>
                        <th style={{ padding: '12px' }}>Status Kehadiran</th>
                        <th style={{ padding: '12px' }}>Alasan / Catatan Izin</th>
                        <th style={{ padding: '12px' }}>Penjemput Terdaftar</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {classChildren.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            Belum ada daftar siswa terdaftar di Kelas A.
                          </td>
                        </tr>
                      ) : (
                        classChildren.map((child: any) => {
                          const todayAtt = getTodayStatus(child.id);

                          return (
                            <tr key={child.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '16px 12px', fontWeight: 600 }}>{child.nama_anak}</td>
                              <td style={{ padding: '16px 12px' }}>
                                <form id={`form-att-${child.id}`} onSubmit={(e) => handleGuruAttendance(e, child.id, child.nama_anak)}>
                                  <div style={{ display: 'flex', gap: '8px' }}>
                                    {['Hadir', 'Izin', 'Sakit', 'Alpa'].map((st) => (
                                      <label key={st} style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                        <input
                                          type="radio"
                                          name="status"
                                          value={st}
                                          defaultChecked={todayAtt.status === st || (!todayAtt.status && st === 'Hadir')}
                                        />
                                        {st}
                                      </label>
                                    ))}
                                  </div>
                                </form>
                              </td>
                              <td style={{ padding: '16px 12px' }}>
                                <input
                                  type="text"
                                  name="keterangan"
                                  form={`form-att-${child.id}`}
                                  className="form-input"
                                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                  defaultValue={todayAtt.keterangan || ''}
                                  placeholder="Tulis alasan jika tidak hadir"
                                />
                              </td>
                              <td style={{ padding: '16px 12px' }}>
                                {todayAtt.nama_penjemput ? (
                                  <span style={{ fontSize: '0.85rem' }}>🚘 {todayAtt.nama_penjemput} ({todayAtt.relasi_penjemput})</span>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>OTM Utama</span>
                                )}
                              </td>
                              <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                <button
                                  type="submit"
                                  form={`form-att-${child.id}`}
                                  className="btn-primary"
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  disabled={attendanceLoadingId === child.id}
                                >
                                  {attendanceLoadingId === child.id ? 'Saving...' : 'Simpan'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB TUGAS - ORANG TUA */}
            {academicTab === 'tasks' && user.role === 'orang_tua' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {/* Selector Anak */}
                <div className={`glass-panel ${styles.panel}`} style={{ padding: '24px' }}>
                  <label htmlFor="childSelector2" className="form-label" style={{ fontWeight: '700' }}>Pilih Profil Anak:</label>
                  <select
                    id="childSelector2"
                    className="form-input"
                    value={selectedChildId}
                    onChange={(e) => {
                      setSelectedChildId(e.target.value);
                      setTaskSubError(null);
                    }}
                  >
                    {parentChildren.map((c) => (
                      <option key={c.id} value={c.id}>{c.nama_anak} ({c.kelas})</option>
                    ))}
                  </select>
                </div>

                {/* List Tugas & Formulir Kumpul */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {parentClassTasks.length === 0 ? (
                    <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      🍃 Belum ada tugas kelas terdaftar untuk kelas anak ini.
                    </div>
                  ) : (
                    parentClassTasks.map((task) => {
                      // Cari data pengumpulan tugas untuk anak terpilih
                      const subs = parentChildSubmissions[selectedChildId] || [];
                      const mySub = subs.find(s => s.tugas_id === task.id);
                      const isSubmitted = !!mySub;

                      return (
                        <div key={task.id} className={`glass-panel ${styles.panel}`} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>{task.judul_tugas}</h3>
                              <small style={{ color: '#ef4444', fontWeight: 600 }}>⏰ Batas Pengumpulan: {new Date(task.deadline).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
                            </div>
                            <div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, padding: '6px 12px', borderRadius: '12px', textTransform: 'uppercase',
                                backgroundColor: isSubmitted ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                color: isSubmitted ? '#22c55e' : '#ef4444' }}>
                                {isSubmitted ? 'Sudah Dikumpul' : 'Belum Dikumpul'}
                              </span>
                            </div>
                          </div>

                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>{task.deskripsi}</p>

                          {/* Detail Penilaian Guru jika sudah dinilai */}
                          {isSubmitted && mySub.nilai && (
                            <div style={{ backgroundColor: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', padding: '16px', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#22c55e' }}>{mySub.nilai}</div>
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Hasil Catatan Guru:</div>
                                  <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem' }}>{mySub.catatan_guru || 'Kerja bagus!'}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Info Pengiriman jika sudah submit namun belum dinilai */}
                          {isSubmitted && !mySub.nilai && (
                            <div style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: '0.9rem' }}>
                              ⏳ **Tugas Terkirim**: "{mySub.jawaban_text}" <br/>
                              {mySub.file_url && <a href={mySub.file_url} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }}>🔗 Lihat Berkas Jawaban</a>}
                              <span style={{ display: 'block', marginTop: '8px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>*Menunggu evaluasi penilaian dan catatan dari guru wali kelas.</span>
                            </div>
                          )}

                          {/* Form Kumpul/Revisi Tugas */}
                          {(!isSubmitted || !mySub.nilai) && (
                            <form onSubmit={(e) => handleCollectAssignment(e, task.id, parentChildren.find(c => c.id === selectedChildId)?.nama_anak)} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                              {taskSubError && <div className={`${styles.alert} ${styles.statusError}`}>⚠ {taskSubError}</div>}
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                                <div className="form-group">
                                  <label htmlFor={`ans-${task.id}`} className="form-label">Jawaban Teks / Deskripsi Jawaban</label>
                                  <input type="text" id={`ans-${task.id}`} name="jawaban_text" className="form-input" required placeholder="Tuliskan keterangan jawaban tugas" defaultValue={mySub?.jawaban_text || ''} disabled={submittingTaskId === task.id} />
                                </div>
                                <div className="form-group">
                                  <label htmlFor={`file-${task.id}`} className="form-label">URL Foto / Berkas Hasil Kerja (Opsional)</label>
                                  <input type="url" id={`file-${task.id}`} name="file_url" className="form-input" placeholder="https://example.com/foto-tugas.jpg" defaultValue={mySub?.file_url || ''} disabled={submittingTaskId === task.id} />
                                </div>
                              </div>
                              <button type="submit" className="btn-primary" disabled={submittingTaskId === task.id}>
                                {submittingTaskId === task.id ? 'Mengirim...' : isSubmitted ? 'Revisi Pengumpulan Tugas' : 'Kirim Tugas Sekarang'}
                              </button>
                            </form>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* TAB TUGAS - GURU */}
            {academicTab === 'tasks' && user.role === 'guru' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '32px' }}>
                {/* Form Buat Tugas Baru */}
                <div className={`glass-panel ${styles.panel}`}>
                  <h3 className={styles.panelTitle} style={{ fontSize: '1.25rem' }}>📝 Buat Penugasan Baru (Kelas A)</h3>
                  <form onSubmit={handleCreateTask}>
                    {taskFormSuccess && <div className={`${styles.alert} ${styles.statusSuccess}`}>✓ Penugasan berhasil dipublish dan langsung terlihat di portal OTM!</div>}
                    {taskFormError && <div className={`${styles.alert} ${styles.statusError}`}>⚠ {taskFormError}</div>}
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div className="form-group">
                        <label htmlFor="judul_tugas" className="form-label">Judul Tugas</label>
                        <input type="text" id="judul_tugas" name="judul_tugas" className="form-input" required placeholder="Contoh: Kolase Kertas Origami" disabled={taskFormLoading} />
                      </div>
                      <div className="form-group">
                        <label htmlFor="deadline" className="form-label">Batas Pengumpulan (Deadline)</label>
                        <input type="date" id="deadline" name="deadline" className="form-input" required disabled={taskFormLoading} />
                      </div>
                    </div>
                    
                    <input type="hidden" name="penerima_kelas" value="Kelas A" />

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label htmlFor="deskripsi_tugas" className="form-label">Instruksi / Detail Tugas</label>
                      <textarea id="deskripsi_tugas" name="deskripsi" className="form-input" rows={3} required placeholder="Jelaskan detail petunjuk tugas untuk orang tua murid..." disabled={taskFormLoading}></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button type="submit" className="btn-primary" disabled={taskFormLoading}>
                        {taskFormLoading ? 'Publishing...' : 'Publish Tugas'}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Seleksi Tugas & Monitoring Pengumpulan */}
                <div className={`glass-panel ${styles.panel}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 className={styles.panelTitle} style={{ margin: 0, fontSize: '1.25rem' }}>🎯 Penilaian Pengumpulan Tugas</h3>
                    <div>
                      <label htmlFor="taskSelect" className="form-label" style={{ display: 'inline-block', marginRight: '8px', marginBottom: 0 }}>Pilih Tugas:</label>
                      <select
                        id="taskSelect"
                        className="form-input"
                        style={{ display: 'inline-block', width: 'auto', padding: '6px 12px' }}
                        value={selectedTaskId}
                        onChange={(e) => setSelectedTaskId(e.target.value)}
                      >
                        {classTasks.map(t => (
                          <option key={t.id} value={t.id}>{t.judul_tugas}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Tabel Pendaftar Tugas */}
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', textAlign: 'left' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                          <th style={{ padding: '12px' }}>Nama Murid</th>
                          <th style={{ padding: '12px' }}>Jawaban Teks</th>
                          <th style={{ padding: '12px' }}>Berkas Bukti</th>
                          <th style={{ padding: '12px' }}>Waktu Kirim</th>
                          <th style={{ padding: '12px' }}>Nilai</th>
                          <th style={{ padding: '12px', textAlign: 'right' }}>Input Nilai & Masukan Guru</th>
                        </tr>
                      </thead>
                      <tbody>
                        {!selectedTaskId || !(taskSubmissions[selectedTaskId] && taskSubmissions[selectedTaskId].length > 0) ? (
                          <tr>
                            <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                              Belum ada murid yang mengumpulkan tugas ini.
                            </td>
                          </tr>
                        ) : (
                          taskSubmissions[selectedTaskId].map((sub: any) => (
                            <tr key={sub.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '16px 12px', fontWeight: 600 }}>{sub.nama_anak}</td>
                              <td style={{ padding: '16px 12px' }}>"{sub.jawaban_text}"</td>
                              <td style={{ padding: '16px 12px' }}>
                                {sub.file_url ? (
                                  <a href={sub.file_url} target="_blank" style={{ color: 'var(--accent-color)', textDecoration: 'none', fontWeight: 500 }}>
                                    🔗 Lihat Bukti
                                  </a>
                                ) : (
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>No file</span>
                                )}
                              </td>
                              <td style={{ padding: '16px 12px' }}>{new Date(sub.created_at).toLocaleDateString('id-ID')}</td>
                              <td style={{ padding: '16px 12px' }}>
                                {sub.nilai ? (
                                  <span style={{ fontSize: '1.25rem', fontWeight: 900, color: '#22c55e' }}>{sub.nilai}</span>
                                ) : (
                                  <span style={{ color: '#ef4444', fontWeight: 600 }}>Belum Dinilai</span>
                                )}
                              </td>
                              <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                                <form onSubmit={(e) => handleGradeSubmission(e, sub.id)} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                                  <input
                                    type="number"
                                    name="nilai"
                                    className="form-input"
                                    style={{ width: '70px', padding: '6px 10px', fontSize: '0.85rem' }}
                                    required
                                    min={0}
                                    max={100}
                                    defaultValue={sub.nilai || ''}
                                    placeholder="Skor"
                                    disabled={gradingSubId === sub.id}
                                  />
                                  <input
                                    type="text"
                                    name="catatan_guru"
                                    className="form-input"
                                    style={{ width: '150px', padding: '6px 10px', fontSize: '0.85rem' }}
                                    defaultValue={sub.catatan_guru || ''}
                                    placeholder="Catatan..."
                                    disabled={gradingSubId === sub.id}
                                  />
                                  <button
                                    type="submit"
                                    className="btn-primary"
                                    style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'var(--text-primary)' }}
                                    disabled={gradingSubId === sub.id}
                                  >
                                    {gradingSubId === sub.id ? 'Save...' : 'Nilai'}
                                  </button>
                                </form>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
