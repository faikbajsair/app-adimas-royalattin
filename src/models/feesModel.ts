import { BaseModel } from './baseModel';

export interface FeeConfig {
  id: string;
  nama_unit: string;
  tahun_ajaran: string;
  metode_pembayaran: 'Cash' | 'Angsuran';
  uang_pangkal: number;
  spp_juli: number;
  uang_buku: number;
  uang_seragam: number;
  diskon: number;
  total: number;
  _rowNum?: string;
}

export class FeesModel extends BaseModel {
  private static HEADERS = [
    'ID',
    'Nama Unit',
    'Tahun Ajaran',
    'Metode Pembayaran',
    'Uang Pangkal',
    'SPP Juli',
    'Uang Buku',
    'Uang Seragam',
    'Diskon',
    'Total'
  ];

  constructor() {
    super('Fees');
  }

  // Mengambil konfigurasi biaya berdasarkan kriteria unit, tahun ajaran, dan metode bayar
  async getFee(unit: string, ta: string, metode: 'Cash' | 'Angsuran'): Promise<FeeConfig | null> {
    await this.ensureSheetExists(FeesModel.HEADERS);
    const all = await this.getAll();
    const match = all.find(
      f => f.nama_unit?.trim().toLowerCase() === unit.trim().toLowerCase() &&
           f.tahun_ajaran?.trim() === ta.trim() &&
           f.metode_pembayaran?.trim().toLowerCase() === metode.trim().toLowerCase()
    );

    if (!match) return null;

    return {
      id: match.id,
      nama_unit: match.nama_unit,
      tahun_ajaran: match.tahun_ajaran,
      metode_pembayaran: match.metode_pembayaran as any,
      uang_pangkal: Number(match.uang_pangkal || 0),
      spp_juli: Number(match.spp_juli || 0),
      uang_buku: Number(match.uang_buku || 0),
      uang_seragam: Number(match.uang_seragam || 0),
      diskon: Number(match.diskon || 0),
      total: Number(match.total || 0),
      _rowNum: match._rowNum
    };
  }

  // Inisialisasi default fees untuk testing
  async initFeesIfEmpty(): Promise<void> {
    await this.ensureSheetExists(FeesModel.HEADERS);
    const all = await this.getAll();
    if (all.length === 0) {
      const sampleFees = [
        {
          id: '1',
          nama_unit: 'KB & TK Taman Main Royal At-Tin',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Cash',
          uang_pangkal: '5000000',
          spp_juli: '500000',
          uang_buku: '400000',
          uang_seragam: '300000',
          diskon: '500000',
          total: '5700000'
        },
        {
          id: '2',
          nama_unit: 'KB & TK Taman Main Royal At-Tin',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Angsuran',
          uang_pangkal: '5000000',
          spp_juli: '500000',
          uang_buku: '400000',
          uang_seragam: '300000',
          diskon: '0',
          total: '6200000'
        },
        {
          id: '3',
          nama_unit: 'SD Royal At-Tin Islamic School',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Cash',
          uang_pangkal: '8000000',
          spp_juli: '800000',
          uang_buku: '600000',
          uang_seragam: '400000',
          diskon: '800000',
          total: '9000000'
        },
        {
          id: '4',
          nama_unit: 'SD Royal At-Tin Islamic School',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Angsuran',
          uang_pangkal: '8000000',
          spp_juli: '800000',
          uang_buku: '600000',
          uang_seragam: '400000',
          diskon: '0',
          total: '9800000'
        },
        {
          id: '5',
          nama_unit: 'NURA',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Cash',
          uang_pangkal: '4000000',
          spp_juli: '400000',
          uang_buku: '300000',
          uang_seragam: '200000',
          diskon: '400000',
          total: '4500000'
        },
        {
          id: '6',
          nama_unit: 'NURA',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Angsuran',
          uang_pangkal: '4000000',
          spp_juli: '400000',
          uang_buku: '300000',
          uang_seragam: '200000',
          diskon: '0',
          total: '4900000'
        }
      ];

      for (const fee of sampleFees) {
        await this.insert(fee, FeesModel.HEADERS);
      }
      console.log('Sample school fees configurations successfully initialized.');
    }
  }
}
