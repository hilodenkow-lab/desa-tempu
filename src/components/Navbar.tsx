import React from 'react';
import { ViewTab } from '../types';
import { 
  LayoutDashboard, 
  FileText, 
  MapPin, 
  CalendarDays, 
  Settings2,
  AlertTriangle
} from 'lucide-react';

interface NavbarProps {
  currentTab: ViewTab;
  onSelectTab: (tab: ViewTab) => void;
  urgentIssuesCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  urgentIssuesCount
}) => {
  const tabs: Array<{ id: ViewTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }> = [
    { id: 'dashboard', label: 'Dashboard Progress', icon: LayoutDashboard },
    { id: 'form', label: 'Form Pembinaan Lapangan', icon: FileText },
    { id: 'rekap-desa', label: 'Rekap Masalah 26 Desa', icon: MapPin, badge: urgentIssuesCount > 0 ? urgentIssuesCount : undefined },
    { id: 'jadwal', label: 'Jadwal & Google Calendar', icon: CalendarDays },
    { id: 'settings', label: 'Koneksi Google API', icon: Settings2 }
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-14 z-30 shadow-2xs no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-1.5 no-scrollbar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-600 text-white flex items-center justify-center font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

