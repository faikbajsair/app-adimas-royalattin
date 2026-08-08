import { BaseModel } from './baseModel';

export interface LandingSection {
  _rowNum?: string;
  id: string;
  name: string;
  title: string;
  subtitle: string;
  status: 'Active' | 'Inactive';
  order_index: string;
  extra_data: string; // JSON string for section-specific settings
}

export interface LandingSectionItem {
  _rowNum?: string;
  id: string;
  section_id: string;
  title: string;
  description: string;
  image_url: string;
  badge: string; // e.g. emoji like 🎨 or category like PARENTING
  link_url: string;
  order_index: string;
  extra_data: string; // JSON string for item-specific settings
}

export class LandingSectionModel extends BaseModel {
  public static HEADERS = ['ID', 'Name', 'Title', 'Subtitle', 'Status', 'Order Index', 'Extra Data'];

  constructor() {
    super('LandingSections');
  }

  async getSections(): Promise<LandingSection[]> {
    await this.ensureSheetExists(LandingSectionModel.HEADERS);
    const rows = await this.getAll();
    return rows.map(r => ({
      _rowNum: r._rowNum,
      id: r.id || '',
      name: r.name || '',
      title: r.title || '',
      subtitle: r.subtitle || '',
      status: (r.status === 'Inactive' ? 'Inactive' : 'Active') as 'Active' | 'Inactive',
      order_index: r.order_index || '0',
      extra_data: r.extra_data || '',
    }));
  }

  async updateSection(id: string, data: Partial<Omit<LandingSection, 'id'>>): Promise<void> {
    await this.ensureSheetExists(LandingSectionModel.HEADERS);
    const sections = await this.getSections();
    const existing = sections.find(s => s.id === id);

    if (existing) {
      const updated = {
        id,
        name: data.name !== undefined ? data.name : existing.name,
        title: data.title !== undefined ? data.title : existing.title,
        subtitle: data.subtitle !== undefined ? data.subtitle : existing.subtitle,
        status: data.status !== undefined ? data.status : existing.status,
        order_index: data.order_index !== undefined ? data.order_index : existing.order_index,
        extra_data: data.extra_data !== undefined ? data.extra_data : existing.extra_data,
      };
      await this.update(Number(existing._rowNum), updated, LandingSectionModel.HEADERS);
    } else {
      const newItem = {
        id,
        name: data.name || '',
        title: data.title || '',
        subtitle: data.subtitle || '',
        status: data.status || 'Active',
        order_index: data.order_index || '0',
        extra_data: data.extra_data || '',
      };
      await this.insert(newItem, LandingSectionModel.HEADERS);
    }
  }
}

export class LandingSectionItemModel extends BaseModel {
  public static HEADERS = [
    'ID',
    'Section ID',
    'Title',
    'Description',
    'Image URL',
    'Badge',
    'Link URL',
    'Order Index',
    'Extra Data'
  ];

  constructor() {
    super('LandingSectionItems');
  }

  async getItems(): Promise<LandingSectionItem[]> {
    await this.ensureSheetExists(LandingSectionItemModel.HEADERS);
    const rows = await this.getAll();
    return rows.map(r => ({
      _rowNum: r._rowNum,
      id: r.id || '',
      section_id: r.section_id || '',
      title: r.title || '',
      description: r.description || '',
      image_url: r.image_url || '',
      badge: r.badge || '',
      link_url: r.link_url || '',
      order_index: r.order_index || '0',
      extra_data: r.extra_data || '',
    }));
  }

  async getItemsBySection(sectionId: string): Promise<LandingSectionItem[]> {
    const items = await this.getItems();
    return items.filter(item => item.section_id === sectionId);
  }

  async saveItem(id: string, sectionId: string, data: Partial<Omit<LandingSectionItem, 'id' | 'section_id'>>): Promise<void> {
    await this.ensureSheetExists(LandingSectionItemModel.HEADERS);
    const items = await this.getItems();
    const existing = items.find(item => item.id === id);

    if (existing) {
      const updated = {
        id,
        section_id: sectionId,
        title: data.title !== undefined ? data.title : existing.title,
        description: data.description !== undefined ? data.description : existing.description,
        image_url: data.image_url !== undefined ? data.image_url : existing.image_url,
        badge: data.badge !== undefined ? data.badge : existing.badge,
        link_url: data.link_url !== undefined ? data.link_url : existing.link_url,
        order_index: data.order_index !== undefined ? data.order_index : existing.order_index,
        extra_data: data.extra_data !== undefined ? data.extra_data : existing.extra_data,
      };
      await this.update(Number(existing._rowNum), updated, LandingSectionItemModel.HEADERS);
    } else {
      const newItem = {
        id,
        section_id: sectionId,
        title: data.title || '',
        description: data.description || '',
        image_url: data.image_url || '',
        badge: data.badge || '',
        link_url: data.link_url || '',
        order_index: data.order_index || '0',
        extra_data: data.extra_data || '',
      };
      await this.insert(newItem, LandingSectionItemModel.HEADERS);
    }
  }

