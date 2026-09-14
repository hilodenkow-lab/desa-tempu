import React, { useState } from 'react';
import { JadwalKunjungan, Desa } from '../types';
import { DAFTAR_26_DESA_TEMPUNAK, TIM_PEMBINA_OPTIONS, MATERI_PEMBINAAN_OPTIONS } from '../data/desaTempunak';
import { storage } from '../services/storage';
import { googleAuth } from '../services/googleAuth';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Users, 
  Plus, 
  CheckCircle2, 
  ExternalLink, 
  Trash2, 
  Edit3, 
  CalendarDays, 
  FileText, 
  X, 
  Save, 
  Share2,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';

interface JadwalKalenderViewProps {
  jadwalList: JadwalKunjungan[];
  onConvertToPembinaan: (jadwal: JadwalKunjungan) => void;
  preSelectedDesaId?: string | null;
}

export const JadwalKalenderView: React.FC<JadwalKalenderViewProps> = ({
  jadwalList,
  onConvertToPembinaan,
  preSelectedDesaId
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJadwal, setEditingJadwal] = useState<JadwalKunjungan | null>(null);

  // Form states
  const [desaId, setDesaId] = useState<string>(preSelectedDesaId || 'desa-01');
  const [namaDesa, setNamaDesa] = useState<string>('Nanga Tempunak');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [waktuMulai, setWaktuMulai] = useState<string>('09:00');
  const [waktuSelesai, setWaktuSelesai] = useState<string>('12:00');
  const [timPembina, setTimPembina] = useState<string>(TIM_PEMBINA_OPTIONS[0]);
  const [customTim, setCustomTim] = useState<string>('');
  const [agenda, setAgenda] = useState<string>(MATERI_PEMBINAAN_OPTIONS[0]);
  const [customAgenda, setCustomAgenda] = useState<string>('');
  const [lokasi, setLokasi] = useState<string>('Kantor Desa Nanga Tempunak, Kec. Tempunak');
  const [catatanPersiapan, setCatatanPersiapan] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [deletingJadwalId, setDeletingJadwalId] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  const authState = googleAuth.getState();

  const handleOpenNewModal = (defaultDesa?: string) => {
    const initDesaId = defaultDesa || preSelectedDesaId || 'desa-01';
    const d = DAFTAR_26_DESA_TEMPUNAK.find(item => item.id === initDesaId);
    setDesaId(initDesaId);
    setNamaDesa(d?.nama || 'Nanga Tempunak');
    setTanggal(new Date().toISOString().split('T')[0]);
    setWaktuMulai('09:00');
    setWaktuSelesai('12:00');
    setTimPembina(TIM_PEMBINA_OPTIONS[0]);
    setCustomTim('');
    setAgenda(MATERI_PEMBINAAN_OPTIONS[0]);
    setCustomAgenda('');
    setLokasi(`Kantor Desa ${d?.nama || 'Nanga Tempunak'}, Kec. Tempunak`);
    setCatatanPersiapan('');
    setEditingJadwal(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleEditJadwal = (item: JadwalKunjungan) => {
    setEditingJadwal(item);
    setDesaId(item.desaId);
    setNamaDesa(item.namaDesa);
    setTanggal(item.tanggal);
    setWaktuMulai(item.waktuMulai);
    setWaktuSelesai(item.waktuSelesai);

    if (TIM_PEMBINA_OPTIONS.includes(item.timPembina)) {
      setTimPembina(item.timPembina);
      setCustomTim('');
    } else {
      setTimPembina('Lainnya');
      setCustomTim(item.timPembina);
    }

    if (MATERI_PEMBINAAN_OPTIONS.includes(item.agenda)) {
      setAgenda(item.agenda);
      setCustomAgenda('');
    } else {
      setAgenda('Lainnya');
      setCustomAgenda(item.agenda);
    }

    setLokasi(item.lokasi);
    setCatatanPersiapan(item.catatanPersiapan || '');
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDesaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sId = e.target.value;
    setDesaId(sId);
    const d = DAFTAR_26_DESA_TEMPUNAK.find(item => item.id === sId);
    if (d) {
      setNamaDesa(d.nama);
      setLokasi(`Kantor Desa ${d.nama}, Kec. Tempunak`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTim = timPembina === 'Lainnya' && customTim.trim() ? customTim.trim() : timPembina;
    const finalAgenda = agenda === 'Lainnya' && customAgenda.trim() ? customAgenda.trim() : agenda;

    try {
      setIsSubmitting(true);
      if (editingJadwal) {
        await storage.updateJadwal(editingJadwal.id, {
          desaId,
          namaDesa,
          tanggal,
          waktuMulai,
          waktuSelesai,
          timPembina: finalTim,
          agenda: finalAgenda,
          lokasi,
          catatanPersiapan
        });
      } else {
        await storage.addJadwal({
          desaId,
          namaDesa,
          tanggal,
          waktuMulai,
          waktuSelesai,
          timPembina: finalTim,
          agenda: finalAgenda,
          lokasi,
          status: 'Terjadwal',
          catatanPersiapan
        });
      }

      setIsSubmitting(false);
      setIsModalOpen(false);
      setSyncNotice('Jadwal kunjungan berhasil disimpan' + (authState.isAuthenticated ? ' dan disinkronkan ke Google Calendar!' : '.'));
      setTimeout(() => setSyncNotice(null), 4000);
    } catch (err: any) {
      setIsSubmitting(false);
      setModalError(err.message || 'Gagal menyimpan jadwal kunjungan.');
    }
  };

  const handleDeleteJadwal = async (id: string) => {
    await storage.deleteJadwal(id);
    setDeletingJadwalId(null);
  };

  const handleStatusChange = async (item: JadwalKunjungan, newStatus: 'Terjadwal' | 'Selesai' | 'Ditunda' | 'Dibatalkan') => {
    await storage.updateJadwal(item.id, { status: newStatus });
  };

  return (
    <div className="space-y-3">
      
      {/* Banner / Toolbar */}
      <div className="bg-white rounded border border-slate-200 p-2.5 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
              <CalendarDays className="w-4 h-4 text-blue-600" />
              <span>Jadwal Kunjungan Lapangan & Agenda Google Calendar</span>
            </h2>
            {authState.isAuthenticated && (
              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Sync Aktif
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Jadwalkan agenda supervisi pembinaan 26 desa Tempunak & sinkronkan otomatis ke Google Calendar petugas.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          {!authState.isAuthenticated && (
            <button
              onClick={() => googleAuth.signIn()}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1 border border-slate-300 cursor-pointer"
            >
              <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Hubungkan Kalender</span>
            </button>
          )}

          <button
            onClick={() => handleOpenNewModal()}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Buat Jadwal</span>
          </button>
        </div>
      </div>

      {syncNotice && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-2 rounded text-xs font-medium flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>{syncNotice}</span>
        </div>
      )}

      {/* Visits List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Daftar Agenda Kunjungan Pembinaan ({jadwalList.length} Kegiatan)
          </h3>
        </div>

        {jadwalList.length === 0 ? (
          <div className="bg-white rounded border border-slate-200 p-8 text-center text-slate-500 text-xs">
            <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
            <p className="font-semibold text-slate-700">Belum ada agenda kunjungan yang dijadwalkan.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Klik tombol "+ Buat Jadwal" di atas untuk menambahkan agenda baru.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {jadwalList.map(item => (
              <div
                key={item.id}
                className="bg-white rounded border border-slate-200 shadow-2xs hover:border-slate-300 transition p-3 flex flex-col justify-between space-y-2.5 text-xs"
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-1.5">
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      Desa {item.namaDesa}
                    </span>
                    
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        item.status === 'Selesai'
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.status === 'Ditunda'
                          ? 'bg-amber-100 text-amber-800'
                          : item.status === 'Dibatalkan'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-2 leading-tight">
                    {item.agenda}
                  </h4>
                </div>

                {/* Details */}
                <div className="space-y-1 text-[11px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-150">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3 text-slate-400 shrink-0" />
                    <span className="font-bold text-slate-800">{item.tanggal}</span>
                    <span className="text-slate-500 font-mono text-[10px]">({item.waktuMulai} - {item.waktuSelesai})</span>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <Users className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-700 font-medium line-clamp-1">{item.timPembina}</span>
                  </div>

                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-slate-500 truncate">{item.lokasi}</span>
                  </div>

                  {item.catatanPersiapan && (
                    <div className="pt-1 border-t border-slate-200 text-[10px] text-slate-500 italic line-clamp-2">
                      Catatan: {item.catatanPersiapan}
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="pt-1.5 border-t border-slate-100 flex flex-col gap-1.5">
                  
                  {/* Convert to Pembinaan Record Button */}
                  <button
                    onClick={() => onConvertToPembinaan(item)}
                    className="w-full py-1 px-2 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Input Hasil Pembinaan</span>
                  </button>

                  <div className="flex items-center justify-between gap-1">
                    <select
                      value={item.status}
                      onChange={e => handleStatusChange(item, e.target.value as any)}
                      className="text-[10px] px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-700 font-medium outline-none cursor-pointer"
                    >
                      <option value="Terjadwal">Status: Terjadwal</option>
                      <option value="Selesai">Status: Selesai</option>
                      <option value="Ditunda">Status: Ditunda</option>
                      <option value="Dibatalkan">Status: Dibatalkan</option>
                    </select>

                    <div className="flex items-center gap-0.5">
                      {deletingJadwalId === item.id ? (
                        <div className="flex items-center gap-1 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                          <span className="text-[10px] text-rose-700 font-semibold">Hapus?</span>
                          <button
                            onClick={() => handleDeleteJadwal(item.id)}
                            className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold hover:bg-rose-700 transition cursor-pointer"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setDeletingJadwalId(null)}
                            className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] hover:bg-slate-300 transition cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEditJadwal(item)}
                            className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                            title="Edit Jadwal"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingJadwalId(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Hapus Jadwal"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Jadwal Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-y-auto max-h-[92vh] text-xs">
            
            <div className="flex items-center justify-between bg-[#1e293b] text-white px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center">
                  <CalendarDays className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                  {editingJadwal ? 'Edit Jadwal Kunjungan Lapangan' : 'Buat Jadwal Kunjungan Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-3 text-xs">
              
              {/* Desa Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Desa Tujuan *
                </label>
                <select
                  value={desaId}
                  onChange={handleDesaChange}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none"
                >
                  {DAFTAR_26_DESA_TEMPUNAK.map(d => (
                    <option key={d.id} value={d.id}>
                      Desa {d.nama} ({d.jarakKm} km &bull; {d.zonaWilayah})
                    </option>
                  ))}
                </select>
              </div>

              {/* Tanggal & Waktu */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal *
                  </label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={e => setTanggal(e.target.value)}
                    required
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mulai
                  </label>
                  <input
                    type="time"
                    value={waktuMulai}
                    onChange={e => setWaktuMulai(e.target.value)}
                    required
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs focus:border-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Selesai
                  </label>
                  <input
                    type="time"
                    value={waktuSelesai}
                    onChange={e => setWaktuSelesai(e.target.value)}
                    required
                    className="w-full px-2 py-1.5 bg-white border border-slate-300 rounded text-xs focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Tim Pembina / PIC */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tim Pembina / Koordinator PIC *
                </label>
                <select
                  value={timPembina}
                  onChange={e => setTimPembina(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none mb-1"
                >
                  {TIM_PEMBINA_OPTIONS.map(t => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                  <option value="Lainnya">-- Tim Lainnya / Khusus --</option>
                </select>
                {timPembina === 'Lainnya' && (
                  <input
                    type="text"
                    placeholder="Nama tim / petugas..."
                    value={customTim}
                    onChange={e => setCustomTim(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none"
                  />
                )}
              </div>

              {/* Agenda Pembinaan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fokus Agenda / Materi Pembinaan *
                </label>
                <select
                  value={agenda}
                  onChange={e => setAgenda(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none mb-1"
                >
                  {MATERI_PEMBINAAN_OPTIONS.map(m => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                  <option value="Lainnya">-- Agenda Lainnya --</option>
                </select>
                {agenda === 'Lainnya' && (
                  <input
                    type="text"
                    placeholder="Topik agenda pembinaan..."
                    value={customAgenda}
                    onChange={e => setCustomAgenda(e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs outline-none"
                  />
                )}
              </div>

              {/* Lokasi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Lokasi Pertemuan
                </label>
                <input
                  type="text"
                  value={lokasi}
                  onChange={e => setLokasi(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:border-blue-500 outline-none"
                />
              </div>

              {/* Catatan Persiapan */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Persiapan & Logistik (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={catatanPersiapan}
                  onChange={e => setCatatanPersiapan(e.target.value)}
                  placeholder="Contoh: Bawa draft formulir LPJ, koordinasi perahu motor H-1..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:border-blue-500 outline-none"
                />
              </div>

              {/* Inline Error Alert */}
              {modalError && (
                <div className="p-2 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Sinkronkan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
