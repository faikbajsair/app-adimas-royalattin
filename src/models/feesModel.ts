import { BaseModel } from './baseModel';

export interface FeeConfig {
  id: string;
  nama_unit: string;
  tahun_ajaran: string;
  metode_pembayaran: 'Cash' | 'Angsuran';
  uang_pendaftaran?: number;
  uang_pangkal: number;
  sarpras?: number;
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
    'Uang Pendaftaran',
    'Uang Pangkal',
    'Sarpras',
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
    const uLower = (unit || '').trim().toLowerCase();
    const mLower = (metode || '').trim().toLowerCase();
    const tClean = (ta || '').trim();

    // Matching exact or fuzzy unit name
    const match = all.find(f => {
      const fUnit = (f.nama_unit || '').trim().toLowerCase();
      const fMetode = (f.metode_pembayaran || '').trim().toLowerCase();
      const fTa = (f.tahun_ajaran || '').trim();

      const taMatch = fTa === tClean;
      const metodeMatch = fMetode === mLower;
      const unitMatch = fUnit === uLower || 
        (uLower.includes('sd') && fUnit.includes('sd')) ||
        (uLower.includes('nura') && fUnit.includes('nura')) ||
        ((uLower.includes('kb') || uLower.includes('tk') || uLower.includes('taman main')) && (fUnit.includes('kb') || fUnit.includes('tk') || fUnit.includes('taman main')));

      return taMatch && metodeMatch && unitMatch;
    });

    if (!match) return null;

    return {
      id: match.id,
      nama_unit: match.nama_unit,
      tahun_ajaran: match.tahun_ajaran,
      metode_pembayaran: match.metode_pembayaran as any,
      uang_pendaftaran: Number(match.uang_pendaftaran || 0),
      uang_pangkal: Number(match.uang_pangkal || 0),
      sarpras: Number(match.sarpras || 0),
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
        // ================= T.A 2027/2028 (Harga Baru Sesuai Brosur Resmi) =================
        // 1. KB & TK (Kelompok Bermain / Taman Kanak-Kanak) - KB-A & KB-B
        {
          id: '1',
          nama_unit: 'KB & TK Taman Main Royal At-Tin',
          tahun_ajaran: '2027/2028',
          metode_pembayaran: 'Cash',
          uang_pendaftaran: '1000000',
          uang_pangkal: '23000000',
          sarpras: '4500000',
          spp_juli: '1600000',
          uang_buku: '0',
          uang_seragam: '1850000',
          diskon: '2000000',
          total: '31950000'
        },
        {
          id: '2',
          nama_unit: 'KB & TK Taman Main Royal At-Tin',
          tahun_ajaran: '2027/2028',
          metode_pembayaran: 'Angsuran',
          uang_pendaftaran: '1000000',
          uang_pangkal: '25000000',
          sarpras: '4500000',
          spp_juli: '1600000',
          uang_buku: '0',
          uang_seragam: '1850000',
          diskon: '0',
          total: '33950000'
        },
        // 2. SD Royal At-Tin Islamic School (2027/2028)
        {
          id: '3',
          nama_unit: 'SD Royal At-Tin Islamic School',
          tahun_ajaran: '2027/2028',
          metode_pembayaran: 'Cash',
          uang_pendaftaran: '1200000',
          uang_pangkal: '33000000',
          sarpras: '6500000',
          spp_juli: '1850000',
          uang_buku: '0',
          uang_seragam: '2300000',
          diskon: '2000000',
          total: '44850000'
        },
        {
          id: '4',
          nama_unit: 'SD Royal At-Tin Islamic School',
          tahun_ajaran: '2027/2028',
          metode_pembayaran: 'Angsuran',
          uang_pendaftaran: '1200000',
          uang_pangkal: '35000000',
          sarpras: '6500000',
          spp_juli: '1850000',
          uang_buku: '0',
          uang_seragam: '2300000',
          diskon: '0',
          total: '46850000'
        },
        // 3. NURA Tahfidz Center (2027/2028)
        {
          id: '5',
          nama_unit: 'NURA',
          tahun_ajaran: '2027/2028',
          metode_pembayaran: 'Cash',
          uang_pendaftaran: '0',
          uang_pangkal: '0',
          sarpras: '0',
          spp_juli: '0',
          uang_buku: '0',
          uang_seragam: '0',
          diskon: '0',
          total: '0'
        },
        {
          id: '6',
          nama_unit: 'NURA',
          tahun_ajaran: '2027/2028',
          metode_pembayaran: 'Angsuran',
          uang_pendaftaran: '0',
          uang_pangkal: '0',
          sarpras: '0',
          spp_juli: '0',
          uang_buku: '0',
          uang_seragam: '0',
          diskon: '0',
          total: '0'
        },

        // ================= T.A 2026/2027 (Harga Resmi Sesuai Brosur) =================
        {
          id: '7',
          nama_unit: 'KB & TK Taman Main Royal At-Tin',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Cash',
          uang_pendaftaran: '850000',
          uang_pangkal: '19500000',
          sarpras: '4000000',
          spp_juli: '1450000',
          uang_buku: '0',
          uang_seragam: '1700000',
          diskon: '0',
          total: '27500000'
        },
        {
          id: '8',
          nama_unit: 'KB & TK Taman Main Royal At-Tin',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Angsuran',
          uang_pendaftaran: '850000',
          uang_pangkal: '19500000',
          sarpras: '4000000',
          spp_juli: '1450000',
          uang_buku: '0',
          uang_seragam: '1700000',
          diskon: '0',
          total: '27500000'
        },
        {
          id: '9',
          nama_unit: 'SD Royal At-Tin Islamic School',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Cash',
          uang_pendaftaran: '900000',
          uang_pangkal: '25000000',
          sarpras: '5500000',
          spp_juli: '1700000',
          uang_buku: '0',
          uang_seragam: '2200000',
          diskon: '0',
          total: '35300000'
        },
        {
          id: '10',
          nama_unit: 'SD Royal At-Tin Islamic School',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Angsuran',
          uang_pendaftaran: '900000',
          uang_pangkal: '25000000',
          sarpras: '5500000',
          spp_juli: '1700000',
          uang_buku: '0',
          uang_seragam: '2200000',
          diskon: '0',
          total: '35300000'
        },
        {
          id: '11',
          nama_unit: 'NURA',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Cash',
          uang_pendaftaran: '0',
          uang_pangkal: '0',
          sarpras: '0',
          spp_juli: '0',
          uang_buku: '0',
          uang_seragam: '0',
          diskon: '0',
          total: '0'
        },
        {
          id: '12',
          nama_unit: 'NURA',
          tahun_ajaran: '2026/2027',
          metode_pembayaran: 'Angsuran',
          uang_pendaftaran: '0',
          uang_pangkal: '0',
          sarpras: '0',
          spp_juli: '0',
          uang_buku: '0',
          uang_seragam: '0',
          diskon: '0',
          total: '0'
        }
      ];

      for (const fee of sampleFees) {
        await this.insert(fee, FeesModel.HEADERS);
      }
      console.log('Sample school fees configurations successfully initialized.');
    }
  }
}
