import React, { useState, useMemo } from 'react';
import { Desa, PembinaanRecord, StatusPembinaan } from '../types';
import { DAFTAR_26_DESA_TEMPUNAK } from '../data/desaTempunak';
import { StatusBadge, UrgensiBadge } from './StatusBadge';
import { 
  Building2, 
  MapPin, 
  Phone, 
  User, 
  Calendar, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  ChevronRight, 
  X, 
  ExternalLink,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';

interface RekapDesaViewProps {
  records: PembinaanRecord[];
  initialSelectedDesaId?: string | null;
  onOpenNewPembinaanForDesa: (desaId: string) => void;
  onScheduleVisitForDesa: (desaId: string) => void;
}

export const RekapDesaView: React.FC<RekapDesaViewProps> = ({
  records,
  initialSelectedDesaId,
  onOpenNewPembinaanForDesa,
  onScheduleVisitForDesa
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [zonaFilter, setZonaFilter] = useState<string>('Semua');
  const [statusFilter, setStatusFilter] = useState<string>('Semua');
  const [selectedDesaId, setSelectedDesaId] = useState<string | null>(initialSelectedDesaId || null);

  // Group pembinaan records by village
  const villageDataMap = useMemo(() => {
    const map = new Map<string, { desa: Desa; records: PembinaanRecord[]; latestStatus: StatusPembinaan | 'Belum Dibina'; issuesCount: number }>();

    DAFTAR_26_DESA_TEMPUNAK.forEach(desa => {
      const desaRecords = records
        .filter(r => r.desaId === desa.id || r.namaDesa.toLowerCase() === desa.nama.toLowerCase())
        .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

      const latestStatus = desaRecords.length > 0 ? desaRecords[0].status : 'Belum Dibina';
      const issuesCount = desaRecords.filter(r => r.status === 'Perlu Perbaikan').length;

      map.set(desa.id, {
        desa,
        records: desaRecords,
        latestStatus,
        issuesCount
      });
    });

    return map;
  }, [records]);

  // Filtered villages list
  const filteredVillages = useMemo(() => {
    return DAFTAR_26_DESA_TEMPUNAK.filter(desa => {
      const data = villageDataMap.get(desa.id);
      const matchSearch =
        searchQuery === '' ||
        desa.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desa.kepalaDesa.toLowerCase().includes(searchQuery.toLowerCase()) ||
        desa.sekretarisDesa.toLowerCase().includes(searchQuery.toLowerCase());

      const matchZona = zonaFilter === 'Semua' || desa.zonaWilayah === zonaFilter;
      const matchStatus = statusFilter === 'Semua' || data?.latestStatus === statusFilter;

      return matchSearch && matchZona && matchStatus;
    });
  }, [villageDataMap, searchQuery, zonaFilter, statusFilter]);

  const selectedVillageData = selectedDesaId ? villageDataMap.get(selectedDesaId) : null;

  return (
    <div className="space-y-3">
      
      {/* High Density Header & Filter Bar */}
      <div className="bg-white px-3.5 py-2.5 rounded border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div>
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Rekapitulasi Masalah & Rekam Jejak 26 Desa</span>
          </h2>
          <p className="text-[10px] text-slate-500">
            Intensitas pembinaan, riwayat topik temuan, dan status penyelesaian administratif per desa
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Search */}
          <div className="relative w-44 sm:w-56">
            <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari desa / Kades..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 focus:bg-white outline-none"
            />
          </div>

          {/* Filter Zona */}
          <select
            value={zonaFilter}
            onChange={e => setZonaFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-none"
          >
            <option value="Semua">Semua Zona Wilayah</option>
            <option value="Tempunak Tengah">Tempunak Tengah</option>
            <option value="Tempunak Hulu">Tempunak Hulu</option>
            <option value="Tempunak Kapuas / Pesisir">Tempunak Kapuas / Pesisir</option>
          </select>

          {/* Filter Status */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 outline-none"
          >
            <option value="Semua">Semua Status</option>
            <option value="Selesai">Selesai</option>
            <option value="Proses">Proses</option>
            <option value="Perlu Perbaikan">Perlu Perbaikan</option>
            <option value="Belum Dibina">Belum Dibina</option>
          </select>
        </div>
      </div>

      {/* Village Cards Grid (26 Villages in High Density Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {filteredVillages.map(desa => {
          const item = villageDataMap.get(desa.id);
          const coachingCount = item?.records.length || 0;
          const status = item?.latestStatus || 'Belum Dibina';
          const issuesCount = item?.issuesCount || 0;

          return (
            <div
              key={desa.id}
              className="bg-white rounded border border-slate-200 shadow-2xs hover:border-blue-400 transition flex flex-col justify-between overflow-hidden group text-xs"
            >
              {/* Card Header */}
              <div className="p-3 border-b border-slate-100">
                <div className="flex items-start justify-between gap-1.5">
                  <div className="min-w-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight bg-slate-100 px-1.5 py-0.2 rounded font-mono">
                      {desa.zonaWilayah}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 group-hover:text-blue-700 transition truncate">
                      Desa {desa.nama}
                    </h3>
                  </div>
                  <StatusBadge status={status} size="sm" />
                </div>

                {/* Village Quick Info */}
                <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 bg-slate-50 p-2 rounded">
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Kades:</span>
                    <span className="font-semibold text-slate-800 truncate block">{desa.kepalaDesa}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Kaur Keuangan:</span>
                    <span className="font-semibold text-slate-800 truncate block">{desa.kaurKeuangan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Jarak:</span>
                    <span className="font-medium text-slate-700 font-mono">{desa.jarakKm} km</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px] uppercase font-bold">Akses:</span>
                    <span className="font-medium text-slate-700 truncate block">{desa.aksesTransportasi.split('(')[0]}</span>
                  </div>
                </div>
              </div>

              {/* Coaching & Issue Stats */}
              <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <FileText className="w-3 h-3 text-slate-400" />
                    <span>Total Pembinaan:</span>
                  </span>
                  <span className="font-bold font-mono text-slate-900 bg-slate-100 px-1.5 py-0.2 rounded">
                    {coachingCount}x
                  </span>
                </div>

                {/* Issue Highlights */}
                {issuesCount > 0 ? (
                  <div className="p-1.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span><b>{issuesCount} temuan</b> butuh tindak lanjut.</span>
                  </div>
                ) : coachingCount > 0 ? (
                  <div className="p-1.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Administrasi tertib & lengkap.</span>
                  </div>
                ) : (
                  <div className="p-1.5 rounded bg-slate-50 border border-slate-200 text-slate-500 text-[10px]">
                    Belum ada sesi pembinaan tahun ini.
                  </div>
                )}

                {/* Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5">
                  <button
                    onClick={() => setSelectedDesaId(desa.id)}
                    className="flex-1 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Detail & Riwayat</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => onOpenNewPembinaanForDesa(desa.id)}
                    title="Isi Hasil Pembinaan untuk Desa Ini"
                    className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Village Full Audit History Modal */}
      {selectedVillageData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#1e293b] text-white flex items-start justify-between shrink-0">
              <div>
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Profil & Rekam Jejak Administratif
                </span>
                <h3 className="text-lg font-bold mt-0.5">
                  Desa {selectedVillageData.desa.nama}
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5 flex items-center gap-2">
                  <span>Kecamatan Tempunak &bull; {selectedVillageData.desa.zonaWilayah}</span>
                  <span>&bull; Jarak: {selectedVillageData.desa.jarakKm} km</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDesaId(null)}
                  className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto space-y-4">
              
              {/* Aparatur Desa Card */}
              <div className="bg-slate-50 p-3 rounded border border-slate-200">
                <h4 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Struktur Pemerintahan Desa</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kepala Desa:</span>
                    <span className="font-bold text-slate-900">{selectedVillageData.desa.kepalaDesa}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Sekretaris Desa:</span>
                    <span className="font-bold text-slate-900">{selectedVillageData.desa.sekretarisDesa}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kaur Keuangan:</span>
                    <span className="font-bold text-slate-900">{selectedVillageData.desa.kaurKeuangan}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kontak / HP:</span>
                    <span className="font-semibold text-blue-700 font-mono">{selectedVillageData.desa.kontak}</span>
                  </div>
                </div>
              </div>

              {/* Action Toolbar for Village */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-blue-50/70 p-2.5 rounded border border-blue-200">
                <div className="text-xs">
                  <span className="font-bold text-blue-950">
                    Total {selectedVillageData.records.length} Kali Sesi Pembinaan Tercatat
                  </span>
                  <p className="text-blue-700 text-[10px]">
                    Status Terakhir: <span className="font-semibold">{selectedVillageData.latestStatus}</span>
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      const id = selectedVillageData.desa.id;
                      setSelectedDesaId(null);
                      onScheduleVisitForDesa(id);
                    }}
                    className="px-2.5 py-1 rounded bg-white border border-blue-300 text-blue-800 text-xs font-bold hover:bg-blue-100/50 transition cursor-pointer"
                  >
                    + Jadwalkan Kunjungan
                  </button>

                  <button
                    onClick={() => {
                      const id = selectedVillageData.desa.id;
                      setSelectedDesaId(null);
                      onOpenNewPembinaanForDesa(id);
                    }}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
                  >
                    + Isi Hasil Pembinaan
                  </button>
                </div>
              </div>

              {/* Chronological Coaching History */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Riwayat Lengkap Hasil Pembinaan & Temuan Masalah</span>
                </h4>

                {selectedVillageData.records.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded border border-slate-200 text-slate-500 text-xs">
                    Belum ada riwayat pembinaan untuk Desa {selectedVillageData.desa.nama}. Klik tombol "+ Isi Hasil Pembinaan" di atas untuk mencatat sesi perdana.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedVillageData.records.map((rec, index) => (
                      <div
                        key={rec.id}
                        className="p-3 rounded border border-slate-200 bg-white hover:border-slate-300 shadow-2xs space-y-2 transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-mono text-slate-400">
                              Sesi #{selectedVillageData.records.length - index} &bull; Tanggal: <strong className="text-slate-700">{rec.tanggal}</strong>
                            </span>
                            <h5 className="text-xs font-bold text-slate-900 mt-0.5">
                              {rec.materi}
                            </h5>
                          </div>
                          <div className="flex items-center gap-1">
                            <UrgensiBadge urgensi={rec.tingkatUrgensi} />
                            <StatusBadge status={rec.status} size="sm" />
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-600 font-medium">
                          Petugas: <span className="text-slate-800 font-semibold">{rec.petugas}</span>
                        </p>

                        {/* Temuan Masalah */}
                        <div className="text-xs p-2.5 rounded bg-slate-50 border border-slate-200">
                          <span className="font-bold text-slate-700 block mb-0.5 text-[10px] uppercase">
                            Temuan Masalah / Kondisi Lapangan:
                          </span>
                          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[11px]">
                            {rec.hasil}
                          </p>
                        </div>

                        {/* Tindak Lanjut Rekomendasi */}
                        <div className="text-xs p-2.5 rounded bg-blue-50/50 border border-blue-200">
                          <span className="font-bold text-blue-900 block mb-0.5 text-[10px] uppercase">
                            Tindak Lanjut & Rekomendasi Kecamatan:
                          </span>
                          <p className="text-slate-800 whitespace-pre-wrap leading-relaxed text-[11px]">
                            {rec.tindakLanjut}
                          </p>
                          {rec.tenggatWaktu && (
                            <p className="text-rose-600 font-semibold text-[10px] mt-1">
                              Tenggat Perbaikan: {rec.tenggatWaktu}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setSelectedDesaId(null)}
                className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
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

