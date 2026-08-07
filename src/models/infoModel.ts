import { BaseModel } from './baseModel';

export interface SchoolInfo {
  name: string;
  sub_name: string;
  address: string;
  tagline: string;
  logo_url: string;
  youtube_url: string;
  instagram_url: string;
  whatsapp_admin: string;
  maps_url: string;
}

export class SchoolInfoModel extends BaseModel {
  private static HEADERS = ['Key', 'Value'];

  constructor() {
    super('SchoolInfo');
  }

  // Mengambil informasi sekolah
  async getInfo(): Promise<SchoolInfo> {
    await this.ensureSheetExists(SchoolInfoModel.HEADERS);
    const rows = await this.getAll();
    
    // Nilai default jika database masih kosong
    const info: Record<string, string> = {
      name: 'KB-TK ADIMAS',
      sub_name: 'Islamic Character School',
      address: 'Jalan Vila Nusa Indah Raya, Blok M-1, Gunung Putri, Bogor',
      tagline: 'Membentuk Generasi Karakter Islami yang Cerdas & Berakhlak Mulia',
      logo_url: 'https://images.unsplash.com/photo-1594608661623-aa0bd3a69d28?q=80&w=200&auto=format&fit=crop',
      youtube_url: 'https://youtube.com',
      instagram_url: 'https://instagram.com',
      whatsapp_admin: '6281234567890',
      maps_url: 'https://maps.google.com'
    };

    rows.forEach(r => {
      if (r.key) {
        info[r.key] = r.value || '';
      }
    });

    return info as unknown as SchoolInfo;
  }

  // Mengupdate informasi sekolah
  async updateInfo(info: Partial<SchoolInfo>): Promise<void> {
    await this.ensureSheetExists(SchoolInfoModel.HEADERS);
    const rows = await this.getAll();

    for (const [key, value] of Object.entries(info)) {
      const existing = rows.find(r => r.key === key);
      if (existing) {
        await this.update(Number(existing._rowNum), { key, value }, SchoolInfoModel.HEADERS);
      } else {
        await this.insert({ key, value }, SchoolInfoModel.HEADERS);
      }
    }
  }
}

export interface Suggestion {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export class SuggestionModel extends BaseModel {
  private static HEADERS = ['ID', 'Name', 'Email', 'Message', 'Created At'];

  constructor() {
    super('Suggestions');
  }

  // Menambahkan saran / masukan baru dari publik
  async addSuggestion(name: string, email: string, message: string): Promise<void> {
    const data = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
      name,
      email,
      message,
      created_at: new Date().toISOString()
    };
    await this.insert(data, SuggestionModel.HEADERS);
  }
}
