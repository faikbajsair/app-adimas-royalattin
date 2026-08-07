import { BaseModel } from './baseModel';

export interface Attendance {
  id: string;
  anak_id: string;
  nama_anak: string;
  tanggal: string; // YYYY-MM-DD
  status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
  keterangan: string;
  nama_penjemput: string;
  relasi_penjemput: string;
  created_at: string;
  _rowNum?: string;
}

export class AttendanceModel extends BaseModel {
  private static HEADERS = [
    'ID',
    'Anak ID',
    'Nama Anak',
    'Tanggal',
    'Status',
    'Keterangan',
    'Nama Penjemput',
    'Relasi Penjemput',
    'Created At'
  ];

  constructor() {
    super('Attendance');
  }

  // Mencatat kehadiran murid
  async recordAttendance(data: {
    anak_id: string;
    nama_anak: string;
    tanggal: string;
    status: 'Hadir' | 'Izin' | 'Sakit' | 'Alpa';
    keterangan: string;
    nama_penjemput?: string;
    relasi_penjemput?: string;
  }): Promise<void> {
    await this.ensureSheetExists(AttendanceModel.HEADERS);
    
    // Cari apakah sudah ada data absensi untuk anak & tanggal yang sama. Jika ada, lakukan update.
    const all = await this.getAll();
    const existing = all.find(item => item.anak_id === data.anak_id && item.tanggal === data.tanggal);

    const id = existing?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
    const attData = {
      id,
      anak_id: data.anak_id,
      nama_anak: data.nama_anak,
      tanggal: data.tanggal,
      status: data.status,
      keterangan: data.keterangan.trim(),
      nama_penjemput: (data.nama_penjemput || '').trim(),
      relasi_penjemput: (data.relasi_penjemput || '').trim(),
      created_at: existing?.created_at || new Date().toISOString()
    };

    if (existing) {
      await this.update(Number(existing._rowNum), attData, AttendanceModel.HEADERS);
    } else {
      await this.insert(attData, AttendanceModel.HEADERS);
    }
  }

  // Mengambil histori absensi anak berdasarkan ID Anak
  async getAttendanceByChildId(childId: string): Promise<Attendance[]> {
    await this.ensureSheetExists(AttendanceModel.HEADERS);
    const all = await this.getAll();
    return all
      .filter(item => item.anak_id === childId)
      .map(item => this.mapToObj(item));
  }

  // Mengambil daftar absensi per tanggal (untuk guru)
  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    await this.ensureSheetExists(AttendanceModel.HEADERS);
    const all = await this.getAll();
    return all
      .filter(item => item.tanggal === date)
      .map(item => this.mapToObj(item));
  }

  private mapToObj(raw: Record<string, string>): Attendance {
    return {
      id: raw.id,
      anak_id: raw.anak_id,
      nama_anak: raw.nama_anak,
      tanggal: raw.tanggal,
      status: raw.status as any,
      keterangan: raw.keterangan,
      nama_penjemput: raw.nama_penjemput,
      relasi_penjemput: raw.relasi_penjemput,
      created_at: raw.created_at,
      _rowNum: raw._rowNum
    };
  }
}
