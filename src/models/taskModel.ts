import { BaseModel } from './baseModel';

export interface Task {
  id: string;
  judul_tugas: string;
  deskripsi: string;
  deadline: string;
  penerima_kelas: string;
  created_at: string;
  _rowNum?: string;
}

export interface Submission {
  id: string;
  tugas_id: string;
  anak_id: string;
  nama_anak: string;
  jawaban_text: string;
  file_url: string;
  nilai: string;
  catatan_guru: string;
  created_at: string;
  _rowNum?: string;
}

export class TaskModel extends BaseModel {
  private static HEADERS = [
    'ID',
    'Judul Tugas',
    'Deskripsi',
    'Deadline',
    'Penerima Kelas',
    'Created At'
  ];

  constructor() {
    super('Tasks');
  }

  // Mengambil daftar tugas berdasarkan target kelas
  async getTasksByClass(className: string): Promise<Task[]> {
    await this.ensureSheetExists(TaskModel.HEADERS);
    const all = await this.getAll();
    return all
      .filter(item => item.penerima_kelas.toLowerCase() === className.toLowerCase().trim())
      .map(item => this.mapToObj(item));
  }

  // Membuat tugas baru oleh Guru
  async createNewTask(data: {
    judul_tugas: string;
    deskripsi: string;
    deadline: string;
    penerima_kelas: string;
  }): Promise<void> {
    await this.ensureSheetExists(TaskModel.HEADERS);
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    const newTask = {
      id,
      judul_tugas: data.judul_tugas.trim(),
      deskripsi: data.deskripsi.trim(),
      deadline: data.deadline,
      penerima_kelas: data.penerima_kelas,
      created_at: new Date().toISOString()
    };
    await this.insert(newTask, TaskModel.HEADERS);
  }

  private mapToObj(raw: Record<string, string>): Task {
    return {
      id: raw.id,
      judul_tugas: raw.judul_tugas,
      deskripsi: raw.deskripsi,
      deadline: raw.deadline,
      penerima_kelas: raw.penerima_kelas,
      created_at: raw.created_at,
      _rowNum: raw._rowNum
    };
  }
}

export class SubmissionModel extends BaseModel {
  private static HEADERS = [
    'ID',
    'Tugas ID',
    'Anak ID',
    'Nama Anak',
    'Jawaban Text',
    'File URL',
    'Nilai',
    'Catatan Guru',
    'Created At'
  ];

  constructor() {
    super('Submissions');
  }

  // Mengambil semua pengumpulan untuk satu tugas tertentu (untuk dinilai Guru)
  async getSubmissionsByTaskId(taskId: string): Promise<Submission[]> {
    await this.ensureSheetExists(SubmissionModel.HEADERS);
    const all = await this.getAll();
    return all
      .filter(item => item.tugas_id === taskId)
      .map(item => this.mapToObj(item));
  }

  // Mengambil semua pengumpulan tugas oleh satu anak tertentu (untuk dipantau orang tua)
  async getSubmissionsByChild(childId: string): Promise<Submission[]> {
    await this.ensureSheetExists(SubmissionModel.HEADERS);
    const all = await this.getAll();
    return all
      .filter(item => item.anak_id === childId)
      .map(item => this.mapToObj(item));
  }

  // Mengirim/mengumpulkan tugas oleh Orang Tua
  async submitAssignment(data: {
    tugas_id: string;
    anak_id: string;
    nama_anak: string;
    jawaban_text: string;
    file_url: string;
  }): Promise<void> {
    await this.ensureSheetExists(SubmissionModel.HEADERS);
    const all = await this.getAll();
    
    // Cek apakah anak ini sudah pernah mengumpulkan tugas ini sebelumnya. Jika ya, lakukan update/revisi.
    const existing = all.find(item => item.tugas_id === data.tugas_id && item.anak_id === data.anak_id);

    const id = existing?.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15));
    const subData = {
      id,
      tugas_id: data.tugas_id,
      anak_id: data.anak_id,
      nama_anak: data.nama_anak,
      jawaban_text: data.jawaban_text.trim(),
      file_url: data.file_url.trim(),
      nilai: existing?.nilai || '', // Pertahankan nilai lama jika hanya revisi
      catatan_guru: existing?.catatan_guru || '',
      created_at: existing?.created_at || new Date().toISOString()
    };

    if (existing) {
      await this.update(Number(existing._rowNum), subData, SubmissionModel.HEADERS);
    } else {
      await this.insert(subData, SubmissionModel.HEADERS);
    }
  }

  // Memberikan nilai dan catatan masukan oleh Guru
  async gradeSubmission(submissionId: string, score: number, comment: string): Promise<void> {
    const raw = await this.findBy('id', submissionId);
    if (!raw) throw new Error('Data pengumpulan tugas tidak ditemukan.');

    const updatedData = {
      ...raw,
      nilai: String(score),
      catatan_guru: comment.trim()
    };

    await this.update(Number(raw._rowNum), updatedData, SubmissionModel.HEADERS);
  }

  private mapToObj(raw: Record<string, string>): Submission {
    return {
      id: raw.id,
      tugas_id: raw.tugas_id,
      anak_id: raw.anak_id,
      nama_anak: raw.nama_anak,
      jawaban_text: raw.jawaban_text,
      file_url: raw.file_url,
      nilai: raw.nilai,
      catatan_guru: raw.catatan_guru,
      created_at: raw.created_at,
      _rowNum: raw._rowNum
    };
  }
}
