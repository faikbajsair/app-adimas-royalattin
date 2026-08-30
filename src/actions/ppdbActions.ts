'use server';

import { PpdbModel, PPDBRegistration } from '@/models/ppdbModel';
import { QuotaModel } from '@/models/quotaModel';
import { FeesModel } from '@/models/feesModel';
import { UserModel } from '@/models/userModel';
import { getCurrentUser } from './authActions';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { callSheetsAPI } from '@/lib/db/googleSheets';

// Helper function untuk mengirim berkas bukti transfer ke Telegram Bot
export async function sendFileToTelegram(file: any, caption: string, maxSizeMb: number = 2): Promise<boolean> {
  if (!file || typeof file !== 'object' || !('size' in file) || file.size === 0) {
    return false;
  }

  // 1. Validasi Ekstensi & MIME Type (JPG, PNG, PDF)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const fileMimeType = file.type || '';
  const fileName = file.name || '';
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];

  if (!allowedMimeTypes.includes(fileMimeType) && !allowedExts.includes(fileExt || '')) {
    throw new Error('Format file tidak didukung. Hanya diperbolehkan format JPG, PNG, atau PDF.');
  }

  // 2. Validasi Ukuran Maksimal
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Ukuran file '${fileName}' terlalu besar. Maksimal diperbolehkan ${maxSizeMb}MB.`);
  }

  const token = process.env.TELEGRAM_BOT_TOKEN || '8986475073:AAH4B-hJDwPADOFpPkYCvJ5et22kx7KubOU';
  const chatId = process.env.TELEGRAM_CHAT_ID || '758377155';

  try {
    // A. Kirim detail pendaftaran/pembayaran terlebih dahulu sebagai pesan teks
    const msgUrl = `https://api.telegram.org/bot${token}/sendMessage`;
    const msgRes = await fetch(msgUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: caption,
        parse_mode: 'HTML',
      }),
    });
    const msgJson = await msgRes.json();
    if (!msgJson.ok) {
      console.error('Telegram sendMessage failed:', msgJson.description);
    }

    // B. Kirim berkas fisik bukti transfer sebagai Document
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const blob = new Blob([buffer], { type: fileMimeType || 'application/octet-stream' });

    const formData = new FormData();
    formData.append('chat_id', chatId);
    formData.append('document', blob, fileName || 'document');

    const docUrl = `https://api.telegram.org/bot${token}/sendDocument`;
    const docRes = await fetch(docUrl, {
      method: 'POST',
      body: formData,
    });
    const docJson = await docRes.json();
    if (!docJson.ok) {
      console.error('Telegram sendDocument failed:', docJson.description);
      throw new Error(`Gagal mengirim file ke Telegram: ${docJson.description}`);
    }

    return true;
  } catch (err: any) {
    console.error('Error sendFileToTelegram:', err.message);
    throw err;
  }
}

// Helper function untuk menyimpan file upload di Google Drive via Apps Script (digunakan untuk Brosur Sekolah)
export async function saveUploadedFile(file: any, maxSizeMb: number = 2): Promise<string> {
  if (!file || typeof file !== 'object' || !('size' in file) || file.size === 0) {
    return '';
  }

  // 1. Validasi Ekstensi & MIME Type (JPG, PNG, PDF)
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  const fileMimeType = file.type || '';
  const fileName = file.name || '';
  const fileExt = fileName.split('.').pop()?.toLowerCase();
  const allowedExts = ['jpg', 'jpeg', 'png', 'pdf'];

  if (!allowedMimeTypes.includes(fileMimeType) && !allowedExts.includes(fileExt || '')) {
    throw new Error('Format file tidak didukung. Hanya diperbolehkan format JPG, PNG, atau PDF.');
  }

  // 2. Validasi Ukuran Maksimal
  const maxBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`Ukuran file '${fileName}' terlalu besar. Maksimal diperbolehkan ${maxSizeMb}MB.`);
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Data = buffer.toString('base64');
    
    // Kirim ke Google Apps Script Web App
    const response = await callSheetsAPI('uploadFile', {
      base64Data,
      fileName: `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9.]/g, '_')}`,
      mimeType: fileMimeType || 'application/octet-stream'
    });

    if (response && response.success && response.url) {
      return response.url;
    }
    
    const errMsg = response && response.error ? response.error : 'Respons dari Apps Script tidak valid.';
    console.error('Google Drive Upload Error:', errMsg);
    throw new Error(`Gagal menyimpan ke Google Drive. Detail error: ${errMsg}`);
  } catch (err: any) {
    console.error('Error saveUploadedFile:', err.message);
    throw err;
  }
}

