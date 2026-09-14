import { PembinaanRecord, GoogleSyncConfig } from '../types';

export const SPREADSHEET_TITLE = 'BINA DESA TEMPUNAK - REKAM JEJAK PEMBINAAN 2026';
export const SHEET_NAME = 'Data_Pembinaan';

export const SHEET_HEADERS = [
  'ID Pembinaan',
  'Nama Desa',
  'Tanggal Pembinaan',
  'Materi / Topik Pembinaan',
  'Tim / Petugas Pembina',
  'Temuan & Hasil Pembinaan',
  'Rekomendasi Tindak Lanjut',
  'Tenggat Waktu',
  'Status',
  'Tingkat Urgensi',
  'Tautan Dokumen',
  'Terakhir Diperbarui'
];

export class GoogleSheetsService {
  private static getStoredConfig(): GoogleSyncConfig {
    const raw = localStorage.getItem('bina_desa_sheet_config');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        console.warn('Error parsing sheet config', e);
      }
    }
    return {
      spreadsheetId: null,
      spreadsheetUrl: null,
      sheetName: SHEET_NAME,
      lastSyncedAt: null,
      autoSync: true
    };
  }

  public static saveConfig(config: Partial<GoogleSyncConfig>): GoogleSyncConfig {
    const current = this.getStoredConfig();
    const updated = { ...current, ...config };
    localStorage.setItem('bina_desa_sheet_config', JSON.stringify(updated));
    return updated;
  }

  public static getConfig(): GoogleSyncConfig {
    return this.getStoredConfig();
  }

  /**
   * Search for existing spreadsheet or create a new one
   */
  public static async getOrCreateSpreadsheet(token: string): Promise<{ id: string; url: string; createdNew: boolean }> {
    if (token.startsWith('simulated_')) {
      const demoId = 'demo-tempunak-sheets-2026';
      const demoUrl = 'https://docs.google.com/spreadsheets/d/demo-tempunak-sheets-2026/edit';
      this.saveConfig({ spreadsheetId: demoId, spreadsheetUrl: demoUrl, lastSyncedAt: new Date().toISOString() });
      return { id: demoId, url: demoUrl, createdNew: false };
    }

    const config = this.getStoredConfig();
    if (config.spreadsheetId) {
      // Verify accessibility
      try {
        const checkRes = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${config.spreadsheetId}?fields=spreadsheetId,spreadsheetUrl`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        if (checkRes.ok) {
          const data = await checkRes.json();
          return { id: data.spreadsheetId, url: data.spreadsheetUrl, createdNew: false };
        }
      } catch (e) {
        console.warn('Existing spreadsheet could not be verified, searching Drive or creating new:', e);
      }
    }

    // Search Drive for file with SPREADSHEET_TITLE
    try {
      const searchRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${encodeURIComponent(SPREADSHEET_TITLE)}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false&fields=files(id,name,webViewLink)`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (searchRes.ok) {
        const data = await searchRes.json();
        if (data.files && data.files.length > 0) {
          const found = data.files[0];
          const sheetUrl = `https://docs.google.com/spreadsheets/d/${found.id}/edit`;
          this.saveConfig({ spreadsheetId: found.id, spreadsheetUrl: sheetUrl });
          return { id: found.id, url: sheetUrl, createdNew: false };
        }
      }
    } catch (e) {
      console.warn('Drive search failed:', e);
    }

    // Create a new spreadsheet
    const createPayload = {
      properties: {
        title: SPREADSHEET_TITLE,
        locale: 'id_ID',
        timeZone: 'Asia/Pontianak'
      },
      sheets: [
        {
          properties: {
            title: SHEET_NAME,
            gridProperties: {
              frozenRowCount: 1
            }
          }
        }
      ]
    };

    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });

    if (!createRes.ok) {
      const err = await createRes.json();
      throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru.');
    }

    const createdData = await createRes.json();
    const spreadsheetId = createdData.spreadsheetId;
    const spreadsheetUrl = createdData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

    // Initialize Header Row
    await this.initializeHeaders(token, spreadsheetId);

    this.saveConfig({
      spreadsheetId,
      spreadsheetUrl,
      lastSyncedAt: new Date().toISOString()
    });

    return { id: spreadsheetId, url: spreadsheetUrl, createdNew: true };
  }

  /**
   * Initializes header row with bold typography and styling
   */
  public static async initializeHeaders(token: string, spreadsheetId: string): Promise<void> {
    const range = `${SHEET_NAME}!A1:L1`;
    const payload = {
      range,
      majorDimension: 'ROWS',
      values: [SHEET_HEADERS]
    };

    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );
  }

  /**
   * Convert a PembinaanRecord to a row array
   */
  public static recordToRow(r: PembinaanRecord): string[] {
    return [
      r.id,
      r.namaDesa,
      r.tanggal,
      r.materi,
      r.petugas,
      r.hasil,
      r.tindakLanjut,
      r.tenggatWaktu || '-',
      r.status,
      r.tingkatUrgensi,
      r.linkDokumen || '-',
      r.updatedAt || new Date().toISOString()
    ];
  }

  /**
   * Convert row array back to a PembinaanRecord
   */
  public static rowToRecord(row: string[], index: number): PembinaanRecord | null {
    if (!row || row.length < 2 || !row[0]) return null;
    return {
      id: row[0] || `pemb-sync-${index}`,
      desaId: row[0].includes('desa') ? row[0] : '',
      namaDesa: row[1] || 'Desa Tanpa Nama',
      tanggal: row[2] || new Date().toISOString().split('T')[0],
      materi: row[3] || 'Administrasi Umum',
      petugas: row[4] || 'Tim Pembina Kecamatan',
      hasil: row[5] || '-',
      tindakLanjut: row[6] || '-',
      tenggatWaktu: row[7] === '-' ? undefined : row[7],
      status: (row[8] as any) || 'Proses',
      tingkatUrgensi: (row[9] as any) || 'Sedang',
      linkDokumen: row[10] === '-' ? undefined : row[10],
      createdAt: row[11] || new Date().toISOString(),
      updatedAt: row[11] || new Date().toISOString(),
      syncedToGoogleSheet: true,
      googleSheetRowIndex: index + 1
    };
  }

  /**
   * Append a single Pembinaan record to Google Sheet
   */
  public static async appendRecord(token: string, record: PembinaanRecord): Promise<void> {
    if (token.startsWith('simulated_')) {
      await new Promise(r => setTimeout(r, 300));
      this.saveConfig({ lastSyncedAt: new Date().toISOString() });
      return;
    }

    const { id: spreadsheetId } = await this.getOrCreateSpreadsheet(token);
    const range = `${SHEET_NAME}!A:L`;
    const payload = {
      values: [this.recordToRow(record)]
    };

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal menyimpan ke Google Sheets');
    }

    this.saveConfig({ lastSyncedAt: new Date().toISOString() });
  }

  /**
   * Batch sync all local records to Google Sheet (overwrites data table cleanly)
   */
  public static async syncAllRecords(token: string, records: PembinaanRecord[]): Promise<void> {
    if (token.startsWith('simulated_')) {
      await new Promise(r => setTimeout(r, 600));
      this.saveConfig({ lastSyncedAt: new Date().toISOString() });
      return;
    }

    const { id: spreadsheetId } = await this.getOrCreateSpreadsheet(token);

    // Clear existing data (keeping row 1 headers)
    const clearRange = `${SHEET_NAME}!A2:L1000`;
    try {
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${clearRange}:clear`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (e) {
      console.warn('Clear error (can proceed):', e);
    }

    // Re-verify headers
    await this.initializeHeaders(token, spreadsheetId);

    if (records.length > 0) {
      const rows = records.map(r => this.recordToRow(r));
      const range = `${SHEET_NAME}!A2:L${records.length + 1}`;
      const payload = {
        range,
        majorDimension: 'ROWS',
        values: rows
      };

      const res = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || 'Gagal menyinkronkan data ke Google Sheet.');
      }
    }

    this.saveConfig({ lastSyncedAt: new Date().toISOString() });
  }

  /**
   * Fetch all records currently in Google Sheet
   */
  public static async fetchRecords(token: string): Promise<PembinaanRecord[]> {
    if (token.startsWith('simulated_')) {
      await new Promise(r => setTimeout(r, 400));
      return [];
    }

    const { id: spreadsheetId } = await this.getOrCreateSpreadsheet(token);
    const range = `${SHEET_NAME}!A2:L`;

    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal memuat data dari Google Sheets');
    }

    const data = await res.json();
    const rows: string[][] = data.values || [];
    const parsed: PembinaanRecord[] = [];

    rows.forEach((row, i) => {
      const rec = this.rowToRecord(row, i + 1);
      if (rec) parsed.push(rec);
    });

    this.saveConfig({ lastSyncedAt: new Date().toISOString() });
    return parsed;
  }
}
