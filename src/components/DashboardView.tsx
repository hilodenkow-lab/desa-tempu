import React, { useState, useMemo } from 'react';
import { PembinaanRecord, StatusPembinaan, TingkatUrgensi, JadwalKunjungan } from '../types';
import { DAFTAR_26_DESA_TEMPUNAK } from '../data/desaTempunak';
import { StatusBadge, UrgensiBadge } from './StatusBadge';
import { storage } from '../services/storage';
import { GoogleSheetsService } from '../services/googleSheets';
import { 
  Search, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  FileSpreadsheet, 
  MapPin,
  CalendarDays,
  ChevronRight,
  Filter
} from 'lucide-react';

interface DashboardViewProps {
  records: PembinaanRecord[];
  onOpenNewPembinaan: () => void;
  onEditPembinaan: (record: PembinaanRecord) => void;
  onViewDesaDetail: (desaId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  records,
  onOpenNewPembinaan,
  onEditPembinaan,
  onViewDesaDetail
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | StatusPembinaan>('Semua');
  const [desaFilter, setDesaFilter] = useState<string>('Semua');
  const [urgensiFilter, setUrgensiFilter] = useState<'Semua' | TingkatUrgensi>('Semua');
  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PembinaanRecord | null>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const sheetConfig = GoogleSheetsService.getConfig();
  const stats = useMemo(() => storage.getStatistics(), [records]);
  const jadwalList = useMemo(() => storage.getJadwalList(), []);

  // Village coaching status map
  const desaStatusMap = useMemo(() => {
    const map = new Map<string, { count: number; latestRecord?: PembinaanRecord }>();
    DAFTAR_26_DESA_TEMPUNAK.forEach(d => map.set(d.nama.toLowerCase(), { count: 0 }));

    records.forEach(r => {
      const key = r.namaDesa.toLowerCase();
      const curr = map.get(key) || { count: 0 };
      if (!curr.latestRecord || new Date(r.tanggal) > new Date(curr.latestRecord.tanggal)) {
        curr.latestRecord = r;
      }
      curr.count += 1;
      map.set(key, curr);
    });

    return map;
  }, [records]);

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchSearch =
        searchQuery === '' ||
        r.namaDesa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.materi.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.petugas.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.hasil.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.tindakLanjut.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'Semua' || r.status === statusFilter;
      const matchDesa = desaFilter === 'Semua' || r.desaId === desaFilter || r.namaDesa === desaFilter;
      const matchUrgensi = urgensiFilter === 'Semua' || r.tingkatUrgensi === urgensiFilter;

      return matchSearch && matchStatus && matchDesa && matchUrgensi;
    });
  }, [records, searchQuery, statusFilter, desaFilter, urgensiFilter]);

  const handleExportCsv = () => {
    setIsExporting(true);
    try {
      const csv = storage.exportAsCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Rekam_Jejak_Pembinaan_Tempunak_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Export failed', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleQuickStatusChange = async (record: PembinaanRecord, newStatus: StatusPembinaan) => {
    await storage.updatePembinaan(record.id, { status: newStatus });
  };

  const handleDelete = async (id: string) => {
    await storage.deletePembinaan(id);
    setDeletingRecordId(null);
  };

  return (
    <div className="space-y-4">
      
      {/* High Density Metric Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
        
        {/* Total Desa */}
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Total Desa</span>
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{stats.totalDesa}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Kec. Tempunak</p>
        </div>

        {/* Cakupan Realisasi */}
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Cakupan Realisasi</span>
            <span className="text-[10px] text-emerald-600 font-bold font-mono">{stats.persentaseCakupan}%</span>
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">
            {stats.totalDesaDibina} <span className="text-xs font-normal text-slate-400">/ 26</span>
          </p>
          <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-1 rounded-full transition-all duration-500"
              style={{ width: `${stats.persentaseCakupan}%` }}
            />
          </div>
        </div>

        {/* Status: Selesai */}
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-700 uppercase font-bold tracking-tight">Selesai</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-700 mt-1">{stats.countSelesai}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Administrasi Tuntas</p>
        </div>

        {/* Status: Proses */}
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-blue-700 uppercase font-bold tracking-tight">Sedang Proses</span>
            <Clock className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-blue-700 mt-1">{stats.countProses}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Tindak Lanjut Aktif</p>
        </div>

        {/* Status: Perlu Perbaikan */}
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-amber-700 uppercase font-bold tracking-tight">Perlu Perbaikan</span>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-amber-700 mt-1">{stats.countPerluPerbaikan}</p>
          <p className="text-[10px] text-rose-600 font-medium mt-0.5">Temuan Butuh Atensi</p>
        </div>

        {/* Total Log Pembinaan */}
        <div className="bg-white p-3 rounded border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tight">Total Rekam Jejak</span>
            <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{stats.totalCatatanPembinaan}</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Sesi Supervisi</p>
        </div>
      </div>

      {/* Main 12-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
        
        {/* Left Column: Data Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-3">
          
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            
            {/* Table Header Bar */}
            <div className="px-3.5 py-2.5 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Hasil Rekam Jejak Pembinaan Administratif
                </h3>
                <span className="text-[10px] font-bold font-mono px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                  {filteredRecords.length}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleExportCsv}
                  disabled={isExporting}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 transition"
                  title="Unduh Data CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>

                {sheetConfig.spreadsheetUrl && (
                  <a
                    href={sheetConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                    title="Buka Spreadsheet di Google Sheets"
                  >
                    <ExternalLink className="w-3 h-3 text-emerald-600" />
                    <span>Sheets</span>
                  </a>
                )}

                <button
                  onClick={onOpenNewPembinaan}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ Catat Hasil</span>
                </button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="p-2.5 border-b border-slate-200 bg-white grid grid-cols-1 sm:grid-cols-4 gap-2">
              {/* Search */}
              <div className="relative sm:col-span-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari desa, materi, hasil..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white outline-none"
                >
                  <option value="Semua">Semua Status</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Proses">Proses</option>
                  <option value="Perlu Perbaikan">Perlu Perbaikan</option>
                </select>
              </div>

              {/* Desa */}
              <div>
                <select
                  value={desaFilter}
                  onChange={e => setDesaFilter(e.target.value)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white outline-none"
                >
                  <option value="Semua">Semua 26 Desa</option>
                  {DAFTAR_26_DESA_TEMPUNAK.map(d => (
                    <option key={d.id} value={d.id}>
                      Desa {d.nama}
                    </option>
                  ))}
                </select>
              </div>

              {/* Urgensi */}
              <div>
                <select
                  value={urgensiFilter}
                  onChange={e => setUrgensiFilter(e.target.value as any)}
                  className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white outline-none"
                >
                  <option value="Semua">Semua Urgensi</option>
                  <option value="Tinggi">Tinggi (Prioritas)</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Rendah">Rendah / Normal</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            {filteredRecords.length === 0 ? (
              <div className="py-10 text-center text-slate-400">
                <FileSpreadsheet className="w-8 h-8 mx-auto mb-1.5 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">Tidak ada data pembinaan yang cocok dengan filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[580px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[9px] font-bold">
                      <th className="py-2 px-3">Desa & Tanggal</th>
                      <th className="py-2 px-3">Materi / Topik</th>
                      <th className="py-2 px-3">Tim Petugas</th>
                      <th className="py-2 px-3 min-w-[200px]">Temuan & Tindak Lanjut</th>
                      <th className="py-2 px-3 text-center">Status</th>
                      <th className="py-2 px-3 text-center">Urgensi</th>
                      <th className="py-2 px-3 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.map(record => (
                      <tr key={record.id} className="hover:bg-slate-50/80 transition text-[11px]">
                        
                        {/* Desa & Tanggal */}
                        <td className="py-2 px-3 align-top">
                          <button
                            onClick={() => onViewDesaDetail(record.desaId || record.namaDesa)}
                            className="font-bold text-slate-900 hover:text-blue-700 flex items-center gap-0.5 group text-left"
                          >
                            <span>{record.namaDesa}</span>
                            <ChevronRight className="w-3 h-3 text-slate-400 group-hover:text-blue-600" />
                          </button>
                          <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
                            <span>{record.tanggal}</span>
                          </span>
                        </td>

                        {/* Materi */}
                        <td className="py-2 px-3 align-top font-medium text-slate-800">
                          <p className="line-clamp-2 max-w-[160px] leading-tight">{record.materi}</p>
                        </td>

                        {/* Petugas */}
                        <td className="py-2 px-3 align-top text-slate-600">
                          <p className="line-clamp-2 max-w-[140px] leading-tight">{record.petugas}</p>
                        </td>

                        {/* Temuan & Tindak Lanjut */}
                        <td className="py-2 px-3 align-top">
                          <div className="space-y-0.5 max-w-[280px]">
                            <p className="text-slate-800 line-clamp-1 leading-tight">
                              <span className="text-[9px] uppercase font-bold text-slate-400 mr-1">Temuan:</span>
                              {record.hasil}
                            </p>
                            <p className="text-slate-600 line-clamp-1 leading-tight text-[10px]">
                              <span className="text-[9px] uppercase font-bold text-emerald-600 mr-1">Rekomendasi:</span>
                              {record.tindakLanjut}
                            </p>
                            {record.tenggatWaktu && (
                              <p className="text-[9px] text-rose-600 font-medium">
                                Tenggat: {record.tenggatWaktu}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-2 px-3 align-top text-center">
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <StatusBadge status={record.status} size="sm" />
                            <select
                              value={record.status}
                              onChange={e => handleQuickStatusChange(record, e.target.value as any)}
                              className="text-[9px] px-1 py-0.2 bg-white border border-slate-200 rounded text-slate-600 hover:border-slate-300 outline-none cursor-pointer mt-0.5"
                            >
                              <option value="Proses">Proses</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Perlu Perbaikan">Perbaikan</option>
                            </select>
                          </div>
                        </td>

                        {/* Urgensi */}
                        <td className="py-2 px-3 align-top text-center">
                          <UrgensiBadge urgensi={record.tingkatUrgensi} />
                        </td>

                        {/* Actions */}
                        <td className="py-2 px-3 align-top text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {deletingRecordId === record.id ? (
                              <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                <span className="text-[10px] text-rose-700 font-semibold">Hapus?</span>
                                <button
                                  onClick={() => handleDelete(record.id)}
                                  className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold hover:bg-rose-700 transition cursor-pointer"
                                >
                                  Ya
                                </button>
                                <button
                                  onClick={() => setDeletingRecordId(null)}
                                  className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] hover:bg-slate-300 transition cursor-pointer"
                                >
                                  Batal
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => setSelectedRecordForDetail(record)}
                                  title="Lihat Detail Temuan"
                                  className="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => onEditPembinaan(record)}
                                  title="Edit Catatan Pembinaan"
                                  className="p-1 rounded text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeletingRecordId(record.id)}
                                  title="Hapus Catatan"
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 26 Villages Progress + Google Calendar Schedule (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          
          {/* Card 1: 26 Desa Live Progress List */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-3 py-2 bg-[#1e293b] text-white flex justify-between items-center text-xs font-bold uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Monitoring 26 Desa</span>
              </span>
              <span className="text-[10px] text-slate-300 font-mono font-normal">
                {stats.totalDesaDibina}/26 Aktif
              </span>
            </div>

            <div className="p-1.5 divide-y divide-slate-100 max-h-[380px] overflow-y-auto">
              {DAFTAR_26_DESA_TEMPUNAK.map(desa => {
                const data = desaStatusMap.get(desa.nama.toLowerCase());
                const status = data?.latestRecord?.status || 'Belum Dibina';
                const count = data?.count || 0;

                const dotColor =
                  status === 'Selesai'
                    ? 'bg-emerald-500'
                    : status === 'Proses'
                    ? 'bg-blue-500'
                    : status === 'Perlu Perbaikan'
                    ? 'bg-amber-500'
                    : 'bg-slate-300';

                return (
                  <div
                    key={desa.id}
                    onClick={() => onViewDesaDetail(desa.id)}
                    className="p-2 hover:bg-slate-50 rounded cursor-pointer transition flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 group-hover:text-blue-600 truncate">
                          {desa.nama}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          {desa.zonaWilayah} • {desa.jarakKm} km
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <StatusBadge status={status} size="sm" />
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                        {count > 0 ? `${count}x dibina` : 'Belum'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Upcoming Google Calendar Visits */}
          <div className="bg-white rounded border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-3 py-2 bg-slate-100 border-b border-slate-200 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-slate-700">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-blue-600" />
                <span>Jadwal Supervisi</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono font-normal">
                {jadwalList.length} Agenda
              </span>
            </div>

            <div className="p-2 space-y-2 max-h-[260px] overflow-y-auto">
              {jadwalList.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-4">
                  Belum ada agenda kunjungan terjadwal.
                </p>
              ) : (
                jadwalList.slice(0, 5).map(item => (
                  <div
                    key={item.id}
                    className={`p-2 rounded border bg-slate-50/50 hover:bg-slate-50 transition border-l-4 ${
                      item.status === 'Selesai'
                        ? 'border-l-emerald-500 border-slate-200'
                        : item.status === 'Ditunda'
                        ? 'border-l-amber-500 border-slate-200'
                        : 'border-l-blue-500 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>Desa {item.namaDesa}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{item.tanggal}</span>
                    </div>
                    <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                      {item.agenda}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      PIC: {item.timPembina} • {item.waktuMulai}-{item.waktuSelesai}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Detail Record Modal */}
      {selectedRecordForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl p-5 overflow-y-auto max-h-[90vh] space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  Hasil Rekam Jejak Pembinaan
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  Desa {selectedRecordForDetail.namaDesa}
                </h3>
              </div>
              <StatusBadge status={selectedRecordForDetail.status} />
            </div>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 font-medium">Tanggal Pelaksanaan:</span>
                <p className="font-bold text-slate-800">{selectedRecordForDetail.tanggal}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Tingkat Urgensi:</span>
                <p className="font-bold text-slate-800">{selectedRecordForDetail.tingkatUrgensi}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-medium">Topik / Materi:</span>
                <p className="font-bold text-slate-800">{selectedRecordForDetail.materi}</p>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 font-medium">Tim / Petugas Pembina:</span>
                <p className="font-bold text-slate-800">{selectedRecordForDetail.petugas}</p>
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-slate-700 uppercase mb-1">
                Ringkasan Temuan & Hasil Pemeriksaan:
              </h4>
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedRecordForDetail.hasil}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold text-emerald-800 uppercase mb-1">
                Rekomendasi & Tindak Lanjut Perbaikan:
              </h4>
              <div className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded text-slate-800 whitespace-pre-wrap leading-relaxed">
                {selectedRecordForDetail.tindakLanjut}
              </div>
              {selectedRecordForDetail.tenggatWaktu && (
                <p className="text-[10px] text-rose-600 font-semibold mt-1">
                  Batas Waktu Penyelesaian: {selectedRecordForDetail.tenggatWaktu}
                </p>
              )}
            </div>

            {selectedRecordForDetail.linkDokumen && (
              <div>
                <span className="text-slate-500 font-medium">Dokumen Pendukung:</span>
                <a
                  href={selectedRecordForDetail.linkDokumen}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-700 hover:underline flex items-center gap-1 font-semibold mt-0.5"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>{selectedRecordForDetail.linkDokumen}</span>
                </a>
              </div>
            )}

            <div className="pt-2.5 border-t border-slate-200 flex justify-between items-center">
              <button
                onClick={() => {
                  const rec = selectedRecordForDetail;
                  setSelectedRecordForDetail(null);
                  onEditPembinaan(rec);
                }}
                className="px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition"
              >
                Edit Data
              </button>
              <button
                onClick={() => setSelectedRecordForDetail(null)}
                className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

