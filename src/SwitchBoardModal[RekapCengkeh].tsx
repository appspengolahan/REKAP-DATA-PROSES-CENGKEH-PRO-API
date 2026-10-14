/**
 * Modal Switch Board (Ekosistem Web Apps Divisi Produksi I)
 * File: SwitchBoardModal[RekapCengkeh].tsx
 * PT Batu Karang - Divisi Produksi I
 */
import React, { useState, useEffect } from 'react';
import { 
  X, 
  ExternalLink, 
  ArrowRight, 
  Layers, 
  Edit2, 
  Plus, 
  Trash2, 
  RotateCcw, 
  Check, 
  Globe, 
  Save, 
  AlertCircle 
} from 'lucide-react';

export interface SwitchAppItem {
  id: string;
  name: string;
  desc: string;
  url: string;
  category: 'komoditas' | 'enterprise';
  status?: 'active' | 'external' | 'internal';
  badge: string;
  icon: string;
  isCustom?: boolean;
}

export const DEFAULT_SWITCH_APPS: SwitchAppItem[] = [
  // 4 Komoditas Utama (sesuai instruksi default)
  {
    id: 'cengkeh',
    name: 'Rekap Proses Cengkeh',
    desc: 'Kesusutan Sortasi, Rendaman & Hasil Dryer Cengkeh',
    url: 'https://rekap-data-proses-cengkeh-pro-api-l.vercel.app/',
    category: 'komoditas',
    status: 'external',
    badge: 'Live App',
    icon: '🌿'
  },
  {
    id: 'tembakau',
    name: 'Rekap Proses Tembakau',
    desc: 'Dashboard Kesusutan Proses Tembakau (SKT & SKM) 54 Varian',
    url: 'https://rekap-dataproses-tembakau-pro.vercel.app/',
    category: 'komoditas',
    status: 'active',
    badge: 'Sedang Dibuka',
    icon: '🍂'
  },
  {
    id: 'blend',
    name: 'Rekap Proses Blend',
    desc: 'Monitoring Komposisi & Yield Formula Blend Pabrik',
    url: 'https://rekap-data-proses-blend-pro-api-eng.vercel.app/',
    category: 'komoditas',
    status: 'external',
    badge: 'Live App',
    icon: '🌪️'
  },
  {
    id: 'krosok',
    name: 'Rekap Proses Krosok',
    desc: 'Monitoring Grading & Destemming Bahan Baku Krosok',
    url: 'https://rekap-data-krosok-api-phi.vercel.app/',
    category: 'komoditas',
    status: 'external',
    badge: 'Live App',
    icon: '📦'
  },

  // Enterprise & Sistem Operasional
  {
    id: 'stock-pp1',
    name: 'Monitoring Stock Persediaan PP1',
    desc: 'Stok Live 4 Komoditas: Cengkeh, Tembakau, Krosok, Blend',
    url: 'https://monitoring-stock-pp-1-pro-api.vercel.app/',
    category: 'enterprise',
    status: 'external',
    badge: 'Vercel Live',
    icon: '📊'
  },
  {
    id: 'telemetri-oee',
    name: 'General Monitoring & OEE Pabrik',
    desc: 'Telemetri 4 Lini Mesin Pengolahan, Suhu & Kelembaban (RH)',
    url: '#',
    category: 'enterprise',
    status: 'internal',
    badge: 'Modul PP1',
    icon: '⚡'
  },
  {
    id: 'hr-phl',
    name: 'Modul HR Pekerja Harian Lepas (PHL)',
    desc: 'Master NIP PHL, Presensi Mandor, Output Tonase & Upah Borongan',
    url: '#',
    category: 'enterprise',
    status: 'internal',
    badge: 'Roadmap PP1',
    icon: '👥'
  },
  {
    id: 'hr-staff',
    name: 'Modul HR Staff & Karyawan Tetap',
    desc: 'Presensi Geofence GPS 150m, Shift 1-3 & Scoring KPI Bulanan',
    url: '#',
    category: 'enterprise',
    status: 'internal',
    badge: 'Roadmap PP1',
    icon: '🏢'
  }
];

const STORAGE_KEY = 'pp1_switch_board_apps_v2';

const EMOJI_OPTIONS = ['🌿', '🍂', '🌪️', '📦', '📊', '⚡', '👥', '🏢', '🚀', '🏭', '📑', '⚙️', '🔍', '🛡️'];