  async deleteItem(id: string): Promise<void> {
    await this.ensureSheetExists(LandingSectionItemModel.HEADERS);
    const items = await this.getItems();
    const existing = items.find(item => item.id === id);

    if (existing) {
      // Clear the row by writing empty values for all columns
      const cleared: Record<string, string> = {};
      LandingSectionItemModel.HEADERS.forEach(h => {
        const key = h.toLowerCase().replace(/\s+/g, '_');
        cleared[key] = '';
      });
      await this.update(Number(existing._rowNum), cleared, LandingSectionItemModel.HEADERS);
    }
  }
}

export async function seedDefaultLandingData(): Promise<void> {
  const sectionModel = new LandingSectionModel();
  const itemModel = new LandingSectionItemModel();

  const defaultSections: Omit<LandingSection, '_rowNum'>[] = [
    { id: 'hero', name: 'Hero Section', title: '', subtitle: '', status: 'Active', order_index: '1', extra_data: '' },
    { id: 'about', name: 'Tentang Sekolah', title: 'Tentang Sekolah Kami', subtitle: 'Yayasan Taman At-Tin menaungi unit-unit pendidikan berkualitas dengan kurikulum yang terintegrasi nilai-nilai Islam, sains, dan pembentukan karakter anak sejak usia dini.', status: 'Active', order_index: '2', extra_data: '' },
    { id: 'youtube', name: 'Channel Youtube', title: 'Dokumentasi Channel YouTube', subtitle: 'Lihat langsung cuplikan keseruan belajar, kegiatan luar ruangan, dan kajian edukasi melalui channel YouTube resmi kami.', status: 'Active', order_index: '3', extra_data: JSON.stringify({ video_url: 'https://www.youtube.com/embed?listType=user_uploads&list=tamanmainroyalat-tin7654', cta_title: 'Kunjungi & Subscribe Channel Kami', cta_desc: 'Ikuti video kajian keislaman, manasik haji cilik, market day, dan trial class siswa kami.' }) },
    { id: 'tech', name: 'Teknologi Pendidikan', title: 'Teknologi Pendidikan Modern', subtitle: 'Kami menggunakan sistem teknologi mutakhir guna mendukung kegiatan administrasi, laporan absensi siswa, dan transparansi raport akademik.', status: 'Active', order_index: '4', extra_data: '' },
    { id: 'tahfidz', name: 'Galeri Tahfidz & Quran', title: 'Galeri Tahfidz & Quran', subtitle: 'Dokumentasi proses hafalan Al-Qur\'an harian siswa dengan pembiasaan adab-adab keislaman.', status: 'Active', order_index: '5', extra_data: '' },
    { id: 'newsletter', name: 'Newsletter', title: 'Langganan Informasi & Tips Parenting', subtitle: 'Dapatkan berkala tips mendidik anak secara Islami, info webinar parenting, serta agenda event penting sekolah gratis.', status: 'Active', order_index: '6', extra_data: '' },
    { id: 'articles', name: 'Artikel Diniyah', title: 'Artikel Diniyah & Parenting', subtitle: 'Kumpulan tulisan ilmiah ringan seputar pendidikan anak dalam kacamata syariat Islam yang sholih.', status: 'Active', order_index: '7', extra_data: '' },
    { id: 'kajian', name: 'Informasi Kajian', title: 'Informasi Kajian Bulanan', subtitle: 'Ikuti majelis ilmu rutin bulanan sekolah yang membahas tema diniyah, keluarga sakinah, dan psikologi perkembangan anak.', status: 'Active', order_index: '8', extra_data: JSON.stringify({ kajian_title: 'Kajian Bulanan: "Membimbing Buah Hati di Era Digital Sesuai Syariat"', pemateri: 'Ustadz Syarif Hidayatullah, Lc., M.A.', tanggal: 'Sabtu, 22 Agustus 2026', waktu: '09.00 - 11.30 WIB', tempat: 'Aula Sekolah Royal At-Tin & Live Streaming YouTube' }) },
    { id: 'testimonials', name: 'Testimoni', title: 'Apa Kata Orang Tua Murid?', subtitle: 'Pengalaman nyata wali murid setelah menyekolahkan putra-putri mereka di sekolah Royal At-Tin.', status: 'Active', order_index: '9', extra_data: '' },
    { id: 'gallery', name: 'Galeri Kegiatan', title: 'Galeri Kegiatan Siswa', subtitle: 'Dokumentasi keceriaan belajar, olahraga sunnah, praktek ibadah, dan outing class para siswa.', status: 'Active', order_index: '10', extra_data: '' },
    { id: 'faq', name: 'Pertanyaan Umum (FAQ)', title: 'Pertanyaan yang Sering Diajukan (FAQ)', subtitle: 'Temukan jawaban cepat seputar proses pendaftaran PPDB, kurikulum diniyah, dan operasional sekolah kami.', status: 'Active', order_index: '11', extra_data: '' }
  ];

  const defaultItems = [
    // hero quick stats
    { id: 'hero-1', section_id: 'hero', title: '15 Kursi', description: 'Kuota KB-TK Tersisa', image_url: '', badge: '', link_url: '', order_index: '1', extra_data: '' },
    { id: 'hero-2', section_id: 'hero', title: '20 Kursi', description: 'Kuota SD Tersisa', image_url: '', badge: '', link_url: '', order_index: '2', extra_data: '' },
    { id: 'hero-3', section_id: 'hero', title: 'Aktif', description: 'Gelombang I Terbuka', image_url: '', badge: '', link_url: '', order_index: '3', extra_data: '' },
    // about unit cards
    { id: 'about-1', section_id: 'about', title: 'KB-TK Taman Main', description: 'Mengembangkan motorik kasar-halus, kemandirian sosial-emosional, serta pengenalan dasar Al-Qur\'an dalam lingkungan bermain yang ceria dan merangsang kreativitas anak.', image_url: '', badge: '🎨', link_url: '', order_index: '1', extra_data: '' },
    { id: 'about-2', section_id: 'about', title: 'SD Royal At-Tin', description: 'Mengintegrasikan kurikulum nasional K-Merdeka dengan penguatan adab Islam harian, pembiasaan ibadah sunnah, serta target penguasaan hafalan Al-Qur\'an secara terstruktur.', image_url: '', badge: '📚', link_url: '', order_index: '2', extra_data: '' },
    { id: 'about-3', section_id: 'about', title: 'NURA Tahfidz Center', description: 'Program intensif khusus tahfidz Quran dengan pengajar berpengalaman, melatih pelafalan makhroj huruf yang fasih, tajwid dasar, serta murojaah yang konsisten.', image_url: '', badge: '✨', link_url: '', order_index: '3', extra_data: '' },
    // tech cards
    { id: 'tech-1', section_id: 'tech', title: 'Database Real-Time Cloud', description: 'Mengintegrasikan sistem formulir dengan database Google Sheets secara transparan dan terenkripsi aman.', image_url: '', badge: '📊', link_url: '', order_index: '1', extra_data: '' },
    { id: 'tech-2', section_id: 'tech', title: 'Portal Wali Murid', description: 'Akses akun personal untuk orang tua guna memantau riwayat absen harian, tugas sekolah, dan pembayaran biaya PPDB.', image_url: '', badge: '📱', link_url: '', order_index: '2', extra_data: '' },
    { id: 'tech-3', section_id: 'tech', title: 'Notifikasi Otomatis', description: 'Laporan langsung terkait absensi kehadiran siswa yang terintegrasi dengan pengiriman pesan terprogram.', image_url: '', badge: '💬', link_url: '', order_index: '3', extra_data: '' },
    // tahfidz gallery
    { id: 'tahfidz-1', section_id: 'tahfidz', title: 'Ziyadah & Murojaah', description: 'Siswa menyetorkan hafalan harian baru secara face-to-face dengan Ustadz pendamping.', image_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=400&auto=format&fit=crop', badge: '', link_url: '', order_index: '1', extra_data: '' },
    { id: 'tahfidz-2', section_id: 'tahfidz', title: 'Pelajaran Adab & Doa', description: 'Selain menghafal, siswa dibekali dengan adab makan, tidur, berteman, serta doa-doa harian penting.', image_url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=400&auto=format&fit=crop', badge: '', link_url: '', order_index: '2', extra_data: '' },
    { id: 'tahfidz-3', section_id: 'tahfidz', title: 'Wisuda Tahfidz Juz 30', description: 'Apresiasi kelulusan setoran Juz 30 lengkap bagi siswa berprestasi yang siap lanjut ke Juz 29.', image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=400&auto=format&fit=crop', badge: '', link_url: '', order_index: '3', extra_data: '' },
    // articles
    { id: 'articles-1', section_id: 'articles', title: 'Membentuk Karakter Anak Sesuai Sunnah Nabi', description: 'Pentingnya melatih kemandirian dan kesabaran anak usia dini melalui teladan adab harian Rasulullah SAW.', image_url: '', badge: 'PARENTING', link_url: '', order_index: '1', extra_data: '' },
    { id: 'articles-2', section_id: 'articles', title: 'Menanamkan Tauhid Sejak Anak Belajar Bicara', description: 'Metode sederhana mengajarkan anak mengenal Allah sebagai Sang Pencipta melalui alam sekitar.', image_url: '', badge: 'AQIDAH', link_url: '', order_index: '2', extra_data: '' },
    { id: 'articles-3', section_id: 'articles', title: 'Mengajarkan Adab Sebelum Ilmu di Sekolah', description: 'Mengapa penanaman sopan santun, menghormati guru, dan adab belajar harus mendahului materi hafalan akademik.', image_url: '', badge: 'ADAB', link_url: '', order_index: '3', extra_data: '' },
    // testimonials
    { id: 'testi-1', section_id: 'testimonials', title: 'Bunda Fatimah', description: 'Alhamdulillah, perkembangan adab dan kemandirian Zhafran luar biasa setelah 6 bulan di KB-TK Taman Main. Hafalan dzikir pagi petang dan doa hariannya selalu dipraktikkan secara konsisten di rumah.', image_url: '', badge: 'Orang Tua Zhafran (KB-TK)', link_url: '', order_index: '1', extra_data: '' },
    { id: 'testi-2', section_id: 'testimonials', title: 'Abi Ibrahim', description: 'Sistem raport digital dan monitoring absensinya memudahkan kami memantau aktivitas belajar anak dari kantor. Kurikulum akademiknya sangat berimbang dengan penguatan akidah dan tahfidz.', image_url: '', badge: 'Orang Tua Lionel (SD Kelas 2)', link_url: '', order_index: '2', extra_data: '' },
    { id: 'testi-3', section_id: 'testimonials', title: 'Bunda Sarah', description: 'Anak saya sebelumnya sulit diajak menghafal, namun guru di NURA Tahfidz Center punya metode yang asyik sehingga anak justru antusias menyetor hafalan barunya setiap hari.', image_url: '', badge: 'Orang Tua Aisyah (NURA)', link_url: '', order_index: '3', extra_data: '' },
    // gallery activities
    { id: 'gal-1', section_id: 'gallery', title: 'Latihan Memanah', description: '', image_url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=400&auto=format&fit=crop', badge: '', link_url: '', order_index: '1', extra_data: '' },
    { id: 'gal-2', section_id: 'gallery', title: 'Interaksi Sosial & Bermain', description: '', image_url: 'https://images.unsplash.com/photo-1564419320461-6870880221ad?q=80&w=400&auto=format&fit=crop', badge: '', link_url: '', order_index: '2', extra_data: '' },
    { id: 'gal-3', section_id: 'gallery', title: 'Kreativitas Market Day', description: '', image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=400&auto=format&fit=crop', badge: '', link_url: '', order_index: '3', extra_data: '' },
    { id: 'gal-4', section_id: 'gallery', title: 'Praktek Manasik & Sholat', description: '', image_url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=400&auto=format&fit=crop', badge: '', link_url: '', order_index: '4', extra_data: '' },
    // faq
    { id: 'faq-1', section_id: 'faq', title: 'Kapan Pendaftaran PPDB TA 2026/2027 dibuka?', description: 'Pendaftaran PPDB Gelombang I telah dibuka resmi mulai Agustus 2026. Gelombang I akan ditutup otomatis apabila kuota kelas untuk KB-TK (15 orang) dan SD (20 orang) telah terisi penuh.', image_url: '', badge: '', link_url: '', order_index: '1', extra_data: '' },
    { id: 'faq-2', section_id: 'faq', title: 'Apakah ada fasilitas antar-jemput bagi siswa?', description: 'Ya, sekolah kami menyediakan jasa antar-jemput berlangganan dengan wilayah jangkauan meliputi area Gunung Putri, Vila Nusa Indah, Ciangsana, dan sekitarnya menggunakan armada ber-AC yang aman.', image_url: '', badge: '', link_url: '', order_index: '2', extra_data: '' },
    { id: 'faq-3', section_id: 'faq', title: 'Berapa target hafalan Al-Qur\'an untuk SD?', description: 'Untuk jenjang SD, kami menargetkan siswa minimal mampu menghafal 2 Juz (Juz 30 & 29) secara lancar (mutqin) dengan tajwid dasar yang benar pada saat kelulusan kelas 6.', image_url: '', badge: '', link_url: '', order_index: '3', extra_data: '' },
    { id: 'faq-4', section_id: 'faq', title: 'Bagaimana cara memantau kehadiran anak di sekolah?', description: 'Wali murid dapat login ke Portal Akademik kami untuk melihat rekap kehadiran absensi anak yang terupdate harian secara real-time dari guru kelas.', image_url: '', badge: '', link_url: '', order_index: '4', extra_data: '' }
  ];

  for (const s of defaultSections) {
    await sectionModel.updateSection(s.id, s);
  }

  for (const item of defaultItems) {
    await itemModel.saveItem(item.id, item.section_id, item);
  }
}
