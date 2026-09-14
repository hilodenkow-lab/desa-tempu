import React, { useMemo } from 'react';
import { PembinaanRecord, Desa } from '../types';
import { DAFTAR_26_DESA_TEMPUNAK } from '../data/desaTempunak';
import { storage } from '../services/storage';
import { Printer, X, Building2, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

interface LaporanCetakModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PembinaanRecord[];
}

export const LaporanCetakModal: React.FC<LaporanCetakModalProps> = ({
  isOpen,
  onClose,
  records
}) => {
  const stats = useMemo(() => storage.getStatistics(), [records]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden">
        
        {/* Controls Toolbar (hidden during print) */}
        <div className="px-4 py-2.5 bg-[#1e293b] text-white flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Pratinjau Cetak Laporan Eksekutif Camat</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Formal Printable Document Content */}
        <div className="p-8 sm:p-12 overflow-y-auto text-slate-900 font-sans space-y-6 bg-white" id="printable-report">
          
          {/* Formal Letterhead (Kop Surat) */}
          <div className="border-b-4 border-double border-slate-900 pb-4 text-center">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
              PEMERINTAH KABUPATEN SINTANG
            </h4>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
              KECAMATAN TEMPUNAK
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              Jalan Poros Nanga Tempunak, Kode Pos 78661 &bull; Kabupaten Sintang, Kalimantan Barat
            </p>
          </div>

          {/* Report Title */}
          <div className="text-center pt-2">
            <h3 className="text-base sm:text-lg font-bold uppercase underline tracking-wide text-slate-900">
              LAPORAN MONITORING & HASIL PEMBINAAN ADMINISTRATIF DESA
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Periode: Tahun Anggaran 2026 &bull; Wilayah Kerja: 26 Desa Se-Kecamatan Tempunak
            </p>
          </div>

          {/* Ringkasan Eksekutif */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase">I. RINGKASAN CAPAIAN & EVALUASI</h4>
            <p className="text-slate-700 leading-relaxed text-justify">
              Berdasarkan hasil pembinaan administratif berkala yang dilaksanakan oleh Tim Pembina Kecamatan Tempunak terhadap 26 (dua puluh enam) desa, diperoleh rekapitulasi capaian dan status tindak lanjut sebagai berikut:
            </p>

            <div className="grid grid-cols-4 gap-2 text-center pt-2">
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                <span className="text-[10px] text-slate-500 block">Total Desa</span>
                <strong className="text-base font-bold text-slate-900">{stats.totalDesa} Desa</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                <span className="text-[10px] text-slate-500 block">Telah Dibina</span>
                <strong className="text-base font-bold text-emerald-800">{stats.totalDesaDibina} Desa ({stats.persentaseCakupan}%)</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                <span className="text-[10px] text-slate-500 block">Status Selesai</span>
                <strong className="text-base font-bold text-emerald-700">{stats.countSelesai} Desa</strong>
              </div>
              <div className="p-2.5 bg-slate-50 border border-slate-300 rounded">
                <span className="text-[10px] text-slate-500 block">Perlu Perbaikan</span>
                <strong className="text-base font-bold text-rose-700">{stats.countPerluPerbaikan} Desa</strong>
              </div>
            </div>
          </div>

          {/* Matriks Hasil Pembinaan 26 Desa */}
          <div className="space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 uppercase">II. MATRIKS REKAM JEJAK PEMBINAAN DESA</h4>
            
            <table className="w-full border-collapse border border-slate-400 text-[11px]">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold text-center">
                  <th className="border border-slate-400 p-1.5 w-8">No</th>
                  <th className="border border-slate-400 p-1.5 text-left">Nama Desa</th>
                  <th className="border border-slate-400 p-1.5">Kades / Sekdes</th>
                  <th className="border border-slate-400 p-1.5">Tanggal</th>
                  <th className="border border-slate-400 p-1.5 text-left">Topik & Temuan Utama</th>
                  <th className="border border-slate-400 p-1.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {DAFTAR_26_DESA_TEMPUNAK.map((desa, idx) => {
                  const desaRecords = records.filter(
                    r => r.desaId === desa.id || r.namaDesa.toLowerCase() === desa.nama.toLowerCase()
                  );
                  const latest = desaRecords[0];

                  return (
                    <tr key={desa.id} className="border-b border-slate-300">
                      <td className="border border-slate-400 p-1.5 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-400 p-1.5 font-bold">{desa.nama}</td>
                      <td className="border border-slate-400 p-1.5 text-slate-700">
                        {desa.kepalaDesa} / {desa.sekretarisDesa}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-mono">
                        {latest ? latest.tanggal : '-'}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-slate-800">
                        {latest ? (
                          <div>
                            <span className="font-semibold block">{latest.materi}</span>
                            <span className="text-[10px] text-slate-600 line-clamp-2">{latest.hasil}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Belum terjadwal supervisi</span>
                        )}
                      </td>
                      <td className="border border-slate-400 p-1.5 text-center font-semibold">
                        {latest ? latest.status : 'Belum'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Rekomendasi & Catatan Camat */}
          <div className="space-y-1.5 text-xs text-justify">
            <h4 className="font-bold text-slate-900 uppercase">III. REKOMENDASI & TINDAK LANJUT KECAMATAN</h4>
            <ol className="list-decimal pl-4 space-y-1 text-slate-800">
              <li>Pemerintah Desa yang memiliki catatan temuan status <em>"Perlu Perbaikan"</em> wajib menyelesaikan revisi SPJ/administrasi paling lambat 7 (tujuh) hari kerja sejak pembinaan.</li>
              <li>Seksi Tata Pemerintahan dan PMD Kecamatan agar melakukan pemantauan tindak lanjut secara berkala sebelum rekomendasi pencairan tahap berikutnya diterbitkan.</li>
              <li>Data rekam jejak ini diarsipkan dan terintegrasi langsung dengan database Google Sheets Kecamatan Tempunak.</li>
            </ol>
          </div>

          {/* Signature Area */}
          <div className="pt-8 grid grid-cols-2 text-xs text-center">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Sekretaris Kecamatan Tempunak</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900 underline">HERMANUS, S.IP., M.Si</p>
              <p className="text-[11px] text-slate-600">NIP. 19780512 200312 1 004</p>
            </div>

            <div>
              <p className="text-slate-600">Nanga Tempunak, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold text-slate-900 mt-0.5">Camat Tempunak</p>
              <div className="h-16" />
              <p className="font-bold text-slate-900 underline">MARSELINUS, S.Sos., M.Si</p>
              <p className="text-[11px] text-slate-600">Pembina Tk. I (IV/b) &bull; NIP. 19720415 199803 1 007</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