const ppdbSchema = z.object({
  nama_unit: z.string().min(1, 'Nama unit harus dipilih'),
  tahun_ajaran: z.string().min(1, 'Tahun ajaran harus dipilih'),
  nama_anak: z.string().min(2, 'Nama anak minimal 2 karakter'),
  nama_orang_tua: z.string().min(2, 'Nama orang tua minimal 2 karakter'),
  whatsapp: z.string().min(8, 'Nomor WhatsApp minimal 8 digit').regex(/^628[0-9]+$/, 'Format WA harus diawali 628xxx'),
  alamat_rumah: z.string().min(5, 'Alamat rumah minimal 5 karakter'),
  bukti_bayar_url: z.string().min(1, 'Bukti transfer biaya pendaftaran wajib diunggah'),
  tanggal_lahir: z.string().min(1, 'Tanggal lahir anak wajib diisi')
});

// Action mengambil kuota unit + tahun ajaran
export async function getQuotaAction(unit: string, ta: string) {
  if (!unit || !ta) return { total: 50, terisi: 0, sisa: 50 };
  try {
    const quotaModel = new QuotaModel();
    // Pastikan default quotas terisi saat load
    await quotaModel.initQuotasIfEmpty();
    const res = await quotaModel.getQuota(unit, ta);
    const sisa = res.total - res.terisi;
    return { total: res.total, terisi: res.terisi, sisa: sisa < 0 ? 0 : sisa };
  } catch (e: any) {
    console.error('Error getQuotaAction:', e.message);
    return { total: 50, terisi: 0, sisa: 50 };
  }
}

// Action mendaftar PPDB baru
export async function submitPpdbRegistrationAction(prevState: any, formData: FormData) {
  const nama_unit = formData.get('nama_unit') as string;
  const tahun_ajaran = formData.get('tahun_ajaran') as string;
  const nama_anak = formData.get('nama_anak') as string;
  const nama_orang_tua = formData.get('nama_orang_tua') as string;
  const whatsapp = formData.get('whatsapp') as string;
  const alamat_rumah = formData.get('alamat_rumah') as string;
  const tanggal_lahir = formData.get('tanggal_lahir') as string;
  
  // Ambil file bukti bayar dari upload galeri
  const bukti_bayar_file = formData.get('bukti_bayar_file');
  
  // Format nomor WA dan buat link WhatsApp Orang Tua untuk disimpan di database
  const cleanWa = whatsapp.replace(/[^0-9]/g, '');
  const waText = encodeURIComponent(`Halo, ini Admin PPDB Royal Attin. Terkait pendaftaran anak Anda: ${nama_anak}. Mohon kirimkan berkas bukti transfer pendaftarannya di sini. Terima kasih.`);
  const bukti_bayar_url = `https://wa.me/${cleanWa}?text=${waText}`;

  try {
    // Susun isi pesan notifikasi ke Telegram dengan HTML parse mode
    const caption = `🔔 <b>PENDAFTARAN PPDB BARU</b> 🔔\n\n` +
      `👤 <b>Nama Anak:</b> ${nama_anak}\n` +
      `📅 <b>Tanggal Lahir:</b> ${tanggal_lahir}\n` +
      `👥 <b>Orang Tua/Wali:</b> ${nama_orang_tua}\n` +
      `📱 <b>WhatsApp:</b> ${whatsapp}\n` +
      `🏫 <b>Unit Sekolah:</b> ${nama_unit}\n` +
      `📅 <b>Tahun Ajaran:</b> ${tahun_ajaran}\n\n` +
      `📄 <i>Bukti transfer pendaftaran terlampir di bawah ini.</i>`;

    // Kirim berkas ke Telegram
    await sendFileToTelegram(bukti_bayar_file, caption, 2);
  } catch (err: any) {
    return { error: `Gagal mengirim data bukti transfer ke Telegram. Detail: ${err.message}` };
  }

  const validation = ppdbSchema.safeParse({
    nama_unit,
    tahun_ajaran,
    nama_anak,
    nama_orang_tua,
    whatsapp,
    alamat_rumah,
    bukti_bayar_url,
    tanggal_lahir
  });

  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const quotaModel = new QuotaModel();
    const quota = await quotaModel.getQuota(nama_unit, tahun_ajaran);
    if (quota.total - quota.terisi <= 0) {
      return { error: 'Pendaftaran gagal! Kuota pendaftaran untuk unit dan tahun ajaran tersebut sudah penuh.' };
    }

    const ppdbModel = new PpdbModel();
    const noPendaftaran = await ppdbModel.createRegistration({
      nama_unit,
      tahun_ajaran,
      nama_anak,
      nama_orang_tua,
      whatsapp,
      alamat_rumah,
      bukti_bayar_url,
      tanggal_lahir
    });

    // Kurangi kuota dengan menambah kuota terisi
    await quotaModel.incrementQuota(nama_unit, tahun_ajaran);

    revalidatePath('/dashboard');
    revalidatePath('/ppdb');

    return { success: true, noPendaftaran };
  } catch (e: any) {
    console.error('Error submitPpdbRegistrationAction:', e.message);
    return { error: 'Koneksi database bermasalah. Coba beberapa saat lagi.' };
  }
}

