/**
 * Modal GAS Center (Headless API Endpoint & Data Sync Console)
 * File: GasCenterModal[RekapCengkeh].tsx
 */
import React, { useState } from 'react';
import { 
  X, 
  Database, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Terminal, 
  Save, 
  RotateCcw,
  Send,
  Code2,
  Sliders,
  Play,
  Copy,
  Check,
  FileCode
} from 'lucide-react';
import { GasConfig } from './types[RekapCengkeh]';
import { saveGasConfig, DEFAULT_EXEC_URL, DEFAULT_SPREADSHEET_ID, DEFAULT_SHEET_NAME, testGasPayload } from './Code[RekapCengkeh]';

const GAS_TEMPLATE_CODE = `/**
 * Headless Google Apps Script REST Web App (doGet / doPost)
 * Project: Monitoring Board — Rekap Data Proses Cengkeh
 * Divisi Produksi I - PT Batu Karang
 */

function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheetName = (e && e.parameter && e.parameter.sheet) || 'DATA PROSES CKH';
    var sheet = ss.getSheetByName(sheetName) || ss.getActiveSheet();
    var values = sheet.getDataRange().getValues();
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: values.length,
      data: values
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action || "ping";
    
    if (action === "ping") {
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "ping",
        timestamp: new Date().toISOString(),
        message: "Headless GAS REST Online & Responsive"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "appendRow" && body.row) {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = ss.getSheetByName(body.sheet || 'DATA PROSES CKH') || ss.getActiveSheet();
      sheet.appendRow(body.row);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        action: "appendRow",
        message: "Baris baru berhasil ditulis ke Google Sheets"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      received: body
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}`;

interface GasCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: GasConfig;
  onSaveConfig: (cfg: GasConfig) => void;
  onForceRebuildCache: () => void;
  onManualSync: () => Promise<void>;
  isSyncing: boolean;
  onToggleAutoSync?: () => void;
}

