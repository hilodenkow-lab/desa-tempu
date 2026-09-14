export type StatusPembinaan = 'Selesai' | 'Proses' | 'Perlu Perbaikan';

export type TingkatUrgensi = 'Rendah' | 'Sedang' | 'Tinggi';

export interface Desa {
  id: string;
  nama: string;
  kodePUM?: string;
  kepalaDesa: string;
  sekretarisDesa: string;
  kaurKeuangan: string;
  bpdKetua?: string;
  kontak: string;
  jarakKm: number;
  aksesTransportasi: 'Jalur Darat (Aspal/Padat)' | 'Jalur Darat (Tanah/Offroad)' | 'Jalur Air / Sungai' | 'Kombinasi Darat & Air';
  zonaWilayah: 'Tempunak Hulu' | 'Tempunak Tengah' | 'Tempunak Kapuas / Pesisir';
  catatanKhusus?: string;
}

export interface PembinaanRecord {
  id: string;
  desaId: string;
  namaDesa: string;
  tanggal: string; // YYYY-MM-DD
  materi: string; // Topik / Bidang Pembinaan
  petugas: string; // Tim Pembina Kecamatan
  hasil: string; // Ringkasan Temuan & Evaluasi
  tindakLanjut: string; // Rekomendasi & Tindak Lanjut yang harus dikerjakan
  tenggatWaktu?: string; // YYYY-MM-DD
  status: StatusPembinaan;
  tingkatUrgensi: TingkatUrgensi;
  linkDokumen?: string;
  catatanAparatDesa?: string;
  syncedToGoogleSheet?: boolean;
  googleSheetRowIndex?: number;
  createdAt: string;
  updatedAt: string;
}

export interface JadwalKunjungan {
  id: string;
  desaId: string;
  namaDesa: string;
  tanggal: string; // YYYY-MM-DD
  waktuMulai: string; // HH:mm
  waktuSelesai: string; // HH:mm
  timPembina: string; // Nama Tim & Petugas
  agenda: string; // Fokus Agenda Pembinaan
  lokasi: string;
  status: 'Terjadwal' | 'Selesai' | 'Ditunda' | 'Dibatalkan';
  catatanPersiapan?: string;
  googleCalendarEventId?: string;
  syncedToGoogleCalendar?: boolean;
  linkedPembinaanId?: string;
  createdAt: string;
}

export interface GoogleUserProfile {
  email: string;
  name: string;
  picture?: string;
}

export interface GoogleSyncConfig {
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  sheetName: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

export type ViewTab = 'dashboard' | 'form' | 'rekap-desa' | 'jadwal' | 'settings';

export interface FilterOptions {
  searchQuery: string;
  status: 'Semua' | StatusPembinaan;
  desaId: string;
  materi: string;
  petugas: string;
  urgensi: 'Semua' | TingkatUrgensi;
  startDate: string;
  endDate: string;
}