// Action mencari pendaftaran berdasarkan no pendaftaran atau WA
export async function searchPpdbAction(query: string) {
  if (!query || query.trim() === '') {
    return { error: 'Nomor pendaftaran atau No WA harus diisi' };
  }

  const cleanQuery = query.trim();
  try {
    const ppdbModel = new PpdbModel();
    if (cleanQuery.startsWith('REG-')) {
      const match = await ppdbModel.findByRegistrationNo(cleanQuery);
      return { success: true, data: match ? [match] : [] };
    } else {
      const matches = await ppdbModel.findByWhatsApp(cleanQuery);
      return { success: true, data: matches };
    }
  } catch (e: any) {
    console.error('Error searchPpdbAction:', e.message);
    return { error: 'Pencarian gagal. Periksa koneksi database.' };
  }
}

// Action memilih metode pembayaran (Cash / Angsuran) oleh Orang Tua
export async function selectPaymentMethodAction(id: string, metode: 'Cash' | 'Angsuran') {
  try {
    const ppdbModel = new PpdbModel();
    const raw = await ppdbModel.findBy('id', id);
    if (!raw) return { error: 'Pendaftaran tidak ditemukan.' };

    const today = new Date();
    
    // Hitung tanggal tenggat pembayaran
    const format = (d: Date) => d.toISOString().split('T')[0];
    const d1 = new Date(today); d1.setDate(today.getDate() + 7);
    const d2 = new Date(today); d2.setDate(today.getDate() + 30);
    const d3 = new Date(today); d3.setDate(today.getDate() + 60);

    const updated: any = {
      ...raw,
      metode_pembayaran: metode,
      status: metode === 'Cash' ? 'Menunggu Pembayaran Full Payment' : 'Menunggu Pembayaran Angsuran 1',
      tenggat_full_payment: metode === 'Cash' ? format(d1) : '',
      tenggat_angsuran_1: metode === 'Angsuran' ? format(d1) : '',
      tenggat_angsuran_2: metode === 'Angsuran' ? format(d2) : '',
      tenggat_angsuran_3: metode === 'Angsuran' ? format(d3) : '',
    };

    await ppdbModel.updateRegistration(Number(raw._rowNum), updated);
    revalidatePath('/ppdb');
    return { success: true };
  } catch (e: any) {
    console.error('Error selectPaymentMethodAction:', e.message);
    return { error: 'Gagal memperbarui metode pembayaran.' };
  }
}

