import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { SchoolInfoModel } from '@/models/infoModel';
import { PpdbModel } from '@/models/ppdbModel';
import { EventModel, EventRegistrantModel } from '@/models/eventModel';
import { ChildModel } from '@/models/childModel';
import { AttendanceModel } from '@/models/attendanceModel';
import { TaskModel, SubmissionModel } from '@/models/taskModel';
import { QuotaModel } from '@/models/quotaModel';
import { syncPpdbAccountsToUsersAction } from '@/actions/ppdbActions';
import DashboardClient from '@/components/DashboardClient';

export const revalidate = 0; // Jangan men-cache dashboard agar data real-time terbaru

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  let info;
  let ppdbRegistrants: any[] = [];
  let events: any[] = [];
  let eventRegistrants: any[] = [];
  let quotas: any[] = [];

  // Data Akademik (Fase 3)
  let parentChildren: any[] = [];
  let parentClassTasks: any[] = [];
  let parentChildAttendance: Record<string, any[]> = {};
  let parentChildSubmissions: Record<string, any[]> = {};

  let classChildren: any[] = [];
  let classTasks: any[] = [];
  let taskSubmissions: Record<string, any[]> = {};
  let todayAttendance: any[] = [];

  const today = new Date().toISOString().split('T')[0];

  try {
    const infoModel = new SchoolInfoModel();
    info = await infoModel.getInfo();
    
    // 1. Data Admin & Yayasan (Fase 2)
    if (['admin', 'admin_kbtk', 'admin_sd', 'admin_nura', 'yayasan', 'kepsek'].includes(user.role)) {
      const ppdbModel = new PpdbModel();
      await ppdbModel.initDummyRegistrantsIfEmpty();
      await syncPpdbAccountsToUsersAction();
      ppdbRegistrants = await ppdbModel.getAll();

      const eventModel = new EventModel();
      events = await eventModel.getEvents();

      const registrantModel = new EventRegistrantModel();
      eventRegistrants = await registrantModel.getRegistrants();

      const quotaModel = new QuotaModel();
      await quotaModel.initQuotasIfEmpty();
      quotas = await quotaModel.getAll();
    }

    // 2. Data Orang Tua (Fase 3)
    if (user.role === 'orang_tua') {
      const childModel = new ChildModel();
      // Inisialisasi data anak dummy otomatis jika kosong untuk kemudahan testing user
      await childModel.initSampleChildrenIfEmpty(user.id, user.name);
      
      parentChildren = await childModel.getChildrenByParentId(user.id);
      
      // Ambil tugas-tugas untuk kelas anak-anak (asumsi Kelas A)
      const taskModel = new TaskModel();
      parentClassTasks = await taskModel.getTasksByClass('Kelas A');

      const attendanceModel = new AttendanceModel();
      const submissionModel = new SubmissionModel();

      for (const child of parentChildren) {
        parentChildAttendance[child.id] = await attendanceModel.getAttendanceByChildId(child.id);
        parentChildSubmissions[child.id] = await submissionModel.getSubmissionsByChild(child.id);
      }
    }

    // 3. Data Guru (Fase 3)
    if (user.role === 'guru') {
      const childModel = new ChildModel();
      // Mengambil daftar siswa kelas A
      classChildren = await childModel.getChildrenByClass('Kelas A');

      // Mengambil daftar tugas kelas A
      const taskModel = new TaskModel();
      classTasks = await taskModel.getTasksByClass('Kelas A');

      const submissionModel = new SubmissionModel();
      for (const t of classTasks) {
        taskSubmissions[t.id] = await submissionModel.getSubmissionsByTaskId(t.id);
      }

      // Mengambil absensi hari ini
      const attendanceModel = new AttendanceModel();
      todayAttendance = await attendanceModel.getAttendanceByDate(today);
    }
  } catch (e) {
    console.error('Gagal memuat data dashboard:', e);
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
    <DashboardClient
      user={user}
      info={info}
      ppdbRegistrants={ppdbRegistrants}
      events={events}
      eventRegistrants={eventRegistrants}
      quotas={quotas}
      // Props Akademik
      parentChildren={parentChildren}
      parentClassTasks={parentClassTasks}
      parentChildAttendance={parentChildAttendance}
      parentChildSubmissions={parentChildSubmissions}
      classChildren={classChildren}
      classTasks={classTasks}
      taskSubmissions={taskSubmissions}
      todayAttendance={todayAttendance}
    />
  );
}
