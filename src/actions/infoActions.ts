'use server';

import { SchoolInfoModel, SuggestionModel, SchoolInfo } from '@/models/infoModel';
import { getCurrentUser } from './authActions';
import { saveUploadedFile } from './ppdbActions';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';


const suggestionSchema = z.object({
  name: z.string().min(1, 'Nama harus diisi'),
  email: z.string().email('Format email tidak valid'),
  message: z.string().min(10, 'Saran/masukan minimal 10 karakter'),
});

// Action controller untuk submit form saran / masukan publik
export async function submitSuggestionAction(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const message = formData.get('message') as string;

  const validation = suggestionSchema.safeParse({ name, email, message });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const suggestionModel = new SuggestionModel();
    await suggestionModel.addSuggestion(name, email, message);
    return { success: true };
  } catch (e: any) {
    console.error('Error submitSuggestionAction:', e.message);
    return { error: 'Gagal mengirim masukan. Pastikan koneksi database aktif.' };
  }
}

// Action controller untuk memperbarui info sekolah (Hanya Admin / Yayasan)
export async function updateSchoolInfoAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'yayasan')) {
    return { error: 'Anda tidak memiliki hak akses untuk mengubah informasi ini.' };
  }

  const name = formData.get('name') as string;
  const tagline = formData.get('tagline') as string;
  const address = formData.get('address') as string;
  const maps_url = formData.get('maps_url') as string;
  const whatsapp_admin = formData.get('whatsapp_admin') as string;
  const youtube_url = formData.get('youtube_url') as string;
  const instagram_url = formData.get('instagram_url') as string;

  // File uploads
  const brochure_kbtk_file = formData.get('brochure_kbtk_file');
  const brochure_sd_file = formData.get('brochure_sd_file');
  const brochure_nura_file = formData.get('brochure_nura_file');

  const dataToUpdate: Partial<SchoolInfo> = {};
  if (name) dataToUpdate.name = name;
  if (tagline) dataToUpdate.tagline = tagline;
  if (address) dataToUpdate.address = address;
  if (maps_url) dataToUpdate.maps_url = maps_url;
  if (whatsapp_admin) dataToUpdate.whatsapp_admin = whatsapp_admin;
  if (youtube_url) dataToUpdate.youtube_url = youtube_url;
  if (instagram_url) dataToUpdate.instagram_url = instagram_url;

  try {
    if (brochure_kbtk_file) {
      const url = await saveUploadedFile(brochure_kbtk_file, 5); // Maks 5MB untuk brosur
      if (url) dataToUpdate.brochure_kbtk = url;
    }
    if (brochure_sd_file) {
      const url = await saveUploadedFile(brochure_sd_file, 5); // Maks 5MB untuk brosur
      if (url) dataToUpdate.brochure_sd = url;
    }
    if (brochure_nura_file) {
      const url = await saveUploadedFile(brochure_nura_file, 5); // Maks 5MB untuk brosur
      if (url) dataToUpdate.brochure_nura = url;
    }

    const infoModel = new SchoolInfoModel();
    await infoModel.updateInfo(dataToUpdate);
    
    // Clear caches for pages that read school info
    revalidatePath('/');
    revalidatePath('/ppdb');
    revalidatePath('/dashboard');
    
    return { success: true };
  } catch (e: any) {
    console.error('Error updateSchoolInfoAction:', e.message);
    return { error: e.message || 'Gagal mengupdate informasi sekolah.' };
  }
}

// Action mengambil info sekolah secara publik / client-side
export async function getSchoolInfoAction() {
  try {
    const infoModel = new SchoolInfoModel();
    const info = await infoModel.getInfo();
    return { success: true, info };
  } catch (e: any) {
    console.error('Error getSchoolInfoAction:', e.message);
    return { error: 'Gagal mengambil informasi sekolah.' };
  }
}