// Action mengunggah bukti pembayaran angsuran / full payment oleh Orang Tua
export async function uploadQuotaPaymentProofAction(
  id: string,
  field: 'bukti_angsuran_1' | 'bukti_angsuran_2' | 'bukti_angsuran_3' | 'bukti_full_payment',
  formData: FormData
) {
  const file = formData.get('bukti_file');
  if (!file || typeof file !== 'object' || !('size' in file) || file.size === 0) {
    return { error: 'Berkas file bukti transfer wajib diunggah.' };
  }

  try {
    const ppdbModel = new PpdbModel();
    const raw = await ppdbModel.findBy('id', id);
    if (!raw) return { error: 'Pendaftaran tidak ditemukan.' };

    const whatsapp = raw.whatsapp || '';
    const nama_anak = raw.nama_anak || 'Siswa';
    const cleanWa = whatsapp.replace(/[^0-9]/g, '');
    const labelPembayaran = field.replace(/_/g, ' ').toUpperCase();
    
    // Buat link WA orang tua sebagai bukti pembayaran untuk database
    const waText = encodeURIComponent(`Halo, ini Admin PPDB Royal Attin. Terkait pembayaran ${labelPembayaran} an. ${nama_anak} (ID: ${id}). Mohon kirimkan berkas bukti transfernya di sini. Terima kasih.`);
    const url = `https://wa.me/${cleanWa}?text=${waText}`;

    // Susun isi pesan notifikasi ke Telegram dengan HTML parse mode
    const caption = `💰 <b>PEMBAYARAN ANGSURAN PPDB</b> 💰\n\n` +
      `🆔 <b>ID Pendaftaran:</b> ${id}\n` +
      `👤 <b>Nama Anak:</b> ${nama_anak}\n` +
      `👥 <b>Orang Tua/Wali:</b> ${raw.nama_orang_tua || '-'}\n` +
      `📱 <b>WhatsApp:</b> ${whatsapp}\n` +
      `💸 <b>Jenis Pembayaran:</b> ${labelPembayaran}\n` +
      `🏫 <b>Unit Sekolah:</b> ${raw.nama_unit || '-'}\n` +
      `📅 <b>Tahun Ajaran:</b> ${raw.tahun_ajaran || '-'}\n\n` +
      `📄 <i>Bukti transfer pembayaran terlampir di bawah ini.</i>`;

    // Kirim berkas ke Telegram
    await sendFileToTelegram(file, caption, 2);

    // Update status berdasarkan tahapan pembayaran yang diunggah
    let nextStatus = raw.status;
    if (field === 'bukti_angsuran_1') nextStatus = 'Menunggu Pembayaran Angsuran 2';
    else if (field === 'bukti_angsuran_2') nextStatus = 'Menunggu Pembayaran Angsuran 3';
    else if (field === 'bukti_angsuran_3') nextStatus = 'Menunggu Username & Password';
    else if (field === 'bukti_full_payment') nextStatus = 'Menunggu Username & Password';

    const updated: any = {
      ...raw,
      [field]: url,
      status: nextStatus
    };

    await ppdbModel.updateRegistration(Number(raw._rowNum), updated);
    revalidatePath('/ppdb');
    return { success: true };
  } catch (e: any) {
    console.error('Error uploadQuotaPaymentProofAction:', e.message);
    return { error: `Gagal mengirim bukti transfer ke Telegram. Detail: ${e.message}` };
  }
}

// Helper function to check if the user role is authorized to manage registrations for a specific unit
function isAuthorizedForPpdbUnit(userRole: string, namaUnit: string): boolean {
  if (userRole === 'admin' || userRole === 'yayasan') {
    return true;
  }
  const name = (namaUnit || '').toLowerCase();
  if (userRole === 'admin_kbtk') {
    return name.includes('kb') || name.includes('tk') || name.includes('taman main');
  }
  if (userRole === 'admin_sd') {
    return name.includes('sd') || name.includes('at-tin islamic') || name.includes('royal at-tin');
  }
  if (userRole === 'admin_nura') {
    return name === 'nura' || name.includes('nura');
  }
  return false;
}

