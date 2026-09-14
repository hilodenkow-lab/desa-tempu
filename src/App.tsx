import React, { useState, useEffect } from 'react';
import { ViewTab, PembinaanRecord, JadwalKunjungan } from './types';
import { storage } from './services/storage';
import { googleAuth } from './services/googleAuth';
import { Header } from './components/Header';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { FormPembinaanView } from './components/FormPembinaanView';
import { FormPembinaanModal } from './components/FormPembinaanModal';
import { RekapDesaView } from './components/RekapDesaView';
import { JadwalKalenderView } from './components/JadwalKalenderView';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { LaporanCetakModal } from './components/LaporanCetakModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<ViewTab>('dashboard');
  const [records, setRecords] = useState<PembinaanRecord[]>(storage.getPembinaanList());
  const [jadwalList, setJadwalList] = useState<JadwalKunjungan[]>(storage.getJadwalList());
  
  // Modals & Dynamic Form State
  const [isPembinaanModalOpen, setIsPembinaanModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PembinaanRecord | null>(null);
  const [defaultFormDesaId, setDefaultFormDesaId] = useState<string | undefined>(undefined);
  const [defaultFormTanggal, setDefaultFormTanggal] = useState<string | undefined>(undefined);
  const [defaultFormMateri, setDefaultFormMateri] = useState<string | undefined>(undefined);
  const [defaultFormPetugas, setDefaultFormPetugas] = useState<string | undefined>(undefined);

  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);
  const [rekapSelectedDesaId, setRekapSelectedDesaId] = useState<string | null>(null);

  // Subscribe to storage updates & init Google Client
  useEffect(() => {
    googleAuth.initTokenClient();

    const unsub = storage.subscribe(() => {
      setRecords(storage.getPembinaanList());
      setJadwalList(storage.getJadwalList());
    });

    return () => unsub();
  }, []);

  const stats = storage.getStatistics();

  // Handlers
  const handleOpenNewPembinaan = (desaId?: string) => {
    setEditingRecord(null);
    setDefaultFormDesaId(desaId || 'desa-01');
    setDefaultFormTanggal(undefined);
    setDefaultFormMateri(undefined);
    setDefaultFormPetugas(undefined);
    setIsPembinaanModalOpen(true);
  };

  const handleEditPembinaan = (record: PembinaanRecord) => {
    setEditingRecord(record);
    setDefaultFormDesaId(record.desaId);
    setIsPembinaanModalOpen(true);
  };

  const handleConvertToPembinaan = (jadwal: JadwalKunjungan) => {
    setEditingRecord(null);
    setDefaultFormDesaId(jadwal.desaId);
    setDefaultFormTanggal(jadwal.tanggal);
    setDefaultFormMateri(jadwal.agenda);
    setDefaultFormPetugas(jadwal.timPembina);
    setIsPembinaanModalOpen(true);
  };

  const handleViewDesaDetail = (desaId: string) => {
    setRekapSelectedDesaId(desaId);
    setCurrentTab('rekap-desa');
  };

  const handleScheduleVisitForDesa = (desaId: string) => {
    setRekapSelectedDesaId(desaId);
    setCurrentTab('jadwal');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-blue-600 selection:text-white">
      
      {/* Top Header */}
      <Header
        onOpenNewPembinaan={() => handleOpenNewPembinaan()}
        onOpenSyncModal={() => setCurrentTab('settings')}
        onOpenPrintReport={() => setIsPrintReportOpen(true)}
      />

      {/* Tab Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={tab => {
          setCurrentTab(tab);
          if (tab !== 'rekap-desa') {
            setRekapSelectedDesaId(null);
          }
        }}
        urgentIssuesCount={stats.countPerluPerbaikan}
      />

      {/* Main Tab Views */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-4 lg:px-6 py-3.5">
        
        {currentTab === 'dashboard' && (
          <DashboardView
            records={records}
            onOpenNewPembinaan={() => handleOpenNewPembinaan()}
            onEditPembinaan={handleEditPembinaan}
            onViewDesaDetail={handleViewDesaDetail}
          />
        )}

        {currentTab === 'form' && (
          <FormPembinaanView
            onRecordCreated={rec => {
              setRecords(storage.getPembinaanList());
            }}
            onNavigateToDashboard={() => setCurrentTab('dashboard')}
            onNavigateToRekap={() => setCurrentTab('rekap-desa')}
          />
        )}

        {currentTab === 'rekap-desa' && (
          <RekapDesaView
            records={records}
            initialSelectedDesaId={rekapSelectedDesaId}
            onOpenNewPembinaanForDesa={desaId => handleOpenNewPembinaan(desaId)}
            onScheduleVisitForDesa={handleScheduleVisitForDesa}
          />
        )}

        {currentTab === 'jadwal' && (
          <JadwalKalenderView
            jadwalList={jadwalList}
            onConvertToPembinaan={handleConvertToPembinaan}
            preSelectedDesaId={rekapSelectedDesaId}
          />
        )}

        {currentTab === 'settings' && (
          <GoogleSyncModal
            onDataChanged={() => {
              setRecords(storage.getPembinaanList());
              setJadwalList(storage.getJadwalList());
            }}
          />
        )}
      </main>

      {/* Quick Add / Edit Form Modal */}
      <FormPembinaanModal
        isOpen={isPembinaanModalOpen}
        onClose={() => setIsPembinaanModalOpen(false)}
        initialData={editingRecord}
        defaultDesaId={defaultFormDesaId}
        defaultTanggal={defaultFormTanggal}
        defaultMateri={defaultFormMateri}
        defaultPetugas={defaultFormPetugas}
        onSuccess={rec => {
          setRecords(storage.getPembinaanList());
        }}
      />

      {/* Printable Camat Report Modal */}
      <LaporanCetakModal
        isOpen={isPrintReportOpen}
        onClose={() => setIsPrintReportOpen(false)}
        records={records}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <p>
            <strong>BINA DESA TEMPU</strong> &bull; Sistem Monitoring & Rekam Jejak Pembinaan Administratif 26 Desa Kecamatan Tempunak
          </p>
          <p className="text-slate-400">
            Pemerintah Kabupaten Sintang &bull; Terintegrasi Google Sheets & Calendar
          </p>
        </div>
      </footer>
    </div>
  );
}
