import { BaseModel } from './baseModel';

export interface PPDBRegistration {
  id: string;
  no_pendaftaran: string;
  nama_unit: string;
  tahun_ajaran: string;
  nama_anak: string;
  nama_orang_tua: string;
  whatsapp: string;
  alamat_rumah: string;
  bukti_bayar_url: string;
  tanggal_lahir: string; // Tambahan kolom tanggal lahir anak
  
  // Status PPDB (Image 4 Flow)
  status: 
    | 'Menunggu Verifikasi'
    | 'Terverifikasi'
    | 'Menunggu Hasil Psikotest'
    | 'Menunggu Surat Penerimaan Sekolah'
    | 'Selesai & Tidak Lanjut'
    | 'Menunggu Metode Pembayaran'
    | 'Menunggu Pembayaran Angsuran 1'
    | 'Menunggu Pembayaran Angsuran 2'
    | 'Menunggu Pembayaran Angsuran 3'
    | 'Menunggu Pembayaran Full Payment'
    | 'Menunggu Username & Password'
    | 'Selesai';

  tanggal_psikotest: string;
  lokasi_psikotest: string;
  waktu_psikotest: string;
  catatan_psikotest: string;
  hasil_psikotest: 'LULUS' | 'TIDAK LULUS' | '';
  surat_penerimaan_url: string;
  
  metode_pembayaran: 'Cash' | 'Angsuran' | '';
  bukti_angsuran_1: string;
  tenggat_angsuran_1: string;
  bukti_angsuran_2: string;
  tenggat_angsuran_2: string;
  bukti_angsuran_3: string;
  tenggat_angsuran_3: string;
  bukti_full_payment: string;
  tenggat_full_payment: string;
  
  siswa_username: string;
  siswa_password: string;
  created_at: string;
  _rowNum?: string;
}

export class PpdbModel extends BaseModel {
  private static HEADERS = [
    'ID',
    'No Pendaftaran',
    'Tahun Ajaran',
    'Nama Anak',
    'Nama Orang Tua',
    'WhatsApp',
    'Status',
    'Bukti Bayar URL',
    'Created At',
    
    // Kolom tambahan baru untuk alur multi-tab & cicilan
    'Nama Unit',
    'Alamat Rumah',
    'Tanggal Psikotest',
    'Lokasi Psikotest',
    'Hasil Psikotest',
    'Surat Penerimaan URL',
    'Metode Pembayaran',
    'Bukti Angsuran 1',
    'Tenggat Angsuran 1',
    'Bukti Angsuran 2',
    'Tenggat Angsuran 2',
    'Bukti Angsuran 3',
    'Tenggat Angsuran 3',
    'Bukti Full Payment',
    'Tenggat Full Payment',
    'Siswa Username',
    'Siswa Password',
    'Tanggal Lahir',
    'Waktu Psikotest',
    'Catatan Psikotest'
  ];

  constructor() {
    super('PPDB');
  }

  // Membuat pendaftaran baru (Formulir Pendaftaran)
  async createRegistration(data: {
    nama_unit: string;
    tahun_ajaran: string;
    nama_anak: string;
    nama_orang_tua: string;
    whatsapp: string;
    alamat_rumah: string;
    bukti_bayar_url: string;
    tanggal_lahir: string;
  }): Promise<string> {
    await this.ensureSheetExists(PpdbModel.HEADERS);
    const all = await this.getAll();

    // Format Kode Unit (TK, SD, NURA, atau custom)
    let unitCode = 'SCH';
    const lowerUnit = (data.nama_unit || '').toLowerCase();
    if (lowerUnit.includes('tk') || lowerUnit.includes('kb') || lowerUnit.includes('taman main')) unitCode = 'TK';
    else if (lowerUnit.includes('sd') || lowerUnit.includes('at-tin islamic')) unitCode = 'SD';
    else if (lowerUnit.includes('nura')) unitCode = 'NURA';
    else {
      unitCode = data.nama_unit.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) || 'SCH';
    }

    // Format Tanggal (DDMMYYYY) & Waktu (HHmmss) dalam Zona Waktu Indonesia (WIB / Asia/Jakarta)
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const parts = formatter.formatToParts(now);
    const getPart = (type: string) => parts.find(p => p.type === type)?.value || '00';
    
    const day = getPart('day');
    const month = getPart('month');
    const year = getPart('year');
    const hour = getPart('hour');
    const minute = getPart('minute');
    const second = getPart('second');

    const dateStr = `${day}${month}${year}`;
    const timeStr = `${hour}${minute}${second}`;

    // Nomor Urut Registrasi (4 digit sequence)
    const count = all.length + 1;
    const serial = String(count).padStart(4, '0');

