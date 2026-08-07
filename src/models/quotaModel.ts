import { BaseModel } from './baseModel';

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

    if (!match) {
      // Jika belum di-config, default 50
      return { total: 50, terisi: 0 };
    }

    return {
      total: Number(match.kuota_total || 0),
      terisi: Number(match.kuota_terisi || 0)
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
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
      await this.insert({
        id,
        nama_unit: unit.trim(),
        tahun_ajaran: ta.trim(),
        kuota_total: '50',
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
          // Setting salah satu kuota menjadi penuh (0 sisa) untuk testing
          let total = 40;
          let terisi = 10;
          
          if (u === 'SD Royal At-Tin Islamic School' && ta === '2027/2028') {
            total = 50;
            terisi = 50; // Sisa 0!
          } else if (u === 'NURA' && ta === '2026/2027') {
            total = 30;
            terisi = 29; // Sisa 1!
          }

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
