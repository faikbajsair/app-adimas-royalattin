'use server';

import { LandingSectionModel, LandingSectionItemModel } from '@/models/landingModel';
import { getCurrentUser } from './authActions';
import { revalidatePath } from 'next/cache';

// Helper function to check if the user is authorized (admin or yayasan)
async function checkAuth() {
  const user = await getCurrentUser();
  if (!user || !['admin', 'yayasan'].includes(user.role)) {
    throw new Error('Anda tidak memiliki hak akses untuk melakukan aksi ini.');
  }
  return user;
}

// 1. Update main configurations for a specific section
export async function updateSectionConfigAction(
  sectionId: string,
  data: {
    title?: string;
    subtitle?: string;
    status?: 'Active' | 'Inactive';
    order_index?: string;
    extra_data?: string;
  }
) {
  try {
    await checkAuth();

    const model = new LandingSectionModel();
    await model.updateSection(sectionId, data);

    revalidatePath('/'); // Clear landing page cache
    return { success: true };
  } catch (e: any) {
    console.error('Error updateSectionConfigAction:', e.message);
    return { error: e.message || 'Gagal menyimpan perubahan section.' };
  }
}

// 2. Reorder multiple sections at once
export async function reorderSectionsAction(
  orders: { id: string; order_index: string }[]
) {
  try {
    await checkAuth();

    const model = new LandingSectionModel();
    for (const item of orders) {
      await model.updateSection(item.id, { order_index: item.order_index });
    }

    revalidatePath('/'); // Clear landing page cache
    return { success: true };
  } catch (e: any) {
    console.error('Error reorderSectionsAction:', e.message);
    return { error: e.message || 'Gagal mengubah urutan section.' };
  }
}

// 3. Save (insert or update) an item under a specific section
export async function saveSectionItemAction(
  id: string,
  sectionId: string,
  data: {
    title: string;
    description: string;
    image_url?: string;
    badge?: string;
    link_url?: string;
    order_index?: string;
    extra_data?: string;
  }
) {
  try {
    await checkAuth();

    const model = new LandingSectionItemModel();
    await model.saveItem(id, sectionId, {
      title: data.title,
      description: data.description,
      image_url: data.image_url || '',
      badge: data.badge || '',
      link_url: data.link_url || '',
      order_index: data.order_index || '0',
      extra_data: data.extra_data || '',
    });

    revalidatePath('/'); // Clear landing page cache
    return { success: true };
  } catch (e: any) {
    console.error('Error saveSectionItemAction:', e.message);
    return { error: e.message || 'Gagal menyimpan item section.' };
  }
}

// 4. Delete an item under a section
export async function deleteSectionItemAction(id: string) {
  try {
    await checkAuth();

    const model = new LandingSectionItemModel();
    await model.deleteItem(id);

    revalidatePath('/'); // Clear landing page cache
    return { success: true };
  } catch (e: any) {
    console.error('Error deleteSectionItemAction:', e.message);
    return { error: e.message || 'Gagal menghapus item.' };
  }
}