interface SwitchBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SwitchBoardModalRekapCengkeh: React.FC<SwitchBoardModalProps> = ({ isOpen, onClose }) => {
  const [apps, setApps] = useState<SwitchAppItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return DEFAULT_SWITCH_APPS;
  });

  // State dialog Edit / Tambah
  const [editingItem, setEditingItem] = useState<SwitchAppItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formUrl, setFormUrl] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<'komoditas' | 'enterprise'>('komoditas');
  const [formBadge, setFormBadge] = useState('Live App');
  const [formIcon, setFormIcon] = useState('🌿');
  const [formIsActive, setFormIsActive] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingItem || isAddingNew) {
          setEditingItem(null);
          setIsAddingNew(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editingItem, isAddingNew]);

  // Simpan ke localStorage saat apps berubah
  const saveAppsToStorage = (updatedApps: SwitchAppItem[]) => {
    setApps(updatedApps);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedApps));
    } catch {
      // ignore
    }
  };

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3000);
  };

  const handleStartEdit = (item: SwitchAppItem) => {
    setEditingItem(item);
    setIsAddingNew(false);
    setFormName(item.name);
    setFormUrl(item.url);
    setFormDesc(item.desc || '');
    setFormCategory(item.category);
    setFormBadge(item.badge || 'Live App');
    setFormIcon(item.icon || '🌿');
    setFormIsActive(item.status === 'active');
  };

  const handleStartAdd = () => {
    setEditingItem(null);
    setIsAddingNew(true);
    setFormName('');
    setFormUrl('https://');
    setFormDesc('');
    setFormCategory('komoditas');
    setFormBadge('Live App');
    setFormIcon('🚀');
    setFormIsActive(false);
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const trimmedUrl = formUrl.trim() || '#';

    const targetStatus: 'active' | 'external' | 'internal' = formIsActive 
      ? 'active' 
      : (trimmedUrl.startsWith('http') ? 'external' : 'internal');

    if (isAddingNew) {
      const newApp: SwitchAppItem = {
        id: 'custom-' + Date.now(),
        name: formName.trim(),
        url: trimmedUrl,
        desc: formDesc.trim() || 'Modul Web Apps PP1',
        category: formCategory,
        status: targetStatus,
        badge: formIsActive ? 'Sedang Dibuka' : (formBadge.trim() || 'Live App'),
        icon: formIcon,
        isCustom: true
      };

      const updated = [...apps, newApp];
      saveAppsToStorage(updated);
      setIsAddingNew(false);
      showNotification(`Modul "${newApp.name}" berhasil ditambahkan!`);
    } else if (editingItem) {
      const updated: SwitchAppItem[] = apps.map((app) => {
        if (app.id === editingItem.id) {
          return {
            ...app,
            name: formName.trim(),
            url: trimmedUrl,
            desc: formDesc.trim(),
            category: formCategory,
            status: targetStatus,
            badge: formIsActive ? 'Sedang Dibuka' : (formBadge.trim() || 'Live App'),
            icon: formIcon
          };
        }
        return app;
      });
      saveAppsToStorage(updated);
      setEditingItem(null);
      showNotification(`Perubahan modul "${formName}" berhasil disimpan!`);
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (window.confirm(`Hapus modul "${name}" dari Switch Board?`)) {
      const updated = apps.filter((app) => app.id !== id);
      saveAppsToStorage(updated);
      showNotification(`Modul "${name}" telah dihapus.`);
      if (editingItem?.id === id) setEditingItem(null);
    }
  };

  const handleResetToDefault = () => {
    saveAppsToStorage(DEFAULT_SWITCH_APPS);
    setShowResetConfirm(false);
    setEditingItem(null);
    setIsAddingNew(false);
    showNotification('Seluruh URL & Modul berhasil direset ke pengaturan default pabrik.');
  };

  if (!isOpen) return null;

  const komoditasApps = apps.filter((a) => a.category === 'komoditas');
  const enterpriseApps = apps.filter((a) => a.category === 'enterprise');

  return (
    <div 
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/30 shadow-inner">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Switch App Board
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-medium border border-slate-700">
                  Ekosistem PP1
                </span>
              </div>
              <p className="text-xs text-slate-400">Pindah cepat antar aplikasi & modul Divisi Produksi I</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              title="Tambah Modul / Link URL Baru"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tambah Modul</span>
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              title="Reset Semua ke URL Default"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-medium flex items-center gap-2 shrink-0 animate-in slide-in-from-top duration-150">
            <Check className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Konfirmasi Reset Default */}
        {showResetConfirm && (
          <div className="bg-amber-50 border-b border-amber-200 p-4 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Kembalikan ke URL Default Pabrik?</span>
                <p className="text-amber-800 mt-0.5 text-[11px]">
                  Semua perubahan nama modul, tautan URL, dan modul kustom akan dikembalikan ke URL standar resmi.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-3 py-1 rounded-lg bg-white border border-amber-300 text-slate-700 hover:bg-amber-100 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleResetToDefault}
                className="px-3 py-1 rounded-lg bg-amber-600 text-white hover:bg-amber-700 transition-colors font-semibold"
              >
                Ya, Reset Sekarang
              </button>
            </div>
          </div>
        )}

        {/* FORM MODAL: EDIT / TAMBAH MODUL */}
        {(isAddingNew || editingItem) && (
          <div className="bg-slate-50 border-b border-slate-200 p-5 shrink-0 animate-in slide-in-from-top duration-200">
            <form onSubmit={handleSaveForm} className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                    {isAddingNew ? <Plus className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
                  </span>
                  <span>{isAddingNew ? 'Tambah Modul / Tautan URL Baru' : `Edit Modul: ${editingItem?.name}`}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingItem(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Modul / Aplikasi <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Contoh: Rekap Proses Cengkeh"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tautan URL Aplikasi <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={formUrl}
                      onChange={(e) => setFormUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs font-mono"
                    />
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Deskripsi Singkat Modul
                  </label>
                  <input
                    type="text"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Keterangan fungsi atau cakupan modul operasional"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kategori Tampilan
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as 'komoditas' | 'enterprise')}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs cursor-pointer"
                  >
                    <option value="komoditas">Monitoring Board Komoditas Utama</option>
                    <option value="enterprise">Modul Enterprise & Sistem Operasional</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Badge Status / Label
                  </label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="Contoh: Live App, Sedang Dibuka, Modul PP1"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pilihan Ikon Emoji
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((em) => (
                      <button
                        key={em}
                        type="button"
                        onClick={() => setFormIcon(em)}
                        className={`w-7 h-7 rounded-md text-sm flex items-center justify-center transition-all ${
                          formIcon === em 
                            ? 'bg-blue-600 text-white shadow-xs scale-110' 
                            : 'bg-white border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="font-semibold text-slate-700">Tandai sebagai Aplikasi Aktif ("Sedang Dibuka")</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingItem(null);
                  }}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Isi Modal: DAFTAR APLIKASI */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Bagian 1: 4 Monitoring Board Komoditas Utama */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>Monitoring Board Komoditas Pabrik</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {komoditasApps.length} Apps
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {komoditasApps.map((app) => {
                const isActive = app.status === 'active' || app.badge === 'Sedang Dibuka';
                return (
                  <div
                    key={app.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between group ${
                      isActive
                        ? 'bg-amber-50/80 border-amber-300 shadow-2xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-xl shrink-0 p-1 bg-slate-100 rounded-lg">{app.icon}</span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {app.name}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {app.desc}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-1">
                        {isActive ? (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-300 whitespace-nowrap">
                            {app.badge || 'Sedang Dibuka'}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                            {app.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* URL Link Preview & Action Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[190px] sm:max-w-[210px]" title={app.url}>
                        {app.url}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Tombol Edit */}
                        <button
                          onClick={() => handleStartEdit(app)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Nama & URL Modul"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Tombol Hapus (jika custom) */}
                        {app.isCustom && (
                          <button
                            onClick={() => handleDeleteItem(app.id, app.name)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Modul"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Tombol Akses / Buka */}
                        {app.url && app.url !== '#' && (
                          <a
                            href={app.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors ml-1"
                          >
                            <span>Buka</span>
                            <ArrowRight className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bagian 2: Enterprise Modules & Sistem Operasional */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span>Modul Enterprise & Sistem Operasional</span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-600 font-mono">
                  {enterpriseApps.length} Modul
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {enterpriseApps.map((mod) => {
                const isExternal = mod.url && mod.url.startsWith('http');
                const isActive = mod.status === 'active' || mod.badge === 'Sedang Dibuka';
                return (
                  <div
                    key={mod.id}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <span className="text-xl shrink-0 p-1 bg-blue-50 rounded-lg">{mod.icon}</span>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {mod.name}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                            {mod.desc}
                          </p>
                        </div>
                      </div>

                      <span className="shrink-0 text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 whitespace-nowrap">
                        {mod.badge}
                      </span>
                    </div>

                    {/* URL Link Preview & Action Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[190px] sm:max-w-[210px]" title={mod.url}>
                        {mod.url === '#' ? 'Sistem Terintegrasi PP1' : mod.url}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleStartEdit(mod)}
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Edit Modul Ini"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button (if custom) */}
                        {mod.isCustom && (
                          <button
                            onClick={() => handleDeleteItem(mod.id, mod.name)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus Modul"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Open Link */}
                        {isExternal ? (
                          <a
                            href={mod.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors whitespace-nowrap ml-1"
                          >
                            <span>Akses</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="shrink-0 text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                            Terintegrasi
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Modal */}
        <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="flex items-center gap-2">
            <span>PT Batu Karang · Divisi Produksi I</span>
            <span className="hidden sm:inline text-slate-300">|</span>
            <span className="hidden sm:inline text-slate-400">Total {apps.length} Modul Terhubung</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleStartAdd}
              className="inline-flex sm:hidden items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 text-white font-semibold"
            >
              <Plus className="w-3 h-3" />
              <span>Tambah</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