// Action pembaruan status pendaftaran dari sisi Admin (Psikotes, Verifikasi, Akun Siswa)
export async function updatePpdbStatusByAdminAction(
  id: string,
  updates: {
    status?: any;
    tanggal_psikotest?: string;
    lokasi_psikotest?: string;
    hasil_psikotest?: 'LULUS' | 'TIDAK LULUS' | '';
    surat_penerimaan_url?: string;
    siswa_username?: string;
    siswa_password?: string;
  }
) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'yayasan', 'admin_kbtk', 'admin_sd', 'admin_nura'].includes(user.role)) {
    return { error: 'Anda tidak memiliki hak akses untuk tindakan ini.' };
  }

  try {
    const ppdbModel = new PpdbModel();
    const raw = await ppdbModel.findBy('id', id);
    if (!raw) return { error: 'Pendaftaran tidak ditemukan.' };

    if (!isAuthorizedForPpdbUnit(user.role, raw.nama_unit)) {
      return { error: 'Anda tidak memiliki hak akses untuk tindakan ini.' };
    }

    const updated: any = {
      ...raw,
      ...updates
    };

    // Auto-update status jika admin menginput hasil psikotes
    if (updates.hasil_psikotest) {
      updated.status = updates.hasil_psikotest === 'LULUS' ? 'Menunggu Metode Pembayaran' : 'Selesai & Tidak Lanjut';
    }

    // Auto-update status jika admin membuat akun portal siswa
    if (updates.siswa_username && updates.siswa_password) {
      updated.status = 'Selesai';
      
      try {
        const userModel = new UserModel();
        const existing = await userModel.findByUsername(updates.siswa_username);
        if (!existing) {
          const id = Math.random().toString(36).substring(2, 15);
          await userModel.create({
            id,
            username: updates.siswa_username,
            password: updates.siswa_password,
            role: 'orang_tua',
            name: raw.nama_orang_tua || 'Wali Murid Royal Attin'
          });
          console.log(`Auto-created User account for student portal: ${updates.siswa_username}`);
        }
      } catch (userErr: any) {
        console.error('Failed to auto-create user in Users sheet:', userErr.message);
      }
    }

    await ppdbModel.updateRegistration(Number(raw._rowNum), updated);
    revalidatePath('/dashboard');
    revalidatePath('/ppdb');
    return { success: true };
  } catch (e: any) {
    console.error('Error updatePpdbStatusByAdminAction:', e.message);
    return { error: 'Gagal memperbarui status pendaftaran.' };
  }
}

// Action Verifikasi Awal Pembayaran Pendaftaran (Halaman Verifikasi PPDB)
export async function verifyPpdbPaymentAction(id: string, isApprove: boolean) {
  const user = await getCurrentUser();
  if (!user || !['admin', 'yayasan', 'admin_kbtk', 'admin_sd', 'admin_nura'].includes(user.role)) {
    return { error: 'Anda tidak memiliki hak akses untuk tindakan ini.' };
  }

  try {
    const ppdbModel = new PpdbModel();
    const raw = await ppdbModel.findBy('id', id);
    if (!raw) return { error: 'Pendaftaran tidak ditemukan.' };

    if (!isAuthorizedForPpdbUnit(user.role, raw.nama_unit)) {
      return { error: 'Anda tidak memiliki hak akses untuk tindakan ini.' };
    }

    const updated: any = {
      ...raw,
      status: isApprove ? 'Terverifikasi' : 'Selesai & Tidak Lanjut'
    };

    await ppdbModel.updateRegistration(Number(raw._rowNum), updated);
    revalidatePath('/dashboard');
    revalidatePath('/ppdb');
    return { success: true };
  } catch (e: any) {
    console.error('Error verifyPpdbPaymentAction:', e.message);
    return { error: 'Gagal memproses verifikasi.' };
  }
}

// Action mengambil rincian biaya pendaftaran sekolah berdasarkan unit, tahun ajaran, dan metode bayar
export async function getSchoolFeesAction(unit: string, ta: string, metode: 'Cash' | 'Angsuran') {
  if (!unit || !ta || !metode) return null;
  try {
    const feesModel = new FeesModel();
    await feesModel.initFeesIfEmpty();
    const fee = await feesModel.getFee(unit, ta, metode);
    return fee;
  } catch (e: any) {
    console.error('Error getSchoolFeesAction:', e.message);
    return null;
  }
}

// Action sinkronisasi akun portal PPDB yang sudah selesai ke dalam database Users
export async function syncPpdbAccountsToUsersAction() {
  try {
    const ppdbModel = new PpdbModel();
    const userModel = new UserModel();
    
    const allRegs = await ppdbModel.getAll();
    const completedRegs = allRegs.filter(r => r.status === 'Selesai' && r.siswa_username && r.siswa_password);
    
    let count = 0;
    for (const reg of completedRegs) {
      const existing = await userModel.findByUsername(reg.siswa_username);
      if (!existing) {
        const id = reg.id || Math.random().toString(36).substring(2, 15);
        await userModel.create({
          id,
          username: reg.siswa_username,
          password: reg.siswa_password,
          role: 'orang_tua',
          name: reg.nama_orang_tua || 'Wali Murid Royal Attin'
        });
        count++;
        console.log(`Synced student portal account: ${reg.siswa_username}`);
      }
    }
    return { success: true, syncedCount: count };
  } catch (e: any) {
    console.error('Error syncPpdbAccountsToUsersAction:', e.message);
    return { error: e.message };
  }
}
