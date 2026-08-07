import { BaseModel } from './baseModel';
import { webcrypto } from 'crypto';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: 'admin' | 'admin_kbtk' | 'admin_sd' | 'admin_nura' | 'yayasan' | 'kepsek' | 'guru' | 'orang_tua' | 'pelamar';
  name: string;
  created_at: string;
  _rowNum?: string;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await webcrypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export class UserModel extends BaseModel {
  private static HEADERS = ['ID', 'Username', 'Password', 'Role', 'Name', 'Created At'];

  constructor() {
    super('Users');
  }

  // Membuat user baru beserta hash password
  async create(user: Omit<User, 'created_at'>): Promise<void> {
    const hashedPassword = await hashPassword(user.password || '');
    const newUser = {
      id: user.id,
      username: user.username.trim().toLowerCase(),
      password: hashedPassword,
      role: user.role,
      name: user.name,
      created_at: new Date().toISOString(),
    };

    await this.insert(newUser, UserModel.HEADERS);
  }

  // Mencari user berdasarkan username
  async findByUsername(username: string): Promise<User | null> {
    const raw = await this.findBy('username', username.trim().toLowerCase());
    if (!raw) return null;

    return {
      id: raw.id,
      username: raw.username,
      password: raw.password,
      role: raw.role as any,
      name: raw.name,
      created_at: raw.created_at,
      _rowNum: raw._rowNum,
    };
  }

  // Menginisialisasi default user jika belum ada data di spreadsheet
  async initAdminIfEmpty(): Promise<void> {
    await this.ensureSheetExists(UserModel.HEADERS);
    const allUsers = await this.getAll();

    // 1. Otorisasi Akun Admin Utama
    const hasAdmin = allUsers.some(u => u.username === 'admin');
    if (!hasAdmin) {
      await this.create({
        id: '1',
        username: 'admin',
        password: 'admin123_adimas',
        role: 'admin',
        name: 'Administrator Utama',
      });
      console.log('Default Admin created: username admin / password admin123_adimas');
    }

    // Otorisasi Akun Admin Unit KB-TK
    const hasAdminKbtk = allUsers.some(u => u.username === 'admin_kbtk');
    if (!hasAdminKbtk) {
      await this.create({
        id: 'admin-kbtk-id',
        username: 'admin_kbtk',
        password: 'kbtk123_adimas',
        role: 'admin_kbtk',
        name: 'Admin KB-TK Taman Main',
      });
      console.log('Default Admin KB-TK created: username admin_kbtk / password kbtk123_adimas');
    }

    // Otorisasi Akun Admin Unit SD
    const hasAdminSd = allUsers.some(u => u.username === 'admin_sd');
    if (!hasAdminSd) {
      await this.create({
        id: 'admin-sd-id',
        username: 'admin_sd',
        password: 'sd123_adimas',
        role: 'admin_sd',
        name: 'Admin SD Royal At-Tin',
      });
      console.log('Default Admin SD created: username admin_sd / password sd123_adimas');
    }

    // Otorisasi Akun Admin Unit NURA
    const hasAdminNura = allUsers.some(u => u.username === 'admin_nura');
    if (!hasAdminNura) {
      await this.create({
        id: 'admin-nura-id',
        username: 'admin_nura',
        password: 'nura123_adimas',
        role: 'admin_nura',
        name: 'Admin NURA Tahfidz Center',
      });
      console.log('Default Admin NURA created: username admin_nura / password nura123_adimas');
    }

    // Otorisasi Akun Pengurus Yayasan
    const hasYayasan = allUsers.some(u => u.username === 'yayasan');
    if (!hasYayasan) {
      await this.create({
        id: 'yayasan-id',
        username: 'yayasan',
        password: 'yayasan123_adimas',
        role: 'yayasan',
        name: 'Yayasan Royal Attin',
      });
      console.log('Default Yayasan created: username yayasan / password yayasan123_adimas');
    }

    // 2. Otorisasi Akun Guru Uji Coba
    const hasTeacher = allUsers.some(u => u.username === 'teacher');
    if (!hasTeacher) {
      await this.create({
        id: '2',
        username: 'teacher',
        password: 'teacher123_adimas',
        role: 'guru',
        name: 'Guru Wali Kelas A',
      });
      console.log('Default Teacher created: username teacher / password teacher123_adimas');
    }

    // 3. Otorisasi Akun Orang Tua Uji Coba
    const hasParent = allUsers.some(u => u.username === 'parent');
    if (!hasParent) {
      await this.create({
        id: '3',
        username: 'parent',
        password: 'parent123_adimas',
        role: 'orang_tua',
        name: 'Bunda Nur Fatin',
      });
      console.log('Default Parent created: username parent / password parent123_adimas');
    }
  }
}
