import { Desa, PembinaanRecord, JadwalKunjungan } from '../types';
import { DAFTAR_26_DESA_TEMPUNAK, INITIAL_PEMBINAAN_RECORDS, INITIAL_JADWAL_KUNJUNGAN } from '../data/desaTempunak';
import { googleAuth } from './googleAuth';
import { GoogleSheetsService } from './googleSheets';
import { GoogleCalendarService } from './googleCalendar';

const STORAGE_KEYS = {
  DESA: 'bina_desa_list_v1',
  PEMBINAAN: 'bina_desa_pembinaan_v1',
  JADWAL: 'bina_desa_jadwal_v1'
};

type StateListener = () => void;

class StorageService {
  private desaList: Desa[] = [];
  private pembinaanList: PembinaanRecord[] = [];
  private jadwalList: JadwalKunjungan[] = [];
  private listeners: StateListener[] = [];
  private isSyncingSheets: boolean = false;
  private isSyncingCalendar: boolean = false;

  constructor() {
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    try {
      const savedDesa = localStorage.getItem(STORAGE_KEYS.DESA);
      this.desaList = savedDesa ? JSON.parse(savedDesa) : DAFTAR_26_DESA_TEMPUNAK;

      const savedPembinaan = localStorage.getItem(STORAGE_KEYS.PEMBINAAN);
      this.pembinaanList = savedPembinaan ? JSON.parse(savedPembinaan) : INITIAL_PEMBINAAN_RECORDS;

      const savedJadwal = localStorage.getItem(STORAGE_KEYS.JADWAL);
      this.jadwalList = savedJadwal ? JSON.parse(savedJadwal) : INITIAL_JADWAL_KUNJUNGAN;
    } catch (e) {
      console.warn('Error reading from localStorage:', e);
      this.desaList = DAFTAR_26_DESA_TEMPUNAK;
      this.pembinaanList = INITIAL_PEMBINAAN_RECORDS;
      this.jadwalList = INITIAL_JADWAL_KUNJUNGAN;
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.DESA, JSON.stringify(this.desaList));
      localStorage.setItem(STORAGE_KEYS.PEMBINAAN, JSON.stringify(this.pembinaanList));
      localStorage.setItem(STORAGE_KEYS.JADWAL, JSON.stringify(this.jadwalList));
    } catch (e) {
      console.warn('Error saving to localStorage:', e);
    }
    this.notify();
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // --- GETTERS ---
  public getDesaList(): Desa[] {
    return [...this.desaList];
  }

  public getDesaById(id: string): Desa | undefined {
    return this.desaList.find(d => d.id === id || d.nama.toLowerCase() === id.toLowerCase());
  }

  public getPembinaanList(): PembinaanRecord[] {
    return [...this.pembinaanList].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public getPembinaanById(id: string): PembinaanRecord | undefined {
    return this.pembinaanList.find(p => p.id === id);
  }

  public getPembinaanByDesa(desaIdOrName: string): PembinaanRecord[] {
    return this.pembinaanList
      .filter(p => p.desaId === desaIdOrName || p.namaDesa.toLowerCase() === desaIdOrName.toLowerCase())
      .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
  }

  public getJadwalList(): JadwalKunjungan[] {
    return [...this.jadwalList].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());
  }

  public getJadwal(): JadwalKunjungan[] {
    return this.getJadwalList();
  }

  public getSyncState() {
    return {
      isSyncingSheets: this.isSyncingSheets,
      isSyncingCalendar: this.isSyncingCalendar
    };
  }

