/**
 * Modal GAS Center (Headless API Endpoint & Data Sync Console)
 * File: GasCenterModal[RekapCengkeh].tsx
 */
import React, { useState } from 'react';
import { X, Database, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Terminal, Save, RotateCcw } from 'lucide-react';
import { GasConfig } from './types[RekapCengkeh]';
import { saveGasConfig, DEFAULT_EXEC_URL, DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME } from './Code[RekapCengkeh]';

interface GasCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasConfig;
  onSaveConfig: (cfg: GasConfig) => void;
  onForceRebuildCache: () => void;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
}

export const GasCenterModalRekapCengkeh: React.FC<GasCenterModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onForceRebuildCache,
  onManualSync,
  isSyncing
}) => {
  if (!isOpen) return null;

  const [execUrl, setExecUrl] = useState(config.execUrl);
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = () => {
    const updated: GasConfig = {
      ...config,
      execUrl: execUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim()
    };
    saveGasConfig(updated);
    onSaveConfig(updated);
    setTestResult({
      status: 'success',
      message: 'Konfigurasi endpoint GAS berhasil disimpan ke penyimpanan lokal!'
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle', message: 'Menguji konektivitas endpoint...' });
    try {
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
      const res = await fetch(gvizUrl);
      if (res.ok) {
        setTestResult({
          status: 'success',
          message: `Koneksi Google Sheets berhasil! HTTP Status 200 OK. Sumber sheet "${sheetName}" siap dibaca.`
        });
      } else {
        setTestResult({
          status: 'error',
          message: `Respon HTTP ${res.status}: ${res.statusText}. Pastikan sheet memiliki akses baca publik (anyone with link can view).`
        });
      }
    } catch (e: any) {
      setTestResult({
        status: 'error',
        message: `Uji koneksi gagal: ${e.message || String(e)}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetDefaults = () => {
    setExecUrl(DEFAULT_EXEC_URL);
    setSpreadsheetId(DEFAULT_SPREADSHEET_ID);
    setSheetName(DEFAULT_SHEET_NAME);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs no-print animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 md:p-7 text-slate-800">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-2 pr-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Headless GAS Center</h2>
            <p className="text-xs text-slate-500">Konfigurasi Cloud REST Endpoint & Sinkronisasi Dual-Channel</p>
          </div>
        </div>

        <div className="mt-4 space-y-4 text-xs md:text-sm">
          {/* Status Sinkronisasi */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-500 text-xs">Sinkronisasi Terakhir:</span>
              <p className="font-semibold text-slate-800 text-xs mt-0.5">
                {config.lastSyncedAt || 'Belum tersinkron (menggunakan cache lokal)'}
              </p>
            </div>
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
            </button>
          </div>

          {/* Form Endpoint */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Apps Script Web App Exec URL (Tier 1 REST):
              </label>
              <input
                type="text"
                value={execUrl}
                onChange={(e) => setExecUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  ID Spreadsheet:
                </label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="ID Spreadsheet Google Sheets"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Sheet Sumber Data:
                </label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="DATA PROSES CKH"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Test & Result Box */}
          {testResult.status !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              {testResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="leading-relaxed">{testResult.message}</div>
            </div>
          )}

          {/* Aksi Konfigurasi */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
              </button>

              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                Reset Default
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onForceRebuildCache}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Bangun ulang cache lokal dari snapshot awal"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Cache</span>
              </button>

              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Konfigurasi</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
