import React, { useState, useEffect } from 'react';
import { Desa, PembinaanRecord, StatusPembinaan, TingkatUrgensi } from '../types';
import { DAFTAR_26_DESA_TEMPUNAK, MATERI_PEMBINAAN_OPTIONS, TIM_PEMBINA_OPTIONS } from '../data/desaTempunak';
import { storage } from '../services/storage';
import { googleAuth } from '../services/googleAuth';
import { 
  X, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Calendar, 
  User, 
  FileText, 
  MapPin, 
  HelpCircle, 
  Check, 
  Sparkles,
  Link as LinkIcon
} from 'lucide-react';

interface FormPembinaanModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PembinaanRecord | null;
  defaultDesaId?: string;
  defaultTanggal?: string;
  defaultMateri?: string;
  defaultPetugas?: string;
  onSuccess?: (record: PembinaanRecord) => void;
}

export const FormPembinaanModal: React.FC<FormPembinaanModalProps> = ({
  isOpen,
  onClose,
  initialData,
  defaultDesaId,
  defaultTanggal,
  defaultMateri,
  defaultPetugas,
  onSuccess
}) => {
  const [desaId, setDesaId] = useState<string>(defaultDesaId || 'desa-01');
  const [namaDesa, setNamaDesa] = useState<string>('');
  const [tanggal, setTanggal] = useState<string>(new Date().toISOString().split('T')[0]);
  const [materi, setMateri] = useState<string>(MATERI_PEMBINAAN_OPTIONS[0]);
  const [customMateri, setCustomMateri] = useState<string>('');
  const [petugas, setPetugas] = useState<string>(TIM_PEMBINA_OPTIONS[0]);
  const [customPetugas, setCustomPetugas] = useState<string>('');
  const [hasil, setHasil] = useState<string>('');
  const [tindakLanjut, setTindakLanjut] = useState<string>('');
  const [tenggatWaktu, setTenggatWaktu] = useState<string>('');
  const [status, setStatus] = useState<StatusPembinaan>('Proses');
  const [tingkatUrgensi, setTingkatUrgensi] = useState<TingkatUrgensi>('Sedang');
  const [linkDokumen, setLinkDokumen] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedDesaInfo, setSelectedDesaInfo] = useState<Desa | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setFormError(null);
    if (initialData) {
      setDesaId(initialData.desaId || '');
      setNamaDesa(initialData.namaDesa);
      setTanggal(initialData.tanggal);
      
      if (MATERI_PEMBINAAN_OPTIONS.includes(initialData.materi)) {
        setMateri(initialData.materi);
        setCustomMateri('');
      } else {
        setMateri('Lainnya');
        setCustomMateri(initialData.materi);
      }

      if (TIM_PEMBINA_OPTIONS.includes(initialData.petugas)) {
        setPetugas(initialData.petugas);
        setCustomPetugas('');
      } else {
        setPetugas('Lainnya');
        setCustomPetugas(initialData.petugas);
      }

      setHasil(initialData.hasil);
      setTindakLanjut(initialData.tindakLanjut);
      setTenggatWaktu(initialData.tenggatWaktu || '');
      setStatus(initialData.status);
      setTingkatUrgensi(initialData.tingkatUrgensi);
      setLinkDokumen(initialData.linkDokumen || '');
    } else {
      const initDesaId = defaultDesaId || 'desa-01';
      const targetDesa = DAFTAR_26_DESA_TEMPUNAK.find(d => d.id === initDesaId);
      setDesaId(initDesaId);
      setNamaDesa(targetDesa?.nama || 'Nanga Tempunak');
      setTanggal(defaultTanggal || new Date().toISOString().split('T')[0]);
      setMateri(defaultMateri || MATERI_PEMBINAAN_OPTIONS[0]);
      setCustomMateri('');
      setPetugas(defaultPetugas || TIM_PEMBINA_OPTIONS[0]);
      setCustomPetugas('');
      setHasil('');
      setTindakLanjut('');
      setTenggatWaktu('');
      setStatus('Proses');
      setTingkatUrgensi('Sedang');
      setLinkDokumen('');
    }
  }, [initialData, defaultDesaId, defaultTanggal, defaultMateri, defaultPetugas, isOpen]);

  useEffect(() => {
    const found = DAFTAR_26_DESA_TEMPUNAK.find(d => d.id === desaId || d.nama.toLowerCase() === namaDesa.toLowerCase());
    setSelectedDesaInfo(found);
    if (found && !namaDesa) {
      setNamaDesa(found.nama);
    }
  }, [desaId, namaDesa]);

  const handleDesaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setDesaId(selectedId);
    const d = DAFTAR_26_DESA_TEMPUNAK.find(item => item.id === selectedId);
    if (d) {
      setNamaDesa(d.nama);
      setSelectedDesaInfo(d);
    }
  };

  // Quick Preset Helper for Temuan Hasil
  const applyQuickHasilPreset = (presetText: string) => {
    setHasil(prev => (prev ? `${prev}\n${presetText}` : presetText));
  };

  const applyQuickTindakLanjutPreset = (presetText: string) => {
    setTindakLanjut(prev => (prev ? `${prev}\n${presetText}` : presetText));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!namaDesa) {
      setFormError('Silakan pilih nama desa tujuan pembinaan.');
      return;
    }
    if (!hasil.trim()) {
      setFormError('Silakan isi ringkasan temuan / hasil pembinaan lapangan.');
      return;
    }

    const finalMateri = materi === 'Lainnya' && customMateri.trim() ? customMateri.trim() : materi;
    const finalPetugas = petugas === 'Lainnya' && customPetugas.trim() ? customPetugas.trim() : petugas;

    try {
      setIsSubmitting(true);

      let savedRecord: PembinaanRecord;
      if (initialData?.id) {
        const updated = await storage.updatePembinaan(initialData.id, {
          desaId,
          namaDesa,
          tanggal,
          materi: finalMateri,
          petugas: finalPetugas,
          hasil: hasil.trim(),
          tindakLanjut: tindakLanjut.trim(),
          tenggatWaktu: tenggatWaktu || undefined,
          status,
          tingkatUrgensi,
          linkDokumen: linkDokumen.trim() || undefined
        });
        savedRecord = updated || initialData;
      } else {
        savedRecord = await storage.addPembinaan({
          desaId,
          namaDesa,
          tanggal,
          materi: finalMateri,
          petugas: finalPetugas,
          hasil: hasil.trim(),
          tindakLanjut: tindakLanjut.trim(),
          tenggatWaktu: tenggatWaktu || undefined,
          status,
          tingkatUrgensi,
          linkDokumen: linkDokumen.trim() || undefined
        });
      }

      setIsSubmitting(false);
      if (onSuccess) onSuccess(savedRecord);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Terjadi kesalahan saat menyimpan data ke penyimpanan.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-xs">
        
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#1e293b] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-white">
                {initialData ? 'Ubah Hasil Pembinaan Desa' : 'Form Isian Hasil Pembinaan Desa'}
              </h2>
              <p className="text-[10px] text-slate-300">
                Tersimpan dan tersinkronisasi otomatis ke Google Sheets Kecamatan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3 text-xs">
          
          {/* Desa & Tanggal Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Nama Desa Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>1. Nama Desa (26 Desa Tempunak) *</span>
                {selectedDesaInfo && (
                  <span className="text-[10px] font-normal text-blue-700 font-mono">
                    {selectedDesaInfo.jarakKm} km
                  </span>
                )}
              </label>
              <select
                value={desaId}
                onChange={handleDesaChange}
                required
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none"
              >
                {DAFTAR_26_DESA_TEMPUNAK.map((d, index) => (
                  <option key={d.id} value={d.id}>
                    {index + 1}. Desa {d.nama} ({d.zonaWilayah})
                  </option>
                ))}
              </select>
              {selectedDesaInfo && (
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>Kades: {selectedDesaInfo.kepalaDesa} &bull; Sekdes: {selectedDesaInfo.sekretarisDesa}</span>
                </p>
              )}
            </div>

            {/* Tanggal Pembinaan */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                2. Tanggal Pembinaan *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={tanggal}
                  onChange={e => setTanggal(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-medium text-slate-800 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Materi & Petugas Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Materi / Topik */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                3. Materi / Bidang Pembinaan *
              </label>
              <select
                value={materi}
                onChange={e => setMateri(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none mb-1.5"
              >
                {MATERI_PEMBINAAN_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="Lainnya">-- Materi / Topik Lainnya --</option>
              </select>

              {materi === 'Lainnya' && (
                <input
                  type="text"
                  placeholder="Ketik topik materi pembinaan..."
                  value={customMateri}
                  onChange={e => setCustomMateri(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 outline-none"
                />
              )}
            </div>

            {/* Petugas / Tim Pembina */}
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                4. Tim / Petugas Pembina *
              </label>
              <select
                value={petugas}
                onChange={e => setPetugas(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-800 focus:border-blue-500 outline-none mb-1.5"
              >
                {TIM_PEMBINA_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
                <option value="Lainnya">-- Nama Petugas Lainnya --</option>
              </select>

              {petugas === 'Lainnya' && (
                <input
                  type="text"
                  placeholder="Nama petugas / tim pembina..."
                  value={customPetugas}
                  onChange={e => setCustomPetugas(e.target.value)}
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 outline-none"
                />
              )}
            </div>
          </div>

          {/* Status & Urgensi Selector Row */}
          <div className="bg-slate-50 p-2.5 rounded border border-slate-200 space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Status Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  5. Status Hasil Pembinaan *
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatus('Selesai')}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 border transition cursor-pointer ${
                      status === 'Selesai'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-emerald-800 border-slate-300 hover:bg-emerald-50'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Selesai</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('Proses')}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 border transition cursor-pointer ${
                      status === 'Proses'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-white text-amber-800 border-slate-300 hover:bg-amber-50'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Proses</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatus('Perlu Perbaikan')}
                    className={`py-1.5 px-2 rounded text-[11px] font-bold flex items-center justify-center gap-1 border transition cursor-pointer ${
                      status === 'Perlu Perbaikan'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'bg-white text-rose-800 border-slate-300 hover:bg-rose-50'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Perbaikan</span>
                  </button>
                </div>
              </div>

              {/* Tingkat Urgensi */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  6. Tingkat Urgensi Tindak Lanjut
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Rendah', 'Sedang', 'Tinggi'] as TingkatUrgensi[]).map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setTingkatUrgensi(lvl)}
                      className={`py-1.5 px-2 rounded text-[11px] font-semibold border transition cursor-pointer ${
                        tingkatUrgensi === lvl
                          ? lvl === 'Tinggi'
                            ? 'bg-red-600 text-white border-red-600'
                            : lvl === 'Sedang'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Temuan & Hasil Pembinaan */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                7. Hasil Pembinaan & Temuan Lapangan *
              </label>
            </div>
            
            {/* Quick Helper Chips for Lapangan */}
            <div className="flex flex-wrap gap-1 mb-1.5">
              <span className="text-[10px] text-slate-400 self-center mr-0.5">Preset:</span>
              <button
                type="button"
                onClick={() => applyQuickHasilPreset('Kelengkapan administrasi BKU dan SPJ sudah 100% lengkap dan sesuai.')}
                className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
              >
                + Berkas Lengkap
              </button>
              <button
                type="button"
                onClick={() => applyQuickHasilPreset('Terdapat kuitansi dan nota belanja yang belum ditandatangani serta cap basah.')}
                className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
              >
                + Kuitansi Belum Lengkap
              </button>
              <button
                type="button"
                onClick={() => applyQuickHasilPreset('Buku register inventaris aset desa (KIB) belum dimutakhirkan.')}
                className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
              >
                + Aset Belum Dicatat
              </button>
            </div>

            <textarea
              rows={3}
              value={hasil}
              onChange={e => setHasil(e.target.value)}
              required
              placeholder="Jelaskan kondisi administratif desa, temuan pemeriksaan fisik/dokumen, catatan pembukuan, dll..."
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Tindak Lanjut & Tenggat Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                  8. Rekomendasi & Rencana Tindak Lanjut *
                </label>
              </div>

              {/* Quick Helper Chips */}
              <div className="flex flex-wrap gap-1 mb-1.5">
                <button
                  type="button"
                  onClick={() => applyQuickTindakLanjutPreset('Kaur Keuangan dan Sekdes segera memperbaiki SPJ dalam 7 hari kerja.')}
                  className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  + Revisi 7 Hari Kerja
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickTindakLanjutPreset('Pertahankan tata kelola dan lakukan koordinasi rutin dengan pendamping desa.')}
                  className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  + Pertahankan Kualitas
                </button>
              </div>

              <textarea
                rows={2}
                value={tindakLanjut}
                onChange={e => setTindakLanjut(e.target.value)}
                required
                placeholder="Rekomendasi yang wajib dipenuhi pemerintah desa..."
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:border-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                9. Tenggat Waktu
              </label>
              <input
                type="date"
                value={tenggatWaktu}
                onChange={e => setTenggatWaktu(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:border-blue-500 outline-none"
              />
              <p className="text-[9px] text-slate-400 mt-1">Batas waktu desa melengkapi perbaikan</p>
            </div>
          </div>

          {/* Link Dokumen / Tanda Terima (Opsional) */}
          <div>
            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
              <LinkIcon className="w-3 h-3 text-slate-500" />
              <span>10. Link Dokumen / Foto / Tanda Terima (Opsional)</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: https://drive.google.com/... atau catatan berkas"
              value={linkDokumen}
              onChange={e => setLinkDokumen(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs text-slate-800 focus:border-blue-500 outline-none"
            />
          </div>

          {/* Inline Form Error Notification */}
          {formError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-medium">{formError}</span>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Menyimpan...' : initialData ? 'Simpan Perubahan' : 'Simpan Hasil Pembinaan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