export const GasCenterModalRekapCengkeh: React.FC<GasCenterModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onForceRebuildCache,
  onManualSync,
  isSyncing,
  onToggleAutoSync
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'endpoint' | 'payload' | 'script'>('endpoint');
  const [execUrl, setExecUrl] = useState(config.execUrl);
  const [spreadsheetId, setSpreadsheetId] = useState(config.spreadsheetId);
  const [sheetName, setSheetName] = useState(config.sheetName);
  const [autoSync, setAutoSync] = useState(config.autoSync ?? true);
  const [copiedScript, setCopiedScript] = useState(false);

  React.useEffect(() => {
    setAutoSync(config.autoSync ?? true);
    setExecUrl(config.execUrl);
    setSpreadsheetId(config.spreadsheetId);
    setSheetName(config.sheetName);
  }, [config]);
  
  // Endpoint test state
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });
  const [isTesting, setIsTesting] = useState(false);

  // Payload test state
  const [payloadMethod, setPayloadMethod] = useState<'GET' | 'POST'>('GET');
  const [payloadBody, setPayloadBody] = useState<string>('{\n  "action": "getData"\n}');
  const [payloadResult, setPayloadResult] = useState<{
    status: number;
    statusText: string;
    latencyMs: number;
    data: any;
    rawText: string;
  } | null>(null);
  const [isSendingPayload, setIsSendingPayload] = useState(false);
  const [payloadError, setPayloadError] = useState<string | null>(null);

  const handleSave = () => {
    const updated: GasConfig = {
      ...config,
      execUrl: execUrl.trim(),
      spreadsheetId: spreadsheetId.trim(),
      sheetName: sheetName.trim(),
      autoSync: autoSync
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

  const handleSendPayloadTest = async () => {
    setIsSendingPayload(true);
    setPayloadError(null);
    setPayloadResult(null);
    try {
      const res = await testGasPayload(execUrl, payloadMethod, payloadBody);
      setPayloadResult(res);
    } catch (e: any) {
      setPayloadError(e.message || String(e));
    } finally {
      setIsSendingPayload(false);
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
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 sm:p-6 text-slate-800 flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4 pr-8">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>Headless GAS Center</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono font-bold">
                REST API
              </span>
            </h2>
            <p className="text-xs text-slate-500">Konfigurasi Cloud REST Endpoint, Auto-Sync & Payload Testing Console</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab('endpoint')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'endpoint'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pengaturan Endpoint & Sinkronisasi</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'payload'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Payload Testing Console</span>
            <span className="text-[9px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-mono font-bold">
              doGet/doPost
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              activeTab === 'script'
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Template Script GAS</span>
          </button>
        </div>

        {/* Tab 1: Endpoint & Sync Configuration */}
        {activeTab === 'endpoint' && (
          <div className="space-y-4 text-xs md:text-sm">
            {/* Status Sinkronisasi & Auto-Sync Switch */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <span className="text-slate-500 text-xs">Sinkronisasi Terakhir:</span>
                  <p className="font-semibold text-slate-800 text-xs mt-0.5">
                    {config.lastSyncedAt || 'Belum tersinkron (menggunakan cache lokal)'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onManualSync}
                    disabled={isSyncing}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                  </button>
                </div>
              </div>

              {/* Auto-Sync Banner */}
              <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <RefreshCw className={`w-4 h-4 ${autoSync ? 'animate-spin text-emerald-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="font-semibold text-slate-800">Live Auto-Sync (Interval Realtime)</span>
                    <p className="text-[11px] text-slate-500">Logo berputar terus menerus & sinkronisasi otomatis tiap 60 detik</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !autoSync;
                    setAutoSync(next);
                    if (onToggleAutoSync) onToggleAutoSync();
                  }}
                  className={`px-3 py-1 rounded-full text-xs font-bold transition-colors cursor-pointer border ${
                    autoSync
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-slate-200 text-slate-600 border-slate-300'
                  }`}
                >
                  {autoSync ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}
                </button>
              </div>
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
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
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
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
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
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
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
                  <span>{isTesting ? 'Menguji...' : 'Uji Koneksi Sheets'}</span>
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
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Konfigurasi</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Payload Testing Console (doGet / doPost) */}
        {activeTab === 'payload' && (
          <div className="space-y-4 text-xs md:text-sm">
            <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-900 text-xs">
              <p className="font-semibold flex items-center gap-1.5 mb-1">
                <Terminal className="w-3.5 h-3.5 text-blue-600" />
                <span>Headless Google Apps Script Payload Tester</span>
              </p>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Uji interaktif pengiriman payload REST ke endpoint Google Apps Script Web App (<code className="font-mono bg-blue-100 px-1 rounded">doGet</code> / <code className="font-mono bg-blue-100 px-1 rounded">doPost</code>).
              </p>
            </div>

            {/* Method & Preset Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700">Metode HTTP:</span>
                <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setPayloadMethod('GET');
                      setPayloadBody('{\n  "action": "getData"\n}');
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      payloadMethod === 'GET'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    GET (doGet)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPayloadMethod('POST');
                      setPayloadBody('{\n  "action": "ping",\n  "timestamp": "' + new Date().toISOString() + '"\n}');
                    }}
                    className={`px-3 py-1 rounded-md text-xs font-bold transition-colors cursor-pointer ${
                      payloadMethod === 'POST'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    POST (doPost)
                  </button>
                </div>
              </div>

              {/* Preset Payload Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Preset:</span>
                <button
                  type="button"
                  onClick={() => setPayloadBody('{\n  "action": "getData"\n}')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono cursor-pointer"
                >
                  getData
                </button>
                <button
                  type="button"
                  onClick={() => setPayloadBody('{\n  "action": "ping",\n  "sender": "PT Batu Karang Divisi I"\n}')}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono cursor-pointer"
                >
                  ping
                </button>
              </div>
            </div>

            {/* Payload Editor */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                JSON Payload:
              </label>
              <textarea
                rows={4}
                value={payloadBody}
                onChange={(e) => setPayloadBody(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-slate-950 text-emerald-400 rounded-xl border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono truncate max-w-sm">
                Target: {execUrl.substring(0, 48)}...
              </span>
              <button
                type="button"
                onClick={handleSendPayloadTest}
                disabled={isSendingPayload}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs flex items-center gap-1.5 disabled:opacity-60 transition-colors cursor-pointer"
              >
                {isSendingPayload ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Mengirim Payload...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Kirim & Uji Payload</span>
                  </>
                )}
              </button>
            </div>

            {/* Payload Result Viewer */}
            {payloadError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error Kirim Payload:</span>
                  <p className="mt-0.5">{payloadError}</p>
                </div>
              </div>
            )}

            {payloadResult && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">Respon Server:</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                      payloadResult.status === 200 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      HTTP {payloadResult.status} {payloadResult.statusText}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Latency: {payloadResult.latencyMs} ms
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Response Payload Data:
                  </span>
                  <pre className="max-h-48 overflow-y-auto p-2.5 rounded-lg bg-slate-900 text-slate-200 text-[11px] font-mono whitespace-pre-wrap">
                    {typeof payloadResult.data === 'object'
                      ? JSON.stringify(payloadResult.data, null, 2)
                      : payloadResult.rawText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Template Script Google Apps Script Backend (doGet / doPost) */}
        {activeTab === 'script' && (
          <div className="space-y-4 text-xs md:text-sm">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1.5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <FileCode className="w-4 h-4 text-blue-600" />
                  Headless Apps Script Server Code (Code.gs)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(GAS_TEMPLATE_CODE);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2500);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                  <span>{copiedScript ? 'Tersalin ke Clipboard!' : 'Salin Script'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Salin kode ini ke Google Apps Script (Ekstensi → Apps Script) pada spreadsheet perusahaan. Publikasikan sebagai Web App (Akses: <em>Siapa saja / Anyone</em>) untuk menghasilkan Exec URL REST endpoint.
              </p>
            </div>

            <div className="relative">
              <pre className="max-h-[340px] overflow-y-auto p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] leading-relaxed border border-slate-800 whitespace-pre-wrap select-all">
                {GAS_TEMPLATE_CODE}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
