import { callSheetsAPI } from '@/lib/db/googleSheets';

export class BaseModel {
  protected sheetName: string;

  constructor(sheetName: string) {
    this.sheetName = sheetName;
  }

  // Menormalisasi header kolom menjadi snake_case
  protected canonicalHeader(h: string) {
    if (!h) return '';
    return String(h).trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/^_+|_+$/g, '');
  }

  // Memastikan sheet ada
  async ensureSheetExists(defaultHeaders: string[]): Promise<void> {
    try {
      await callSheetsAPI('ensureSheet', {
        sheetName: this.sheetName,
        headers: defaultHeaders,
      });
    } catch (e: any) {
      console.error(`Error ensureSheetExists for ${this.sheetName}:`, e.message);
      throw e;
    }
  }

  // Mengambil semua data dari sheet sebagai array of objects
  async getAll(): Promise<Record<string, string>[]> {
    try {
      const rows: string[][] = await callSheetsAPI('getAll', {
        sheetName: this.sheetName,
      });

      if (!rows || rows.length === 0) return [];

      const rawHeaders = rows[0];
      const headers = rawHeaders.map(h => this.canonicalHeader(h));

      const items: Record<string, string>[] = [];

      for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        const obj: Record<string, string> = {};
        let isEmpty = true;

        for (let c = 0; c < headers.length; c++) {
          const key = headers[c];
          if (!key) continue;
          obj[key] = r[c] !== undefined ? String(r[c]).trim() : '';
          if (obj[key] !== '') isEmpty = false;
        }

        if (!isEmpty) {
          obj._rowNum = String(i + 1); // Simpan nomor baris (1-based index)
          items.push(obj);
        }
      }

      return items;
    } catch (e: any) {
      console.error(`Error getAll for ${this.sheetName}:`, e.message);
      return [];
    }
  }

  // Mencari satu record berdasarkan kunci dan nilai
  async findBy(key: string, value: string): Promise<Record<string, string> | null> {
    const items = await this.getAll();
    const target = String(value).trim().toLowerCase();
    const found = items.find(item => String(item[key] || '').trim().toLowerCase() === target);
    return found || null;
  }

  // Memasukkan baris baru
  async insert(data: Record<string, any>, headersOrder: string[]): Promise<void> {
    const rowValues = headersOrder.map(h => {
      const key = this.canonicalHeader(h);
      return data[key] !== undefined ? String(data[key]) : '';
    });

    try {
      await callSheetsAPI('insert', {
        sheetName: this.sheetName,
        rowValues,
      });
    } catch (e: any) {
      console.error(`Error insert to ${this.sheetName}:`, e.message);
      throw e;
    }
  }

  // Mengubah data baris tertentu
  async update(rowNum: number, data: Record<string, any>, headersOrder: string[]): Promise<void> {
    const rowValues = headersOrder.map(h => {
      const key = this.canonicalHeader(h);
      return data[key] !== undefined ? String(data[key]) : '';
    });

    try {
      await callSheetsAPI('update', {
        sheetName: this.sheetName,
        rowNum,
        rowValues,
      });
    } catch (e: any) {
      console.error(`Error update at row ${rowNum} in ${this.sheetName}:`, e.message);
      throw e;
    }
  }
}
