import React from 'react';
import { StatusPembinaan, TingkatUrgensi } from '../types';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: StatusPembinaan | 'Belum Dibina';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm', showIcon = false }) => {
  switch (status) {
    case 'Selesai':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-tight">
          {showIcon && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
          <span>SELESAI</span>
        </span>
      );
    case 'Proses':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200/80 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-tight">
          {showIcon && <Clock className="w-2.5 h-2.5 text-blue-600" />}
          <span>PROSES</span>
        </span>
      );
    case 'Perlu Perbaikan':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 border border-amber-200/80 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-tight">
          {showIcon && <AlertTriangle className="w-2.5 h-2.5 text-amber-600" />}
          <span>PERBAIKAN</span>
        </span>
      );
    case 'Belum Dibina':
    default:
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-tight">
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />}
          <span>BELUM DIBINA</span>
        </span>
      );
  }
};

interface UrgensiBadgeProps {
  urgensi: TingkatUrgensi;
}

export const UrgensiBadge: React.FC<UrgensiBadgeProps> = ({ urgensi }) => {
  switch (urgensi) {
    case 'Tinggi':
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 border border-rose-200/80">
          <AlertCircle className="w-2.5 h-2.5 text-rose-600" />
          <span>TINGGI</span>
        </span>
      );
    case 'Sedang':
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200/80">
          <span>SEDANG</span>
        </span>
      );
    case 'Rendah':
    default:
      return (
        <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
          <span>NORMAL</span>
        </span>
      );
  }
};

