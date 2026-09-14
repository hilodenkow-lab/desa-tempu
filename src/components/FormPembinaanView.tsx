import React, { useState } from 'react';
import { FormPembinaanModal } from './FormPembinaanModal';
import { DAFTAR_26_DESA_TEMPUNAK, MATERI_PEMBINAAN_OPTIONS } from '../data/desaTempunak';
import { PembinaanRecord } from '../types';
import { FileText, CheckCircle2, MapPin, Plus, ArrowRight, Building2 } from 'lucide-react';

interface FormPembinaanViewProps {
  onRecordCreated: (record: PembinaanRecord) => void;
  onNavigateToDashboard: () => void;
  onNavigateToRekap: () => void;
}

export const FormPembinaanView: React.FC<FormPembinaanViewProps> = ({
  onRecordCreated,
  onNavigateToDashboard,
  onNavigateToRekap
}) => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [lastSaved, setLastSaved] = useState<PembinaanRecord | null>(null);

  const handleSuccess = (record: PembinaanRecord) => {
    setLastSaved(record);
    onRecordCreated(record);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-3">
      
      {/* High Density Banner Card */}
      <div className="bg-[#1e293b] text-white rounded border border-slate-800 p-3.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase tracking-tight">
                Formulir Lapangan
              </span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Pencatatan Hasil Pembinaan Desa
              </h2>
            </div>
            <p className="text-slate-300 text-[11px] mt-0.5">
              Gunakan saat supervisi ke 26 kantor desa di Kecamatan Tempunak. Data langsung terintegrasi otomatis ke Google Sheets.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-2xs transition cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Buka Form Isian</span>
          </button>
        </div>
      </div>

      {/* Success Summary if just saved */}
      {lastSaved && (
        <div className="bg-emerald-50 border border-emerald-200 rounded p-3 text-xs">
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-bold text-emerald-900">
                Hasil Pembinaan Desa {lastSaved.namaDesa} Berhasil Disimpan!
              </h3>
              <p className="text-[11px] text-emerald-700 mt-0.5">
                Topik: {lastSaved.materi} &bull; Status: <span className="font-semibold">{lastSaved.status}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-2.5 py-1 rounded bg-emerald-600 text-white text-[11px] font-bold hover:bg-emerald-700"
                >
                  + Isi Pembinaan Desa Lainnya
                </button>
                <button
                  onClick={onNavigateToDashboard}
                  className="px-2.5 py-1 rounded bg-white border border-emerald-300 text-emerald-800 text-[11px] font-bold hover:bg-emerald-100/50"
                >
                  Lihat di Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Village Quick Select Grid */}
      <div className="bg-white rounded border border-slate-200 p-3 shadow-2xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          <span>Pilih Cepat 26 Desa untuk Membuka Form Isian</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {DAFTAR_26_DESA_TEMPUNAK.map(desa => (
            <button
              key={desa.id}
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 text-left transition flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800 group-hover:text-blue-700 truncate">
                  {desa.nama}
                </span>
                <span className="text-[9px] text-slate-400 font-mono">{desa.jarakKm}km</span>
              </div>
              <span className="text-[10px] text-slate-500 truncate mt-1">
                {desa.kepalaDesa}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Form */}
      <FormPembinaanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

