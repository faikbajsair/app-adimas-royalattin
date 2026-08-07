import { BaseModel } from './baseModel';

export interface Child {
  id: string;
  nama_anak: string;
  orang_tua_id: string;
  nama_orang_tua: string;
  kelas: string;
  tanggal_lahir: string;
  created_at: string;
  _rowNum?: string;
}

export class ChildModel extends BaseModel {
  private static HEADERS = [
    'ID',
    'Nama Anak',
    'Orang Tua ID',
    'Nama Orang Tua',
    'Kelas',
    'Tanggal Lahir',
    'Created At'
  ];

  constructor() {
    super('Children');
  }

  // Menambahkan anak baru
  async createChild(data: {
    nama_anak: string;
    orang_tua_id: string;
    nama_orang_tua: string;
    kelas: string;
    tanggal_lahir: string;
  }): Promise<void> {
    await this.ensureSheetExists(ChildModel.HEADERS);
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newChild = {
      id,
      nama_anak: data.nama_anak.trim(),
      orang_tua_id: data.orang_tua_id,
      nama_orang_tua: data.nama_orang_tua.trim(),
      kelas: data.kelas,
      tanggal_lahir: data.tanggal_lahir,
      created_at: new Date().toISOString()
    };
    await this.insert(newChild, ChildModel.HEADERS);
  }

  // Mengambil anak berdasarkan ID Orang Tua
  async getChildrenByParentId(parentId: string): Promise<Child[]> {
    await this.ensureSheetExists(ChildModel.HEADERS);
    const all = await this.getAll();
    return all
      .filter(item => item.orang_tua_id === parentId)
      .map(item => this.mapToObj(item));
  }

  // Mengambil anak berdasarkan Kelas (untuk Guru/Kepsek)
  async getChildrenByClass(className: string): Promise<Child[]> {
    await this.ensureSheetExists(ChildModel.HEADERS);
    const all = await this.getAll();
    return all
      .filter(item => item.kelas.toLowerCase() === className.toLowerCase().trim())
      .map(item => this.mapToObj(item));
  }

  // Mengambil satu profil anak berdasarkan ID
  async getChildById(id: string): Promise<Child | null> {
    const raw = await this.findBy('id', id);
    if (!raw) return null;
    return this.mapToObj(raw);
  }

  // Memastikan sample data anak ada untuk testing awal
  async initSampleChildrenIfEmpty(parentUserId: string, parentName: string): Promise<void> {
    await this.ensureSheetExists(ChildModel.HEADERS);
    const all = await this.getAll();
    if (all.length === 0) {
      await this.createChild({
        nama_anak: 'Lionel Royal Attin',
        orang_tua_id: parentUserId,
        nama_orang_tua: parentName,
        kelas: 'Kelas A',
        tanggal_lahir: '2021-05-12'
      });
      await this.createChild({
        nama_anak: 'Zhafran Royal Attin',
        orang_tua_id: parentUserId,
        nama_orang_tua: parentName,
        kelas: 'Kelas A',
        tanggal_lahir: '2022-09-22'
      });
      console.log('Sample children initialized for testing.');
    }
  }

  private mapToObj(raw: Record<string, string>): Child {
    return {
      id: raw.id,
      nama_anak: raw.nama_anak,
      orang_tua_id: raw.orang_tua_id,
      nama_orang_tua: raw.nama_orang_tua,
      kelas: raw.kelas,
      tanggal_lahir: raw.tanggal_lahir,
      created_at: raw.created_at,
      _rowNum: raw._rowNum
    };
  }
}