  // --- PEMBINAAN OPERATIONS ---
  public async addPembinaan(record: Omit<PembinaanRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PembinaanRecord> {
    const id = `pemb-${Date.now()}`;
    const now = new Date().toISOString();
    const newRecord: PembinaanRecord = {
      ...record,
      id,
      createdAt: now,
      updatedAt: now,
      syncedToGoogleSheet: false
    };

    this.pembinaanList = [newRecord, ...this.pembinaanList];
    this.persist();

    // Background sync to Google Sheet if authenticated
    const token = googleAuth.getAccessToken();
    if (token) {
      this.syncRecordToGoogleSheet(newRecord, token).catch(err => {
        console.warn('Google Sheet background sync failed:', err);
      });
    }

    return newRecord;
  }

  public async updatePembinaan(id: string, updates: Partial<PembinaanRecord>): Promise<PembinaanRecord | null> {
    const idx = this.pembinaanList.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const updated: PembinaanRecord = {
      ...this.pembinaanList[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.pembinaanList[idx] = updated;
    this.persist();

    // Trigger background sync to Google Sheet if authenticated
    const token = googleAuth.getAccessToken();
    if (token) {
      this.syncAllToGoogleSheets().catch(err => console.warn('Full sync error:', err));
    }

    return updated;
  }

  public async deletePembinaan(id: string): Promise<boolean> {
    const idx = this.pembinaanList.findIndex(p => p.id === id);
    if (idx === -1) return false;

    this.pembinaanList = this.pembinaanList.filter(p => p.id !== id);
    this.persist();

    const token = googleAuth.getAccessToken();
    if (token) {
      this.syncAllToGoogleSheets().catch(err => console.warn('Sync after delete error:', err));
    }

    return true;
  }

  private async syncRecordToGoogleSheet(record: PembinaanRecord, token: string) {
    try {
      this.isSyncingSheets = true;
      this.notify();
      await GoogleSheetsService.appendRecord(token, record);
      
      // Update local record as synced
      const idx = this.pembinaanList.findIndex(p => p.id === record.id);
      if (idx !== -1) {
        this.pembinaanList[idx].syncedToGoogleSheet = true;
        this.persist();
      }
    } catch (e) {
      console.warn('Failed to append row to Google Sheet:', e);
    } finally {
      this.isSyncingSheets = false;
      this.notify();
    }
  }

  public async syncAllToGoogleSheets(): Promise<{ count: number }> {
    const token = googleAuth.getAccessToken();
    if (!token) throw new Error('Silakan masuk dengan akun Google terlebih dahulu.');

    try {
      this.isSyncingSheets = true;
      this.notify();

      await GoogleSheetsService.syncAllRecords(token, this.pembinaanList);

      // Mark all local records as synced
      this.pembinaanList = this.pembinaanList.map(p => ({ ...p, syncedToGoogleSheet: true }));
      this.persist();

      return { count: this.pembinaanList.length };
    } finally {
      this.isSyncingSheets = false;
      this.notify();
    }
  }

  public async importFromGoogleSheets(): Promise<number> {
    const token = googleAuth.getAccessToken();
    if (!token) throw new Error('Silakan masuk dengan akun Google terlebih dahulu.');

    try {
      this.isSyncingSheets = true;
      this.notify();

      const remoteRecords = await GoogleSheetsService.fetchRecords(token);
      if (remoteRecords.length > 0) {
        // Merge records: remote updates existing or adds new
        const map = new Map<string, PembinaanRecord>();
        this.pembinaanList.forEach(p => map.set(p.id, p));
        remoteRecords.forEach(r => map.set(r.id, r));

        this.pembinaanList = Array.from(map.values()).sort(
          (a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
        );
        this.persist();
      }
      return remoteRecords.length;
    } finally {
      this.isSyncingSheets = false;
      this.notify();
    }
  }

  // --- JADWAL KUNJUNGAN OPERATIONS ---
  public async addJadwal(jadwal: Omit<JadwalKunjungan, 'id' | 'createdAt'>): Promise<JadwalKunjungan> {
    const id = `jdw-${Date.now()}`;
    const newJadwal: JadwalKunjungan = {
      ...jadwal,
      id,
      createdAt: new Date().toISOString(),
      syncedToGoogleCalendar: false
    };

    this.jadwalList = [newJadwal, ...this.jadwalList];
    this.persist();

    // Background push to Google Calendar if authenticated
    const token = googleAuth.getAccessToken();
    if (token) {
      this.syncJadwalToCalendar(newJadwal, token).catch(e => {
        console.warn('Google Calendar sync failed:', e);
      });
    }

    return newJadwal;
  }

  public async updateJadwal(id: string, updates: Partial<JadwalKunjungan>): Promise<JadwalKunjungan | null> {
    const idx = this.jadwalList.findIndex(j => j.id === id);
    if (idx === -1) return null;

    const updated: JadwalKunjungan = {
      ...this.jadwalList[idx],
      ...updates
    };

    this.jadwalList[idx] = updated;
    this.persist();

    const token = googleAuth.getAccessToken();
    if (token && updated.googleCalendarEventId) {
      GoogleCalendarService.updateCalendarEvent(token, updated.googleCalendarEventId, updated).catch(e =>
        console.warn('Update Google Calendar failed:', e)
      );
    }

    return updated;
  }

  public async deleteJadwal(id: string): Promise<boolean> {
    const item = this.jadwalList.find(j => j.id === id);
    if (!item) return false;

    this.jadwalList = this.jadwalList.filter(j => j.id !== id);
    this.persist();

    const token = googleAuth.getAccessToken();
    if (token && item.googleCalendarEventId) {
      GoogleCalendarService.deleteCalendarEvent(token, item.googleCalendarEventId).catch(e =>
        console.warn('Delete Google Calendar event failed:', e)
      );
    }

    return true;
  }

  public async syncJadwalToCalendar(jadwal: JadwalKunjungan, token: string): Promise<string> {
    try {
      this.isSyncingCalendar = true;
      this.notify();

      const eventId = await GoogleCalendarService.createCalendarEvent(token, jadwal);
      const idx = this.jadwalList.findIndex(j => j.id === jadwal.id);
      if (idx !== -1) {
        this.jadwalList[idx].googleCalendarEventId = eventId;
        this.jadwalList[idx].syncedToGoogleCalendar = true;
        this.persist();
      }
      return eventId;
    } finally {
      this.isSyncingCalendar = false;
      this.notify();
    }
  }

  // --- STATS & AGGREGATIONS ---
  public getStatistics() {
    const totalDesa = this.desaList.length; // 26
    const allRecords = this.pembinaanList;

    // Count per village
    const desaCoachedSet = new Set(allRecords.map(r => r.namaDesa.toLowerCase()));
    const totalDesaDibina = desaCoachedSet.size;
    const totalBelumDibina = Math.max(0, totalDesa - totalDesaDibina);

    // Latest status per village
    const latestStatusMap = new Map<string, 'Selesai' | 'Proses' | 'Perlu Perbaikan'>();
    const sorted = [...allRecords].sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    sorted.forEach(r => {
      const key = r.namaDesa.toLowerCase();
      if (!latestStatusMap.has(key)) {
        latestStatusMap.set(key, r.status);
      }
    });

    let countSelesai = 0;
    let countProses = 0;
    let countPerluPerbaikan = 0;

    latestStatusMap.forEach(status => {
      if (status === 'Selesai') countSelesai++;
      else if (status === 'Proses') countProses++;
      else if (status === 'Perlu Perbaikan') countPerluPerbaikan++;
    });

    const urgentCount = allRecords.filter(r => r.tingkatUrgensi === 'Tinggi' && r.status !== 'Selesai').length;
    const upcomingVisits = this.jadwalList.filter(j => j.status === 'Terjadwal').length;

    return {
      totalDesa,
      totalDesaDibina,
      totalBelumDibina,
      persentaseCakupan: Math.round((totalDesaDibina / totalDesa) * 100),
      countSelesai,
      countProses,
      countPerluPerbaikan,
      totalCatatanPembinaan: allRecords.length,
      urgentCount,
      upcomingVisits
    };
  }

  // --- RESET DEMO DATA ---
  public resetToDefault() {
    this.desaList = DAFTAR_26_DESA_TEMPUNAK;
    this.pembinaanList = INITIAL_PEMBINAAN_RECORDS;
    this.jadwalList = INITIAL_JADWAL_KUNJUNGAN;
    this.persist();
  }

  // --- EXPORT DATA AS CSV ---
  public exportAsCsv(): string {
    const headers = [
      'ID',
      'Desa',
      'Tanggal',
      'Materi Pembinaan',
      'Petugas',
      'Hasil / Temuan',
      'Tindak Lanjut',
      'Tenggat Waktu',
      'Status',
      'Tingkat Urgensi'
    ];

    const rows = this.pembinaanList.map(r => [
      `"${r.id}"`,
      `"${r.namaDesa.replace(/"/g, '""')}"`,
      `"${r.tanggal}"`,
      `"${r.materi.replace(/"/g, '""')}"`,
      `"${r.petugas.replace(/"/g, '""')}"`,
      `"${r.hasil.replace(/"/g, '""')}"`,
      `"${r.tindakLanjut.replace(/"/g, '""')}"`,
      `"${r.tenggatWaktu || '-'}"`,
      `"${r.status}"`,
      `"${r.tingkatUrgensi}"`
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

export const storage = new StorageService();
