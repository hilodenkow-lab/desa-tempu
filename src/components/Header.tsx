import React, { useState, useEffect } from 'react';
import { googleAuth, AuthState } from '../services/googleAuth';
import { GoogleSheetsService } from '../services/googleSheets';
import { storage } from '../services/storage';
import { 
  Building2, 
  TableProperties, 
  Calendar as CalendarIcon, 
  RefreshCw, 
  ExternalLink, 
  LogOut, 
  LogIn, 
  Plus, 
  Printer, 
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';

interface HeaderProps {
  onOpenNewPembinaan: () => void;
  onOpenSyncModal: () => void;
  onOpenPrintReport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNewPembinaan,
  onOpenSyncModal,
  onOpenPrintReport
}) => {
  const [authState, setAuthState] = useState<AuthState>(googleAuth.getState());
  const [syncState, setSyncState] = useState(storage.getSyncState());
  const [sheetConfig, setSheetConfig] = useState(GoogleSheetsService.getConfig());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsubAuth = googleAuth.subscribe(s => setAuthState(s));
    const unsubStorage = storage.subscribe(() => {
      setSyncState(storage.getSyncState());
      setSheetConfig(GoogleSheetsService.getConfig());
    });
    return () => {
      unsubAuth();
      unsubStorage();
    };
  }, []);

  const stats = storage.getStatistics();

  const handleManualSync = async () => {
    setSyncErrorMsg(null);
    if (!authState.isAuthenticated) {
      googleAuth.signIn();
      return;
    }
    try {
      setIsSyncing(true);
      const res = await storage.syncAllToGoogleSheets();
      setSyncSuccessMsg(`${res.count} data tersinkron ke Google Sheets!`);
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setSyncErrorMsg(err.message || 'Gagal sinkronisasi data ke Google Sheets.');
      setTimeout(() => setSyncErrorMsg(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="bg-[#1e293b] border-b border-slate-700/80 sticky top-0 z-40 text-white shadow-xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          
          {/* Logo & Title Identity */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs">
              T
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-white truncate">
                  BINA DESA TEMPU
                </span>
                <span className="hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-700/80 text-slate-300 font-mono">
                  26 DESA
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate hidden sm:block">
                Kecamatan Tempunak, Sintang • Google Sheets & Calendar Real-Time
              </p>
            </div>
          </div>

          {/* Center Status Indicators */}
          <div className="hidden lg:flex items-center gap-3 text-[11px] font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{stats.countSelesai} Desa Selesai</span>
            </span>
            <span className="flex items-center gap-1.5 text-amber-400 bg-amber-950/40 border border-amber-800/60 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>{stats.countPerluPerbaikan} Perlu Perbaikan</span>
            </span>
            <span className="text-slate-400 font-mono text-[10px]">
              Cakupan: {stats.persentaseCakupan}%
            </span>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            
            {/* Google Authentication / Sync Status */}
            {authState.isAuthenticated ? (
              <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 rounded px-2 py-1">
                <div className="text-right hidden sm:block">
                  <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>google_session: active</span>
                  </div>
                  <div className="text-[9px] text-slate-400 truncate max-w-[110px]">
                    {authState.user?.name || 'Terkoneksi'}
                  </div>
                </div>

                <button
                  onClick={handleManualSync}
                  disabled={isSyncing || syncState.isSyncingSheets}
                  title="Sinkronkan Sekarang ke Google Sheets"
                  className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || syncState.isSyncingSheets ? 'animate-spin text-blue-400' : ''}`} />
                </button>

                {sheetConfig.spreadsheetUrl && (
                  <a
                    href={sheetConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Buka Spreadsheet di Google Sheets"
                    className="p-1 rounded text-slate-300 hover:text-emerald-400 hover:bg-slate-700 transition"
                  >
                    <TableProperties className="w-3.5 h-3.5" />
                  </a>
                )}

                <button
                  onClick={() => googleAuth.signOut()}
                  title="Putuskan Akun Google"
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-700 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => googleAuth.signIn()}
                disabled={authState.isLoading}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
              >
                <LogIn className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Connect Google</span>
                <span className="sm:hidden">Google</span>
              </button>
            )}

            {/* Print Laporan Camat */}
            <button
              onClick={onOpenPrintReport}
              className="hidden md:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition"
              title="Cetak Resume Laporan Pembinaan untuk Camat"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              <span>Cetak Laporan</span>
            </button>

            {/* Primary Action Button: + Catat Pembinaan Baru */}
            <button
              onClick={onOpenNewPembinaan}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Form Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Success Notification Bar */}
      {syncSuccessMsg && (
        <div className="bg-emerald-700 text-white text-xs py-1 px-4 text-center font-semibold transition flex items-center justify-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{syncSuccessMsg}</span>
        </div>
      )}

      {/* Sync Error Notification Bar */}
      {syncErrorMsg && (
        <div className="bg-rose-700 text-white text-xs py-1 px-4 text-center font-semibold transition flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{syncErrorMsg}</span>
        </div>
      )}
    </header>
  );
};

