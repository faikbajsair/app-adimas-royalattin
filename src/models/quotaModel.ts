import { BaseModel } from './baseModel';
import { PpdbModel } from './ppdbModel';


export interface QuotaConfig {
  id: string;
  nama_unit: string;
  tahun_ajaran: string;
  kuota_total: number;
  kuota_terisi: number;
  _rowNum?: string;
}

export class QuotaModel extends BaseModel {
  private static HEADERS = ['ID', 'Nama Unit', 'Tahun Ajaran', 'Kuota Total', 'Kuota Terisi'];

  constructor() {
    super('Quotas');
  }

  // Mengambil informasi kuota untuk unit & tahun ajaran tertentu
  async getQuota(unit: string, ta: string): Promise<{ total: number; terisi: number }> {
    await this.ensureSheetExists(QuotaModel.HEADERS);
    const all = await this.getAll();
    const match = all.find(
      q => q.nama_unit?.trim().toLowerCase() === unit.trim().toLowerCase() &&
           q.tahun_ajaran?.trim() === ta.trim()
    );

    // Hitung kuota terisi secara otomatis dari database pendaftaran PPDB
    let terisi = 0;
    try {
      const ppdbModel = new PpdbModel();
      const allRegs = (await ppdbModel.getAll()) as any[];
      terisi = allRegs.filter(
        r => r.nama_unit?.trim().toLowerCase() === unit.trim().toLowerCase() &&
             r.tahun_ajaran?.trim() === ta.trim() &&
             r.status !== 'Selesai & Tidak Lanjut'
      ).length;
    } catch (err) {
      console.error('Error counting dynamic quota:', err);
      terisi = match ? Number(match.kuota_terisi || 0) : 0;
    }

    const isTa2027 = (ta || '').includes('2027');
    const uLower = (unit || '').toLowerCase();
    const defaultTotal = isTa2027
      ? (uLower.includes('nura') ? 30 : 32)
      : (uLower.includes('nura') ? 30 : 32);

    const total = match ? Number(match.kuota_total || defaultTotal) : defaultTotal;

    return {
      total,
      terisi
    };
  }

  // Menambah kuota terisi sebesar 1
  async incrementQuota(unit: string, ta: string): Promise<void> {
    await this.ensureSheetExists(QuotaModel.HEADERS);
    const all = await this.getAll();
    const match = all.find(
      q => q.nama_unit?.trim().toLowerCase() === unit.trim().toLowerCase() &&
           q.tahun_ajaran?.trim() === ta.trim()
    );

    if (match) {
      const updated = {
        ...match,
        kuota_terisi: String(Number(match.kuota_terisi || 0) + 1)
      };
      await this.update(Number(match._rowNum), updated, QuotaModel.HEADERS);
    } else {
      // Jika tidak di-config sebelumnya, masukkan baris baru
      const isTa2027 = (ta || '').includes('2027');
      const uLower = (unit || '').toLowerCase();
      const defaultTotal = isTa2027 ? (uLower.includes('nura') ? '30' : '32') : '32';
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await this.insert({
        id,
        nama_unit: unit.trim(),
        tahun_ajaran: ta.trim(),
        kuota_total: defaultTotal,
        kuota_terisi: '1'
      }, QuotaModel.HEADERS);
    }
  }

  // Inisialisasi default quotas untuk pengujian
  async initQuotasIfEmpty(): Promise<void> {
    await this.ensureSheetExists(QuotaModel.HEADERS);
    const all = await this.getAll();
    if (all.length === 0) {
      const units = [
        'KB & TK Taman Main Royal At-Tin',
        'SD Royal At-Tin Islamic School',
        'NURA'
      ];
      const tas = ['2026/2027', '2027/2028'];
      
      let idCounter = 1;
      for (const u of units) {
        for (const ta of tas) {
          const uLower = u.toLowerCase();
          const total = uLower.includes('nura') ? 30 : 32;
          const terisi = 0;

          await this.insert({
            id: String(idCounter++),
            nama_unit: u,
            tahun_ajaran: ta,
            kuota_total: String(total),
            kuota_terisi: String(terisi)
          }, QuotaModel.HEADERS);
        }
      }
      console.log('Sample Quotas successfully initialized.');
    }
  }
}