    // Format: Reg-{nama-unit}-{tgl/bulan/tahun}-{waktu jam-menit-detik}-{nomer urut registrasi}
    // Contoh: Reg-TK-04092026-234512-0001
    const noPendaftaran = `Reg-${unitCode}-${dateStr}-${timeStr}-${serial}`;

    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    
    const newReg = {
      id,
      no_pendaftaran: noPendaftaran,
      nama_unit: data.nama_unit,
      tahun_ajaran: data.tahun_ajaran,
      nama_anak: data.nama_anak.trim(),
      nama_orang_tua: data.nama_orang_tua.trim(),
      whatsapp: data.whatsapp.trim(),
      alamat_rumah: data.alamat_rumah.trim(),
      bukti_bayar_url: data.bukti_bayar_url.trim(),
      
      status: 'Menunggu Verifikasi',
      tanggal_psikotest: '',
      lokasi_psikotest: '',
      hasil_psikotest: '',
      surat_penerimaan_url: '',
      
      metode_pembayaran: '',
      bukti_angsuran_1: '',
      tenggat_angsuran_1: '',
      bukti_angsuran_2: '',
      tenggat_angsuran_2: '',
      bukti_angsuran_3: '',
      tenggat_angsuran_3: '',
      bukti_full_payment: '',
      tenggat_full_payment: '',
      
      siswa_username: '',
      siswa_password: '',
      tanggal_lahir: data.tanggal_lahir,
      waktu_psikotest: '',
      catatan_psikotest: '',
      created_at: new Date().toISOString(),
    };

    await this.insert(newReg, PpdbModel.HEADERS);
    return noPendaftaran;
  }

  // Mengubah data pendaftaran utuh (untuk pembaruan di status tracker atau admin panel)
  async updateRegistration(rowNum: number, data: PPDBRegistration): Promise<void> {
    await this.ensureSheetExists(PpdbModel.HEADERS);
    await this.update(rowNum, data, PpdbModel.HEADERS);
  }

  // Mencari pendaftaran berdasarkan Nomor Pendaftaran
  async findByRegistrationNo(noPendaftaran: string): Promise<PPDBRegistration | null> {
    const raw = await this.findBy('no_pendaftaran', noPendaftaran.trim());
    if (!raw) return null;
    return this.mapToObj(raw);
  }

  // Mencari daftar pendaftaran berdasarkan WhatsApp
  async findByWhatsApp(whatsapp: string): Promise<PPDBRegistration[]> {
    const all = await this.getAll();
    const cleanWa = whatsapp.trim();
    return all
      .filter(item => item.whatsapp === cleanWa)
      .map(item => this.mapToObj(item));
  }

  // Memastikan sheet PPDB ada tanpa memasukkan dummy data
  async initDummyRegistrantsIfEmpty(): Promise<void> {
    await this.ensureSheetExists(PpdbModel.HEADERS);
  }

  private mapToObj(raw: Record<string, string>): PPDBRegistration {
    return {
      id: raw.id,
      no_pendaftaran: raw.no_pendaftaran,
      nama_unit: raw.nama_unit,
      tahun_ajaran: raw.tahun_ajaran,
      nama_anak: raw.nama_anak,
      nama_orang_tua: raw.nama_orang_tua,
      whatsapp: raw.whatsapp,
      alamat_rumah: raw.alamat_rumah,
      bukti_bayar_url: raw.bukti_bayar_url,
      
      status: (raw.status || 'Menunggu Verifikasi') as any,
      tanggal_psikotest: raw.tanggal_psikotest || '',
      lokasi_psikotest: raw.lokasi_psikotest || '',
      waktu_psikotest: raw.waktu_psikotest || '',
      catatan_psikotest: raw.catatan_psikotest || '',
      hasil_psikotest: (raw.hasil_psikotest || '') as any,
      surat_penerimaan_url: raw.surat_penerimaan_url || '',
      
      metode_pembayaran: (raw.metode_pembayaran || '') as any,
      bukti_angsuran_1: raw.bukti_angsuran_1 || '',
      tenggat_angsuran_1: raw.tenggat_angsuran_1 || '',
      bukti_angsuran_2: raw.bukti_angsuran_2 || '',
      tenggat_angsuran_2: raw.tenggat_angsuran_2 || '',
      bukti_angsuran_3: raw.bukti_angsuran_3 || '',
      tenggat_angsuran_3: raw.tenggat_angsuran_3 || '',
      bukti_full_payment: raw.bukti_full_payment || '',
      tenggat_full_payment: raw.tenggat_full_payment || '',
      
      siswa_username: raw.siswa_username || '',
      siswa_password: raw.siswa_password || '',
      tanggal_lahir: raw.tanggal_lahir || '',
      created_at: raw.created_at,
      _rowNum: raw._rowNum
    };
  }
}
