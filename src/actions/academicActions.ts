'use server';

import { AttendanceModel } from '@/models/attendanceModel';
import { TaskModel, SubmissionModel } from '@/models/taskModel';
import { ChildModel } from '@/models/childModel';
import { getCurrentUser } from './authActions';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const attendanceSchema = z.object({
  anak_id: z.string().min(1, 'ID anak tidak valid'),
  nama_anak: z.string().min(1, 'Nama anak harus terisi'),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD'),
  status: z.enum(['Hadir', 'Izin', 'Sakit', 'Alpa']),
  keterangan: z.string(),
  nama_penjemput: z.string().optional(),
  relasi_penjemput: z.string().optional()
});

const taskSchema = z.object({
  judul_tugas: z.string().min(3, 'Judul tugas minimal 3 karakter'),
  deskripsi: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  deadline: z.string().min(1, 'Batas pengumpulan harus ditentukan'),
  penerima_kelas: z.string().min(1, 'Target kelas harus dipilih'),
});

const submissionSchema = z.object({
  tugas_id: z.string().min(1, 'ID Tugas tidak valid'),
  anak_id: z.string().min(1, 'ID Anak tidak valid'),
  nama_anak: z.string().min(1, 'Nama anak harus terisi'),
  jawaban_text: z.string().min(5, 'Jawaban teks minimal 5 karakter'),
  file_url: z.string().url('Format URL file bukti tugas tidak valid').or(z.literal('')),
});

// 1. Input Absensi Murid Harian (Oleh Guru / Admin)
export async function recordStudentAttendanceAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'guru' && user.role !== 'admin')) {
    return { error: 'Anda tidak memiliki hak akses untuk tindakan ini.' };
  }

  const anak_id = formData.get('anak_id') as string;
  const nama_anak = formData.get('nama_anak') as string;
  const tanggal = formData.get('tanggal') as string;
  const status = formData.get('status') as any;
  const keterangan = formData.get('keterangan') as string || '';

  const validation = attendanceSchema.safeParse({ anak_id, nama_anak, tanggal, status, keterangan });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const attendanceModel = new AttendanceModel();
    await attendanceModel.recordAttendance({
      anak_id,
      nama_anak,
      tanggal,
      status,
      keterangan
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: any) {
    console.error('Error recordStudentAttendanceAction:', e.message);
    return { error: 'Gagal mencatat absensi.' };
  }
}

// 2. Laporkan Izin/Sakit Anak (Oleh Orang Tua)
export async function reportChildPermitAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'orang_tua') {
    return { error: 'Hanya orang tua murid yang dapat melaporkan izin.' };
  }

  const anak_id = formData.get('anak_id') as string;
  const tanggal = formData.get('tanggal') as string;
  const status = formData.get('status') as any; // Izin atau Sakit
  const keterangan = formData.get('keterangan') as string || '';

  if (!['Izin', 'Sakit'].includes(status)) {
    return { error: 'Status ketidakhadiran tidak valid' };
  }

  try {
    const childModel = new ChildModel();
    const child = await childModel.getChildById(anak_id);
    if (!child || child.orang_tua_id !== user.id) {
      return { error: 'Profil anak tidak cocok dengan akun Anda.' };
    }

    const attendanceModel = new AttendanceModel();
    await attendanceModel.recordAttendance({
      anak_id,
      nama_anak: child.nama_anak,
      tanggal,
      status,
      keterangan
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: any) {
    console.error('Error reportChildPermitAction:', e.message);
    return { error: 'Gagal melaporkan izin anak.' };
  }
}

// 3. Update Data Penjemput Anak Hari Ini (Oleh Orang Tua)
export async function recordPenjemputAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'orang_tua') {
    return { error: 'Hanya orang tua murid yang dapat mendaftarkan penjemput.' };
  }

  const anak_id = formData.get('anak_id') as string;
  const nama_penjemput = formData.get('nama_penjemput') as string;
  const relasi_penjemput = formData.get('relasi_penjemput') as string;
  const tanggal = new Date().toISOString().split('T')[0]; // Hari ini

  if (!nama_penjemput || !relasi_penjemput) {
    return { error: 'Nama dan relasi penjemput harus diisi' };
  }

  try {
    const childModel = new ChildModel();
    const child = await childModel.getChildById(anak_id);
    if (!child || child.orang_tua_id !== user.id) {
      return { error: 'Profil anak tidak cocok dengan akun Anda.' };
    }

    const attendanceModel = new AttendanceModel();
    // Cari status absensi hari ini, jika belum diabsen oleh guru, set default Hadir
    const all = await attendanceModel.getAll();
    const existing = all.find(item => item.anak_id === anak_id && item.tanggal === tanggal);

    await attendanceModel.recordAttendance({
      anak_id,
      nama_anak: child.nama_anak,
      tanggal,
      status: (existing?.status as any) || 'Hadir',
      keterangan: existing?.keterangan || '',
      nama_penjemput,
      relasi_penjemput
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: any) {
    console.error('Error recordPenjemputAction:', e.message);
    return { error: 'Gagal mendaftarkan log penjemputan.' };
  }
}

// 4. Membuat Tugas Baru (Oleh Guru / Admin)
export async function createNewTaskAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'guru' && user.role !== 'admin')) {
    return { error: 'Anda tidak memiliki hak akses untuk tindakan ini.' };
  }

  const judul_tugas = formData.get('judul_tugas') as string;
  const deskripsi = formData.get('deskripsi') as string;
  const deadline = formData.get('deadline') as string;
  const penerima_kelas = formData.get('penerima_kelas') as string;

  const validation = taskSchema.safeParse({ judul_tugas, deskripsi, deadline, penerima_kelas });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const taskModel = new TaskModel();
    await taskModel.createNewTask({ judul_tugas, deskripsi, deadline, penerima_kelas });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: any) {
    console.error('Error createNewTaskAction:', e.message);
    return { error: 'Gagal membuat tugas baru.' };
  }
}

// 5. Mengirim/Mengumpulkan Tugas (Oleh Orang Tua)
export async function submitTaskAssignmentAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || user.role !== 'orang_tua') {
    return { error: 'Hanya orang tua murid yang dapat mengumpulkan tugas.' };
  }

  const tugas_id = formData.get('tugas_id') as string;
  const anak_id = formData.get('anak_id') as string;
  const nama_anak = formData.get('nama_anak') as string;
  const jawaban_text = formData.get('jawaban_text') as string;
  const file_url = formData.get('file_url') as string || '';

  const validation = submissionSchema.safeParse({ tugas_id, anak_id, nama_anak, jawaban_text, file_url });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const submissionModel = new SubmissionModel();
    await submissionModel.submitAssignment({
      tugas_id,
      anak_id,
      nama_anak,
      jawaban_text,
      file_url
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: any) {
    console.error('Error submitTaskAssignmentAction:', e.message);
    return { error: 'Gagal mengumpulkan tugas.' };
  }
}

// 6. Menilai Tugas Murid (Oleh Guru / Admin)
export async function gradeStudentAssignmentAction(submissionId: string, score: number, comment: string) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'guru' && user.role !== 'admin')) {
    return { error: 'Anda tidak memiliki hak akses untuk tindakan ini.' };
  }

  if (score < 0 || score > 100) {
    return { error: 'Nilai harus berkisar antara 0 - 100' };
  }

  try {
    const submissionModel = new SubmissionModel();
    await submissionModel.gradeSubmission(submissionId, score, comment);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: any) {
    console.error('Error gradeStudentAssignmentAction:', e.message);
    return { error: 'Gagal memperbarui nilai tugas.' };
  }
}
