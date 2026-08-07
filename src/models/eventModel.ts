import { BaseModel } from './baseModel';

export interface Event {
  id: string;
  nama_event: string;
  tanggal: string;
  deskripsi: string;
  kuota_total: number;
  kuota_terisi: number;
  created_at: string;
  _rowNum?: string;
}

export interface EventRegistrant {
  id: string;
  event_id: string;
  nama_event: string;
  nama_pendaftar: string;
  whatsapp: string;
  jumlah_tiket: number;
  created_at: string;
  _rowNum?: string;
}

export class EventModel extends BaseModel {
  private static EVENT_HEADERS = [
    'ID',
    'Nama Event',
    'Tanggal',
    'Deskripsi',
    'Kuota Total',
    'Kuota Terisi',
    'Created At'
  ];

  constructor() {
    super('Events');
  }

  // Mengambil daftar semua event
  async getEvents(): Promise<Event[]> {
    await this.ensureSheetExists(EventModel.EVENT_HEADERS);
    const rows = await this.getAll();
    return rows.map(r => ({
      id: r.id,
      nama_event: r.nama_event,
      tanggal: r.tanggal,
      deskripsi: r.deskripsi,
      kuota_total: Number(r.kuota_total || 0),
      kuota_terisi: Number(r.kuota_terisi || 0),
      created_at: r.created_at,
      _rowNum: r._rowNum
    }));
  }

  // Membuat event baru oleh Admin
  async createEvent(data: {
    nama_event: string;
    tanggal: string;
    deskripsi: string;
    kuota_total: number;
  }): Promise<void> {
    await this.ensureSheetExists(EventModel.EVENT_HEADERS);
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newEvent = {
      id,
      nama_event: data.nama_event.trim(),
      tanggal: data.tanggal,
      deskripsi: data.deskripsi.trim(),
      kuota_total: data.kuota_total,
      kuota_terisi: 0,
      created_at: new Date().toISOString()
    };
    await this.insert(newEvent, EventModel.EVENT_HEADERS);
  }

  // Melakukan booking tiket event
  async bookEvent(eventId: string, namaPendaftar: string, whatsapp: string, jumlahTiket: number): Promise<void> {
    await this.ensureSheetExists(EventModel.EVENT_HEADERS);
    const rawEvents = await this.getAll();
    const raw = rawEvents.find(e => e.id === eventId);
    if (!raw) throw new Error('Event tidak ditemukan.');

    const kuotaTotal = Number(raw.kuota_total || 0);
    const kuotaTerisi = Number(raw.kuota_terisi || 0);
    const sisa = kuotaTotal - kuotaTerisi;

    if (sisa < jumlahTiket) {
      throw new Error(`Kuota tidak mencukupi. Sisa tiket tersedia: ${sisa}`);
    }

    // 1. Update kuota terisi di sheet Events
    const updatedEvent = {
      ...raw,
      kuota_terisi: kuotaTerisi + jumlahTiket
    };
    await this.update(Number(raw._rowNum), updatedEvent, EventModel.EVENT_HEADERS);

    // 2. Catat pendaftar ke sheet EventRegistrants
    const registrantModel = new EventRegistrantModel();
    await registrantModel.addRegistrant({
      event_id: eventId,
      nama_event: raw.nama_event,
      nama_pendaftar: namaPendaftar,
      whatsapp,
      jumlah_tiket: jumlahTiket
    });
  }
}

export class EventRegistrantModel extends BaseModel {
  private static REGISTRANT_HEADERS = [
    'ID',
    'Event ID',
    'Nama Event',
    'Nama Pendaftar',
    'WhatsApp',
    'Jumlah Tiket',
    'Created At'
  ];

  constructor() {
    super('EventRegistrants');
  }

  // Mengambil data seluruh pendaftar event
  async getRegistrants(): Promise<EventRegistrant[]> {
    await this.ensureSheetExists(EventRegistrantModel.REGISTRANT_HEADERS);
    const rows = await this.getAll();
    return rows.map(r => ({
      id: r.id,
      event_id: r.event_id,
      nama_event: r.nama_event,
      nama_pendaftar: r.nama_pendaftar,
      whatsapp: r.whatsapp,
      jumlah_tiket: Number(r.jumlah_tiket || 0),
      created_at: r.created_at,
      _rowNum: r._rowNum
    }));
  }

  // Menambahkan pendaftar event baru
  async addRegistrant(data: {
    event_id: string;
    nama_event: string;
    nama_pendaftar: string;
    whatsapp: string;
    jumlah_tiket: number;
  }): Promise<void> {
    await this.ensureSheetExists(EventRegistrantModel.REGISTRANT_HEADERS);
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newReg = {
      id,
      event_id: data.event_id,
      nama_event: data.nama_event,
      nama_pendaftar: data.nama_pendaftar.trim(),
      whatsapp: data.whatsapp.trim(),
      jumlah_tiket: data.jumlah_tiket,
      created_at: new Date().toISOString()
    };
    await this.insert(newReg, EventRegistrantModel.REGISTRANT_HEADERS);
  }
}
