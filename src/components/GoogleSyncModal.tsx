import React, { useState, useEffect } from 'react';
import { googleAuth, AuthState } from '../services/googleAuth';
import { GoogleSheetsService } from '../services/googleSheets';
import { storage } from '../services/storage';
import { 
  TableProperties, 
  Calendar as CalendarIcon, 
  RefreshCw, 
  ExternalLink, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Download, 
  RotateCcw,
  Database,
  FileSpreadsheet
} from 'lucide-react';

interface GoogleSyncModalProps {
  onDataChanged?: () => void;
}

export const GoogleSyncModal: React.FC<GoogleSyncModalProps> = ({ onDataChanged }) => {
  const [authState, setAuthState] = useState<AuthState>(googleAuth.getState());
  const [sheetConfig, setSheetConfig] = useState(GoogleSheetsService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsubAuth = googleAuth.subscribe(s => setAuthState(s));
    const unsubStorage = storage.subscribe(() => {
      setSheetConfig(GoogleSheetsService.getConfig());
    });
    return () => {
      unsubAuth();
      unsubStorage();
    };
  }, []);

  const handlePushAllToSheets = async () => {
    if (!authState.isAuthenticated) {
      googleAuth.signIn();
      return;
    }
    try {
      setIsSyncing(true);
      setStatusMessage(null);
      const res = await storage.syncAllToGoogleSheets();
      setStatusMessage({
        type: 'success',
        text: `Berhasil menyinkronkan ${res.count} data pembinaan ke Google Sheets!`
      });
      if (onDataChanged) onDataChanged();
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: e.message || 'Gagal sinkronisasi data ke Google Sheets.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handlePullFromSheets = async () => {
    if (!authState.isAuthenticated) {
      googleAuth.signIn();
      return;
    }
    try {
      setIsPulling(true);
      setStatusMessage(null);
      const count = await storage.importFromGoogleSheets();
      setStatusMessage({
        type: 'success',
        text: `Berhasil mengimpor ${count} data dari Google Sheets!`
      });
      if (onDataChanged) onDataChanged();
    } catch (e: any) {
      setStatusMessage({
        type: 'error',
        text: e.message || 'Gagal menarik data dari Google Sheets.'
      });
    } finally {
      setIsPulling(false);
    }
  };

  const handleResetData = () => {
    storage.resetToDefault();
    setIsConfirmingReset(false);
    setStatusMessage({
      type: 'success',
      text: 'Data simulasi pembinaan 26 desa berhasil di-reset ke setelan awal.'
    });
    if (onDataChanged) onDataChanged();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-3 py-1">
      
      {/* Google Account Status Banner */}
      <div className="bg-white rounded border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Integrasi Google Workspace (Sheets & Calendar)
              </h2>
              <p className="text-[11px] text-slate-500">
                Google OAuth 2.0 resmi untuk sinkronisasi rekam jejak & agenda supervisi
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {authState.isAuthenticated ? (
              <button
                onClick={() => googleAuth.signOut()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3 h-3" />
                <span>Keluar Akun</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => googleAuth.signIn()}
                  disabled={authState.isLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{authState.isLoading ? 'Menghubungkan...' : 'Masuk Akun Google'}</span>
                </button>
                <button
                  onClick={() => googleAuth.signInAsDemo()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold shadow-2xs transition cursor-pointer"
                  title="Gunakan akun petugas simulasi tanpa hambatan origin/popup"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Akun Petugas (Langsung Aktif)</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* User Info Details */}
        {authState.isAuthenticated && authState.user && (
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs bg-slate-50 p-2 rounded border border-slate-200">
            <div className="flex items-center gap-2">
              {authState.user.picture ? (
                <img
                  src={authState.user.picture}
                  alt={authState.user.name}
                  className="w-6 h-6 rounded-full ring-1 ring-blue-500"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {authState.user.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-bold text-slate-900 leading-tight">{authState.user.name}</p>
                <p className="text-[10px] text-slate-500">{authState.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {authState.isSimulated && (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold text-[10px]">
                  Mode Petugas Tempunak
                </span>
              )}
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terhubung
              </span>
            </div>
          </div>
        )}

        {/* Auth Error Notification with Fallback Action */}
        {authState.error && !authState.isAuthenticated && (
          <div className="mt-2 p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{authState.error}</p>
                <p className="text-[10px] text-amber-700 mt-0.5">
                  Klik tombol di samping untuk mengaktifkan sinkronisasi otomatis menggunakan Akun Petugas Kecamatan Tempunak.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                googleAuth.clearError();
                googleAuth.signInAsDemo();
              }}
              className="px-2.5 py-1 rounded bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Aktifkan Akun Petugas
            </button>
          </div>
        )}

        {statusMessage && (
          <div
            className={`mt-2 p-2 rounded text-xs font-medium flex items-center gap-1.5 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border border-rose-200 text-rose-900'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}
      </div>

      {/* Google Sheets Sync Manager */}
      <div className="bg-white rounded border border-slate-200 p-3 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <TableProperties className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Google Sheets Database Kecamatan
              </h3>
              <p className="text-[10px] text-slate-500">
                Sinkronisasi tabel hasil pembinaan 26 desa
              </p>
            </div>
          </div>

          {sheetConfig.spreadsheetUrl && (
            <a
              href={sheetConfig.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-semibold transition"
            >
              <ExternalLink className="w-3 h-3" />
              <span>Buka Spreadsheet</span>
            </a>
          )}
        </div>

        <div className="p-2.5 bg-slate-50 rounded border border-slate-200 space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500 text-[11px]">Nama Spreadsheet:</span>
            <span className="font-bold text-slate-800 text-[11px]">BINA DESA TEMPUNAK - REKAM JEJAK PEMBINAAN 2026</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-[11px]">Nama Lembar (Sheet):</span>
            <span className="font-mono text-slate-700 text-[11px]">{sheetConfig.sheetName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 text-[11px]">Terakhir Sinkron:</span>
            <span className="font-medium text-slate-800 text-[11px]">
              {sheetConfig.lastSyncedAt ? new Date(sheetConfig.lastSyncedAt).toLocaleString('id-ID') : 'Belum pernah'}
            </span>
          </div>
        </div>

        {/* Sync Actions */}
        <div className="pt-1 flex flex-wrap items-center gap-2">
          <button
            onClick={handlePushAllToSheets}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Data ke Google Sheets'}</span>
          </button>

          <button
            onClick={handlePullFromSheets}
            disabled={isPulling}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3 h-3" />
            <span>{isPulling ? 'Mengimpor...' : 'Tarik Data dari Sheets'}</span>
          </button>
        </div>
      </div>

      {/* Google Calendar Manager */}
      <div className="bg-white rounded border border-slate-200 p-3 shadow-2xs space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-blue-100 text-blue-800 flex items-center justify-center">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Google Calendar Agenda Lapangan
            </h3>
            <p className="text-[10px] text-slate-500">
              Sinkronisasi agenda kunjungan kerja supervisi
            </p>
          </div>
        </div>

        <p className="text-[11px] text-slate-600 leading-relaxed">
          Setiap jadwal kunjungan yang dibuat di tab <strong>Jadwal & Agenda</strong> akan otomatis masuk ke Google Calendar dengan notifikasi pengingat H-1 dan H-2 jam sebelum agenda lapangan.
        </p>
      </div>

      {/* Database Management & Demo Data Reset */}
      <div className="bg-white rounded border border-slate-200 p-3 shadow-2xs space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-slate-500" />
          <span>Pengelolaan Data & Reset Simulasi</span>
        </h3>
        <p className="text-[11px] text-slate-500">
          Gunakan tombol di bawah ini jika ingin mereset data pembinaan ke setelan awal 26 desa Tempunak.
        </p>

        <div>
          {isConfirmingReset ? (
            <div className="flex items-center gap-2 bg-rose-50 p-2 rounded border border-rose-200">
              <span className="text-xs text-rose-800 font-semibold">
                Kembalikan semua data ke setelan awal 26 desa?
              </span>
              <button
                onClick={handleResetData}
                className="px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Ya, Reset Sekarang
              </button>
              <button
                onClick={() => setIsConfirmingReset(false)}
                className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition cursor-pointer"
              >
                Batal
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsConfirmingReset(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 text-xs font-semibold border border-slate-300 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Data Contoh 26 Desa</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
