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

  // Inisialisasi dummy data pendaftaran PPDB untuk keperluan pengujian instan
  async initDummyRegistrantsIfEmpty(): Promise<void> {
    await this.ensureSheetExists(PpdbModel.HEADERS);
    const all = await this.getAll();
    if (all.length === 0) {
      const dummies = [
        {
          id: 'dummy-1',
          no_pendaftaran: 'REG-TK-2026-0001',
          nama_unit: 'KB & TK Taman Main Royal At-Tin',
          tahun_ajaran: '2026/2027',
          nama_anak: 'Lionel Royal Attin',
          nama_orang_tua: 'Faik Bajsair',
          whatsapp: '6281234567890',
          alamat_rumah: 'Jalan Perumahan Vila Nusa Indah Raya, Bogor',
          bukti_bayar_url: '/dummy/bukti_transfer_formulir.svg',
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
          tanggal_lahir: '2020-08-15',
          created_at: new Date().toISOString()
        },
        {
          id: 'dummy-2',
          no_pendaftaran: 'REG-SD-2026-0002',
          nama_unit: 'SD Royal At-Tin Islamic School',
          tahun_ajaran: '2026/2027',
          nama_anak: 'Zhafran Royal Attin',
          nama_orang_tua: 'Faik Bajsair',
          whatsapp: '6281234567890',
          alamat_rumah: 'Jalan Perumahan Vila Nusa Indah Raya, Bogor',
          bukti_bayar_url: '/dummy/bukti_transfer_formulir.svg',
          status: 'Terverifikasi',
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
          tanggal_lahir: '2019-05-20',
          created_at: new Date().toISOString()
        },
        {
          id: 'dummy-3',
          no_pendaftaran: 'REG-TK-2026-0003',
          nama_unit: 'KB & TK Taman Main Royal At-Tin',
          tahun_ajaran: '2026/2027',
          nama_anak: 'Siti Aisyah',
          nama_orang_tua: 'Budi Utomo',
          whatsapp: '6281122334455',
          alamat_rumah: 'Jalan Taman Royal Blok B-3, Tangerang',
          bukti_bayar_url: '/dummy/bukti_transfer_formulir.svg',
          status: 'Menunggu Hasil Psikotest',
          tanggal_psikotest: '2026-08-15',
          lokasi_psikotest: 'Ruang Observasi Utama',
          waktu_psikotest: '08:00 - 10:00 WIB',
          catatan_psikotest: 'Harap hadir 15 menit sebelum jadwal dan membawa pensil 2B.',
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
          tanggal_lahir: '2020-02-14',
          created_at: new Date().toISOString()
        },
        {
          id: 'dummy-4',
          no_pendaftaran: 'REG-NURA-2026-0004',
          nama_unit: 'NURA',
          tahun_ajaran: '2026/2027',
          nama_anak: 'Muhammad Bilal',
          nama_orang_tua: 'Ahmad Subagyo',
          whatsapp: '6285566778899',
          alamat_rumah: 'Jalan Vila Nusa Indah Raya, Blok M-1, Bogor',
          bukti_bayar_url: '/dummy/bukti_transfer_formulir.svg',
          status: 'Menunggu Metode Pembayaran',
          tanggal_psikotest: '2026-08-10',
          lokasi_psikotest: 'Sentra Tahfidz Nura',
          hasil_psikotest: 'LULUS',
          surat_penerimaan_url: '/dummy/surat_penerimaan.html',
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
          tanggal_lahir: '2021-11-30',
          created_at: new Date().toISOString()
        },
        {
          id: 'dummy-5',
          no_pendaftaran: 'REG-SD-2026-0005',
          nama_unit: 'SD Royal At-Tin Islamic School',
          tahun_ajaran: '2026/2027',
          nama_anak: 'Khadijah Az-Zahra',
          nama_orang_tua: 'Muhammad Yusuf',
          whatsapp: '6289988776655',
          alamat_rumah: 'Jalan Royal At-Tin Blok C, Tangerang',
          bukti_bayar_url: '/dummy/bukti_transfer_formulir.svg',
          status: 'Selesai',
          tanggal_psikotest: '2026-08-05',
          lokasi_psikotest: 'Ruang Kelas 1A',
          waktu_psikotest: '08:00 - 10:00 WIB',
          catatan_psikotest: 'Harap hadir 10 menit sebelum jadwal.',
          hasil_psikotest: 'LULUS',
          surat_penerimaan_url: '/dummy/surat_penerimaan.html',
          metode_pembayaran: 'Cash',
          bukti_angsuran_1: '',
          tenggat_angsuran_1: '',
          bukti_angsuran_2: '',
          tenggat_angsuran_2: '',
          bukti_angsuran_3: '',
          tenggat_angsuran_3: '',
          bukti_full_payment: '/dummy/bukti_transfer_full.svg',
          tenggat_full_payment: new Date().toISOString().split('T')[0],
          siswa_username: 'khadijah_attin',
          siswa_password: 'securepassword123',
          tanggal_lahir: '2019-12-10',
          created_at: new Date().toISOString()
        }
      ];

      for (const d of dummies) {
        await this.insert(d, PpdbModel.HEADERS);
      }
      console.log('Sample PPDB registrations initialized successfully.');
    }
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
