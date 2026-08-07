'use server';

import { cookies } from 'next/headers';
import { UserModel, hashPassword, User } from '@/models/userModel';
import { createSessionToken, verifySessionToken } from '@/lib/auth';
import { z } from 'zod';

const loginSchema = z.object({
  username: z.string().min(1, 'Username harus diisi'),
  password: z.string().min(1, 'Password harus diisi'),
});

// Action controller untuk memproses login
export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  const validation = loginSchema.safeParse({ username, password });
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  try {
    const userModel = new UserModel();
    
    // Inisialisasi default admin jika database masih kosong
    await userModel.initAdminIfEmpty();

    const user = await userModel.findByUsername(username);
    if (!user) {
      return { error: 'Username atau password salah' };
    }

    const hashedInput = await hashPassword(password);
    if (user.password !== hashedInput) {
      return { error: 'Username atau password salah' };
    }

    // Membuat payload sesi
    const sessionPayload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    };

    const token = await createSessionToken(sessionPayload);

    // Menyimpan session token di httpOnly cookie demi keamanan (mencegah XSS)
    cookies().set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 Jam
      path: '/',
    });

    return { success: true, role: user.role };
  } catch (e: any) {
    console.error('Error loginAction:', e.message);
    return { error: 'Koneksi ke database bermasalah. Silakan cek kredensial Google API.' };
  }
}

// Action controller untuk logout
export async function logoutAction() {
  cookies().set('session_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/',
  });
  return { success: true };
}

// Mengambil user aktif dari session token
export async function getCurrentUser(): Promise<Omit<User, 'password'> | null> {
  const token = cookies().get('session_token')?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  return {
    id: payload.id,
    username: payload.username,
    name: payload.name,
    role: payload.role,
    created_at: '',
  };
}
