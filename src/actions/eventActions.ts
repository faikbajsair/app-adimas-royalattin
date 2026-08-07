'use server';

import { EventModel } from '@/models/eventModel';
import { getCurrentUser } from './authActions';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const eventSchema = z.object({
  nama_event: z.string().min(3, 'Nama event minimal 3 karakter'),
  tanggal: z.string().min(1, 'Tanggal event harus ditentukan'),
  deskripsi: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  kuota_total: z.number().min(1, 'Kuota minimal 1 tiket'),
});

const bookingSchema = z.object({
  event_id: z.string().min(1, 'Event ID tidak valid'),
  nama_pendaftar: z.string().min(2, 'Nama pendaftar minimal 2 karakter'),
  whatsapp: z.string().min(8, 'Nomor WhatsApp minimal 8 digit').regex(/^628[0-9]+$/, 'Format WA harus diawali 628xxx'),
  jumlah_tiket: z.number().min(1, 'Jumlah tiket minimal 1').max(5, 'Maksimal booking 5 tiket per orang'),
});

// Action untuk membuat event baru (Hanya Admin / Yayasan)
export async function createEventAction(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'yayasan')) {
    return { error: 'Anda tidak memiliki hak akses untuk tindakan ini.' };
  }

  const nama_event = formData.get('nama_event') as string;
  const tanggal = formData.get('tanggal') as string;
  const deskripsi = formData.get('deskripsi') as string;
  const kuota_total = Number(formData.get('kuota_total') || 0);

  const validation = eventSchema.safeParse({ nama_event, tanggal, deskripsi, kuota_total });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const eventModel = new EventModel();
    await eventModel.createEvent({ nama_event, tanggal, deskripsi, kuota_total });
    revalidatePath('/events');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (e: any) {
    console.error('Error createEventAction:', e.message);
    return { error: 'Gagal membuat event baru.' };
  }
}

// Action untuk booking tiket event oleh publik
export async function bookEventAction(prevState: any, formData: FormData) {
  const event_id = formData.get('event_id') as string;
  const nama_pendaftar = formData.get('nama_pendaftar') as string;
  const whatsapp = formData.get('whatsapp') as string;
  const jumlah_tiket = Number(formData.get('jumlah_tiket') || 0);

  const validation = bookingSchema.safeParse({ event_id, nama_pendaftar, whatsapp, jumlah_tiket });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const eventModel = new EventModel();
    await eventModel.bookEvent(event_id, nama_pendaftar, whatsapp, jumlah_tiket);
    revalidatePath('/events');
    return { success: true };
  } catch (e: any) {
    console.error('Error bookEventAction:', e.message);
    return { error: e.message || 'Gagal melakukan pendaftaran event.' };
  }
}
