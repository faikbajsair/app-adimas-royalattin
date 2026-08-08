import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/actions/authActions';
import { SchoolInfoModel } from '@/models/infoModel';
import { PpdbModel } from '@/models/ppdbModel';
import { EventModel, EventRegistrantModel } from '@/models/eventModel';
import { ChildModel } from '@/models/childModel';
import { AttendanceModel } from '@/models/attendanceModel';
import { TaskModel, SubmissionModel } from '@/models/taskModel';
import { QuotaModel } from '@/models/quotaModel';
import { LandingSectionModel, LandingSectionItemModel } from '@/models/landingModel';
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
  let landingSections: any[] = [];
  let landingItems: any[] = [];

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
      const eventModel = new EventModel();
      const registrantModel = new EventRegistrantModel();
      const quotaModel = new QuotaModel();
      const landingSectionModel = new LandingSectionModel();
      const landingItemModel = new LandingSectionItemModel();

      // Jalankan inisialisasi lambat jika kosong secara paralel terlebih dahulu
      await Promise.all([
        ppdbModel.initDummyRegistrantsIfEmpty(),
        quotaModel.initQuotasIfEmpty()
      ]);

      // Ambil data dashboard secara paralel
      const [ppdbData, eventsData, regData, quotasData, sectionsData, itemsData] = await Promise.all([
        ppdbModel.getAll(),
        eventModel.getEvents(),
        registrantModel.getRegistrants(),
        quotaModel.getAll(),
        landingSectionModel.getSections(),
        landingItemModel.getItems(),
        syncPpdbAccountsToUsersAction() // Sync dijalankan di latar belakang secara paralel
      ]);

      ppdbRegistrants = ppdbData;
      events = eventsData;
      eventRegistrants = regData;
      quotas = quotasData;
      landingSections = sectionsData;
      landingItems = itemsData;
    }

    // 2. Data Orang Tua (Fase 3)
    if (user.role === 'orang_tua') {
      const childModel = new ChildModel();
      await childModel.initSampleChildrenIfEmpty(user.id, user.name);
      
      const taskModel = new TaskModel();
      
      // Ambil data dasar secara paralel
      const [childrenData, tasksData] = await Promise.all([
        childModel.getChildrenByParentId(user.id),
        taskModel.getTasksByClass('Kelas A')
      ]);
      
      parentChildren = childrenData;
      parentClassTasks = tasksData;

      const attendanceModel = new AttendanceModel();
      const submissionModel = new SubmissionModel();

      // Ambil data absensi dan tugas seluruh anak secara paralel
      await Promise.all(parentChildren.map(async (child) => {
        const [att, sub] = await Promise.all([
          attendanceModel.getAttendanceByChildId(child.id),
          submissionModel.getSubmissionsByChild(child.id)
        ]);
        parentChildAttendance[child.id] = att;
        parentChildSubmissions[child.id] = sub;
      }));
    }

    // 3. Data Guru (Fase 3)
    if (user.role === 'guru') {
      const childModel = new ChildModel();
      const taskModel = new TaskModel();
      const attendanceModel = new AttendanceModel();

      // Ambil data siswa, tugas, dan absensi secara paralel
      const [childrenData, tasksData, attData] = await Promise.all([
        childModel.getChildrenByClass('Kelas A'),
        taskModel.getTasksByClass('Kelas A'),
        attendanceModel.getAttendanceByDate(today)
      ]);

      classChildren = childrenData;
      classTasks = tasksData;
      todayAttendance = attData;

      const submissionModel = new SubmissionModel();
      
      // Ambil seluruh submission untuk setiap tugas secara paralel
      await Promise.all(classTasks.map(async (t) => {
        taskSubmissions[t.id] = await submissionModel.getSubmissionsByTaskId(t.id);
      }));
    }
  } catch (e) {
    console.error('Gagal memuat data dashboard:', e);
    info = {
      name: 'KB-TK Royal Attin',
      sub_name: 'Islamic Character School',
      address: 'Jalan Vila Nusa Indah Raya, Blok M-1, Gunung Putri, Bogor',
      tagline: 'Membentuk Generasi Karakter Islami yang Cerdas & Berakhlak Mulia',
      logo_url: 'https://royalattin.sch.id/assets/img/logo-yayasan-only-removebg.png',
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
      landingSections={landingSections}
      landingItems={landingItems}
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
