/**
 * Komponen Tampilan Menu: Analisis Deviasi & Acuan
 * File: AnalisisDeviasiView[RekapCengkeh].tsx
 * Divisi Produksi I - PT Batu Karang
 * Referensi Desain: image_81c6691c.png
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  SlidersHorizontal, 
  BarChart3, 
  TrendingUp, 
  FileSpreadsheet, 
  Printer, 
  Layers, 
  Info, 
  Check, 
  ArrowUpDown,
  Search,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  RawRowCengkeh, 
  UserRole, 
  DeviasiAcuanConfig, 
  VarianDeviasiResult 
} from './types[RekapCengkeh]';
import { 
  formatKg, 
  formatPct, 
  round1, 
  round2, 
  MONTH_ORDER, 
  exportToPdf 
} from './Code[RekapCengkeh]';

interface AnalisisDeviasiViewProps {
  rows: RawRowCengkeh[];
  userRole: UserRole;
  onNavigateToDhp?: () => void;
}

const DEFAULT_CONFIG: DeviasiAcuanConfig = {
  bulanDasarMulai: 'September',
  bulanDasarSampai: 'Oktober',
  tahunDasar: '2026',
  acuanAktifBulan: 'Oktober',
  batasWaspadaPct: 0.30,
  batasOosPct: 0.60
};

export const AnalisisDeviasiViewRekapCengkeh: React.FC<AnalisisDeviasiViewProps> = ({
  rows,
  userRole,
  onNavigateToDhp
}) => {
  // Config state
  const [config, setConfig] = useState<DeviasiAcuanConfig>(() => {
    try {
      const saved = localStorage.getItem('_REKAP_CKH_DEVIASI_CONFIG');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  const [formConfig, setFormConfig] = useState<DeviasiAcuanConfig>(config);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Filter Evaluasi
  const [evalBulan, setEvalBulan] = useState<string>('Oktober');
  const [evalTahun, setEvalTahun] = useState<string>('2026');
  const [filterJalur, setFilterJalur] = useState<'Semua' | 'SKT' | 'SKM'>('Semua');
  const [searchVarian, setSearchVarian] = useState<string>('');
  const [showAllChart, setShowAllChart] = useState<boolean>(true);
  const [detailPage, setDetailPage] = useState<number>(1);
  const detailPageSize = 25;

  // Handle Simpan Config
  const handleApplyConfig = () => {
    setConfig(formConfig);
    try {
      localStorage.setItem('_REKAP_CKH_DEVIASI_CONFIG', JSON.stringify(formConfig));
    } catch {}
    setSaveToast(`Standar acuan berhasil diterapkan berdasarkan periode ${formConfig.bulanDasarMulai} – ${formConfig.bulanDasarSampai} ${formConfig.tahunDasar}!`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  // 1. Hitung Standar Acuan per Varian dari Data Historis Periode Dasar
  const acuanPerVarian = useMemo(() => {
    const startIdx = MONTH_ORDER.indexOf(config.bulanDasarMulai);
    const endIdx = MONTH_ORDER.indexOf(config.bulanDasarSampai);

    const baseRows = rows.filter((r) => {
      if (r.tahun !== config.tahunDasar) return false;
      const mIdx = MONTH_ORDER.indexOf(r.bulan);
      if (startIdx <= endIdx) {
        return mIdx >= startIdx && mIdx <= endIdx;
      }
      return mIdx >= startIdx || mIdx <= endIdx;
    });

    // Agregasi per varian
    const map = new Map<string, { totalGld: number; totalRjDry: number; kaGldSum: number; kaDrySum: number; count: number }>();
    baseRows.forEach((r) => {
      const curr = map.get(r.jenis) || { totalGld: 0, totalRjDry: 0, kaGldSum: 0, kaDrySum: 0, count: 0 };
      curr.totalGld += r.gldKering || 0;
      curr.totalRjDry += r.rjKering || 0;
      if (r.kaGld) curr.kaGldSum += r.kaGld;
      if (r.kaDry) curr.kaDrySum += r.kaDry;
      curr.count += 1;
      map.set(r.jenis, curr);
    });

    const result = new Map<string, number>();
    map.forEach((val, jenis) => {
      if (val.totalGld > 0) {
        // Susut historis riil
        const susutPct = ((val.totalGld - val.totalRjDry) / val.totalGld) * 100;
        result.set(jenis, round2(susutPct));
      }
    });

    return result;
  }, [rows, config.bulanDasarMulai, config.bulanDasarSampai, config.tahunDasar]);

  // 2. Data Evaluasi Bulan Terpilih
  const evalRows = useMemo(() => {
    return rows.filter((r) => r.bulan === evalBulan && r.tahun === evalTahun);
  }, [rows, evalBulan, evalTahun]);

  // 3. Komparasi per Varian
  const varianKomparasiList: VarianDeviasiResult[] = useMemo(() => {
    // Agregasi eval rows per jenis
    const map = new Map<string, {
      bakuKg: number;
      hasilKg: number;
      susutKg: number;
      kaGldSum: number;
      kaDrySum: number;
      count: number;
      batchRows: RawRowCengkeh[];
    }>();

    evalRows.forEach((r) => {
      const curr = map.get(r.jenis) || {
        bakuKg: 0,
        hasilKg: 0,
        susutKg: 0,
        kaGldSum: 0,
        kaDrySum: 0,
        count: 0,
        batchRows: []
      };
      curr.bakuKg += r.gldKering || 0;
      curr.hasilKg += r.rjKering || 0;
      curr.susutKg += r.totalSusutKg || (r.gldKering - r.rjKering);
      if (r.kaGld) curr.kaGldSum += r.kaGld;
      if (r.kaDry) curr.kaDrySum += r.kaDry;
      curr.count += 1;
      curr.batchRows.push(r);
      map.set(r.jenis, curr);
    });

    const results: VarianDeviasiResult[] = [];

    map.forEach((val, jenis) => {
      const susutRiilPct = val.bakuKg > 0 ? (val.susutKg / val.bakuKg) * 100 : 0;
      
      // Ambil acuan historis jika ada, atau gunakan degradasi kadar air 1:1 jika historis kosong
      let acuan = acuanPerVarian.get(jenis);
      const avgKaGld = val.count > 0 && val.kaGldSum > 0 ? val.kaGldSum / val.count : null;
      const avgKaDry = val.count > 0 && val.kaDrySum > 0 ? val.kaDrySum / val.count : null;

      if (acuan === undefined) {
        if (avgKaGld && avgKaDry) {
          // Model degradasi kadar air 1:1 (Cell T1:T3 DATA PROSES CKH)
          acuan = round2(avgKaGld - avgKaDry);
        } else {
          acuan = 5.0; // Default standard industry clove dryer
        }
      }

      const deviasiPct = round2(susutRiilPct - acuan);
      const acuanKg = (acuan / 100) * val.bakuKg;
      const deviasiKg = round1(val.susutKg - acuanKg);

      const absDev = Math.abs(deviasiPct);
      let status: 'normal' | 'waspada' | 'oos' = 'normal';
      if (absDev > config.batasOosPct) {
        status = 'oos';
      } else if (absDev > config.batasWaspadaPct) {
        status = 'waspada';
      }

      // Deteksi Jalur (SKT vs SKM berdasarkan penamaan jenis)
      const isSkm = jenis.toLowerCase().includes('skm') || jenis.toLowerCase().includes('filter') || jenis.toLowerCase().includes('mild');
      const jalur: 'SKT' | 'SKM' | 'Global' = isSkm ? 'SKM' : 'SKT';

      // Auto Diagnosa Ilmiah
      let faktorDominan = 'Terkendali Sesuai Acuan';
      let autoDiagnosa = `Susut riil ${formatPct(susutRiilPct)} terkendali rapat dalam batas toleransi ±${config.batasWaspadaPct}% terhadap acuan (${formatPct(acuan)}).`;

      if (deviasiPct > config.batasWaspadaPct) {
        faktorDominan = 'Pengeringan Berlebih (Over-drying) / Suhu Rotary';
        autoDiagnosa = `Susut riil ${formatPct(susutRiilPct)} melampaui acuan +${formatPct(deviasiPct)} (+${formatKg(deviasiKg)} Kg). Indikasi evaporasi uap berlebih atau over-dryer pada sesi pemanasan.`;
      } else if (deviasiPct < -config.batasWaspadaPct) {
        faktorDominan = 'Retensi Air / Penyerapan Kelembaban Udara';
        autoDiagnosa = `Susut riil ${formatPct(susutRiilPct)} lebih hemat -${formatPct(Math.abs(deviasiPct))} (-${formatKg(Math.abs(deviasiKg))} Kg) dari acuan. Indikasi retensi admoist air rendam atau kelembaban lingkungan tinggi.`;
      }

      results.push({
        jenis,
        jalur,
        bakuKg: round1(val.bakuKg),
        hasilKg: round1(val.hasilKg),
        susutRiilKg: round1(val.susutKg),
        susutRiilPct: round2(susutRiilPct),
        acuanPct: acuan,
        acuanKg: round1(acuanKg),
        deviasiPct,
        deviasiKg,
        status,
        faktorDominan,
        autoDiagnosa,
        kaGld: avgKaGld ? round1(avgKaGld) : null,
        kaDry: avgKaDry ? round1(avgKaDry) : null,
        jumlahBatch: val.count
      });
    });

    // Filter jalur dan sort deviasi
    return results
      .filter((v) => {
        if (filterJalur === 'Semua') return true;
        return v.jalur === filterJalur;
      })
      .filter((v) => {
        if (!searchVarian) return true;
        return v.jenis.toLowerCase().includes(searchVarian.toLowerCase());
      })
      .sort((a, b) => Math.abs(b.deviasiPct) - Math.abs(a.deviasiPct));
  }, [evalRows, acuanPerVarian, config.batasWaspadaPct, config.batasOosPct, filterJalur, searchVarian]);

  const totalDetailPages = Math.ceil(varianKomparasiList.length / detailPageSize) || 1;
  useEffect(() => {
    setDetailPage(1);
  }, [evalBulan, evalTahun, filterJalur, searchVarian]);

  const pagedVarianList = useMemo(
    () => varianKomparasiList.slice((detailPage - 1) * detailPageSize, detailPage * detailPageSize),
    [varianKomparasiList, detailPage]
  );

  // 4. KPI Agregat Multi-Varian
  const kpiAgregat = useMemo(() => {
    let totalBaku = 0;
    let totalHasil = 0;
    let totalSusutRiilKg = 0;
    let totalAcuanKg = 0;
    let totalBatch = 0;
    let oosCount = 0;
    let waspadaCount = 0;
    let normalCount = 0;

    varianKomparasiList.forEach((v) => {
      totalBaku += v.bakuKg;
      totalHasil += v.hasilKg;
      totalSusutRiilKg += v.susutRiilKg;
      totalAcuanKg += v.acuanKg;
      totalBatch += v.jumlahBatch || 1;
      if (v.status === 'oos') oosCount++;
      else if (v.status === 'waspada') waspadaCount++;
      else normalCount++;
    });

    const susutRiilTertimbang = totalBaku > 0 ? (totalSusutRiilKg / totalBaku) * 100 : 0;
    const acuanTertimbang = totalBaku > 0 ? (totalAcuanKg / totalBaku) * 100 : 0;
    const netDeviasiPct = round2(susutRiilTertimbang - acuanTertimbang);
    const netDeviasiKg = round1(totalSusutRiilKg - totalAcuanKg);

    let agregatStatus: 'normal' | 'waspada' | 'oos' = 'normal';
    if (Math.abs(netDeviasiPct) > config.batasOosPct || oosCount > 0) {
      agregatStatus = 'oos';
    } else if (Math.abs(netDeviasiPct) > config.batasWaspadaPct || waspadaCount > 0) {
      agregatStatus = 'waspada';
    }

    return {
      totalBaku: round1(totalBaku),
      totalHasil: round1(totalHasil),
      totalSusutRiilKg: round1(totalSusutRiilKg),
      susutRiilTertimbang: round2(susutRiilTertimbang),
      acuanTertimbang: round2(acuanTertimbang),
      netDeviasiPct,
      netDeviasiKg,
      totalBatch,
      oosCount,
      waspadaCount,
      normalCount,
      agregatStatus,
      totalVarian: varianKomparasiList.length
    };
  }, [varianKomparasiList, config.batasWaspadaPct, config.batasOosPct]);

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900 border border-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Analisis Deviasi & Standar Acuan Susut Cengkeh
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Penetapan standar acuan historis (Agregat Degradasi KA 1:1) dan evaluasi deviasi operasional harian / bulanan
          </p>
        </div>

        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => exportToPdf('AnalisisDeviasiAcuan')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-300 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* SECTION 01: Parameter Standar Acuan */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                01. Parameter Standar Acuan
              </span>
              <span className="text-xs text-slate-500">
                Konfigurasi baseline evaluasi susut cengkeh
              </span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Sumber Data Tunggal: <strong className="text-slate-800">Master Sheet DATA PROSES CKH</strong> ({rows.length} baris riil terverifikasi)
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Pratinjau: <strong className="text-blue-700">{acuanPerVarian.size}</strong> varian terhitung
            </span>
            <button
              type="button"
              onClick={handleApplyConfig}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan Standar Acuan</span>
            </button>
          </div>
        </div>

        {/* Input Controls Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 pt-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Bulan Dasar Mulai
            </label>
            <select
              value={formConfig.bulanDasarMulai}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, bulanDasarMulai: e.target.value }))}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MONTH_ORDER.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Sampai Bulan Dasar
            </label>
            <select
              value={formConfig.bulanDasarSampai}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, bulanDasarSampai: e.target.value }))}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MONTH_ORDER.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tahun Dasar
            </label>
            <select
              value={formConfig.tahunDasar}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, tahunDasar: e.target.value }))}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Acuan Aktif Bulan
            </label>
            <select
              value={formConfig.acuanAktifBulan}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, acuanAktifBulan: e.target.value }))}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MONTH_ORDER.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Batas Waspada (±%)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.05"
              max="2.00"
              value={formConfig.batasWaspadaPct}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, batasWaspadaPct: parseFloat(e.target.value) || 0.30 }))}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Batas OOS (±%)
            </label>
            <input
              type="number"
              step="0.05"
              min="0.10"
              max="5.00"
              value={formConfig.batasOosPct}
              onChange={(e) => setFormConfig((prev) => ({ ...prev, batasOosPct: parseFloat(e.target.value) || 0.60 }))}
              className="w-full text-xs font-medium px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* SECTION 02: Dashboard Komparasi Multi-Varian */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider">
              02. Dashboard Komparasi Multi-Varian
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">
              Perbandingan Standar Acuan vs Realisasi Susut Bulanan
            </h3>
          </div>

          {/* Sub Filters: Bulan Evaluasi, Tahun, Jalur */}
          <div className="flex items-center gap-2 flex-wrap no-print">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold">Bulan Evaluasi:</span>
              <select
                value={evalBulan}
                onChange={(e) => setEvalBulan(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 cursor-pointer"
              >
                {MONTH_ORDER.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="font-semibold">Tahun:</span>
              <select
                value={evalTahun}
                onChange={(e) => setEvalTahun(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-slate-800 cursor-pointer"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* Filter Jalur Buttons */}
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {(['Semua', 'SKT', 'SKM'] as const).map((j) => (
                <button
                  key={j}
                  type="button"
                  onClick={() => setFilterJalur(j)}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
                    filterJalur === j
                      ? 'bg-white text-blue-700 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {j}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4 KPI Cards Sesuai Gambar 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Volume Cengkeh Diolah */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Volume Cengkeh Diolah
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono tracking-tight">
              {formatKg(kpiAgregat.totalBaku)} <span className="text-xs font-normal text-slate-500">Kg</span>
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Hasil: <strong className="font-mono text-slate-800">{formatKg(kpiAgregat.totalHasil)} Kg</strong> · {kpiAgregat.totalBatch} batch
            </div>
          </div>

          {/* Card 2: Susut Riil Tertimbang */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Susut Riil Tertimbang
            </div>
            <div className="text-2xl font-black text-blue-700 mt-1 font-mono tracking-tight">
              {formatPct(kpiAgregat.susutRiilTertimbang)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1">
              Netto Susut: <strong className="font-mono text-slate-800">{formatKg(kpiAgregat.totalSusutRiilKg)} Kg</strong>
            </div>
          </div>

          {/* Card 3: Standar Acuan Tertimbang */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Standar Acuan Tertimbang
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1 font-mono tracking-tight">
              {formatPct(kpiAgregat.acuanTertimbang)}
            </div>
            <div className="text-[11px] text-slate-600 mt-1 truncate">
              Basis: {config.bulanDasarMulai} – {config.bulanDasarSampai} {config.tahunDasar}
            </div>
          </div>

          {/* Card 4: Net Deviasi Agregat */}
          <div className={`border rounded-xl p-4 ${
            kpiAgregat.agregatStatus === 'oos'
              ? 'bg-rose-50/60 border-rose-200 text-rose-900'
              : kpiAgregat.agregatStatus === 'waspada'
              ? 'bg-amber-50/60 border-amber-200 text-amber-900'
              : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                Net Deviasi Agregat
              </span>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                kpiAgregat.agregatStatus === 'oos'
                  ? 'bg-rose-200/70 text-rose-800'
                  : kpiAgregat.agregatStatus === 'waspada'
                  ? 'bg-amber-200/70 text-amber-800'
                  : 'bg-emerald-200/70 text-emerald-800'
              }`}>
                {kpiAgregat.agregatStatus === 'oos' ? (
                  <>
                    <AlertOctagon className="w-3 h-3 text-rose-700" />
                    <span>OOS ({kpiAgregat.oosCount})</span>
                  </>
                ) : kpiAgregat.agregatStatus === 'waspada' ? (
                  <>
                    <AlertTriangle className="w-3 h-3 text-amber-700" />
                    <span>Waspada</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                    <span>Normal</span>
                  </>
                )}
              </span>
            </div>

            <div className="text-2xl font-black mt-1 font-mono tracking-tight">
              {kpiAgregat.netDeviasiPct > 0 ? `+${formatPct(kpiAgregat.netDeviasiPct)}` : formatPct(kpiAgregat.netDeviasiPct)}
            </div>
            <div className="text-[11px] opacity-90 mt-1">
              Dampak: <strong className="font-mono">{kpiAgregat.netDeviasiKg > 0 ? `+${formatKg(kpiAgregat.netDeviasiKg)}` : formatKg(kpiAgregat.netDeviasiKg)} Kg</strong> · OOS: {kpiAgregat.oosCount} varian
            </div>
          </div>
        </div>

        {/* SECTION 03: Grafik Batang Bersanding Sesuai Gambar 3 */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-slate-800">
                Grafik Batang Bersanding: Acuan Standar vs Realisasi ({evalBulan} {evalTahun})
              </h4>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
                <span>Bar Hijau: Standar Acuan ({config.bulanDasarMulai} – {config.bulanDasarSampai})</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-blue-600 inline-block" />
                <span>Bar Biru: Realisasi Bulanan (Normal/Waspada)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-xs bg-rose-600 inline-block border border-rose-800" />
                <span>Outline Merah: Realisasi OOS (&gt; ±{config.batasOosPct}%)</span>
              </span>
            </div>
          </div>

          {/* Horizontal Bar Chart Comparison per Variant */}
          <div className="space-y-3 pt-2">
            {varianKomparasiList.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-xl">
                Tidak ada varian cengkeh yang diproses pada bulan {evalBulan} {evalTahun}.
              </div>
            ) : (
              (showAllChart ? varianKomparasiList : varianKomparasiList.slice(0, 8)).map((v) => {
                // Skala bar: max susut 15%
                const maxScale = 15;
                const acuanWidthPct = Math.min(100, (v.acuanPct / maxScale) * 100);
                const realWidthPct = Math.min(100, (v.susutRiilPct / maxScale) * 100);

                return (
                  <div key={v.jenis} className="bg-slate-50/50 hover:bg-slate-50 p-3 rounded-xl border border-slate-100 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{v.jenis}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                          {v.jalur}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          ({formatKg(v.bakuKg)} Kg · {v.jumlahBatch} batch)
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500 font-mono">
                          Acuan: <strong className="text-emerald-700 font-bold">{formatPct(v.acuanPct)}</strong>
                        </span>
                        <span className="text-slate-500 font-mono">
                          Riil: <strong className="text-blue-700 font-bold">{formatPct(v.susutRiilPct)}</strong>
                        </span>
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          v.status === 'oos'
                            ? 'bg-rose-100 text-rose-800'
                            : v.status === 'waspada'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Δ {v.deviasiPct > 0 ? `+${formatPct(v.deviasiPct)}` : formatPct(v.deviasiPct)}
                        </span>
                      </div>
                    </div>

                    {/* Dual Progress Bars */}
                    <div className="space-y-1.5">
                      {/* Bar 1: Acuan Standar (Hijau) */}
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] font-semibold text-slate-400">Acuan</span>
                        <div className="flex-1 bg-slate-200/70 h-2.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${acuanWidthPct}%` }}
                          />
                        </div>
                        <span className="w-10 text-[10px] font-mono text-emerald-700 text-right">
                          {formatPct(v.acuanPct)}
                        </span>
                      </div>

                      {/* Bar 2: Realisasi Bulanan (Biru / Merah jika OOS) */}
                      <div className="flex items-center gap-2">
                        <span className="w-12 text-[10px] font-semibold text-slate-400">Realisasi</span>
                        <div className="flex-1 bg-slate-200/70 h-2.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              v.status === 'oos' ? 'bg-rose-600 ring-1 ring-rose-400' : 'bg-blue-600'
                            }`}
                            style={{ width: `${realWidthPct}%` }}
                          />
                        </div>
                        <span className="w-10 text-[10px] font-mono text-blue-700 text-right">
                          {formatPct(v.susutRiilPct)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {varianKomparasiList.length > 8 && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllChart((prev) => !prev)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  {showAllChart ? 'Tampilkan Lebih Sedikit' : `Tampilkan Semua (${varianKomparasiList.length} Varian)`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 04: Detail Tabel Komparasi per Varian */}
        <div className="pt-4 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Tabel Rincian Komparasi per Varian Cengkeh ({evalBulan} {evalTahun})
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi presisi susut bahan terhadap toleransi degradasi kadar air & parameter mesin
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchVarian}
                  onChange={(e) => setSearchVarian(e.target.value)}
                  placeholder="Cari varian cengkeh..."
                  className="w-full pl-8 pr-3 py-1.5 min-h-[44px] sm:min-h-[36px] text-xs rounded-lg border border-slate-300 bg-white text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-[12px]">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <th className="py-2.5 px-3 text-left">Varian Cengkeh</th>
                  <th className="py-2.5 px-2 text-center">Jalur</th>
                  <th className="py-2.5 px-3 text-right">Baku (Kg)</th>
                  <th className="py-2.5 px-3 text-right">Hasil (Kg)</th>
                  <th className="py-2.5 px-3 text-right">Susut Riil</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">Acuan</th>
                  <th className="py-2.5 px-3 text-right">Deviasi (Δ)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-left">Faktor Dominan & Auto-Diagnosa Singkat</th>
                </tr>
              </thead>
              <tbody>
                {pagedVarianList.map((v) => (
                  <tr key={v.jenis} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                    <td className="py-2.5 px-3 text-left font-semibold text-slate-900">
                      {v.jenis}
                      <div className="text-[10px] text-slate-400 font-normal">
                        {v.jumlahBatch} batch proses
                      </div>
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {v.jalur}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatKg(v.bakuKg)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatKg(v.hasilKg)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-800">
                      {formatPct(v.susutRiilPct)}
                      <div className="text-[10px] text-slate-400">
                        -{formatKg(v.susutRiilKg)} Kg
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      {formatPct(v.acuanPct)}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-mono font-bold ${
                      v.status === 'oos'
                        ? 'text-rose-600'
                        : v.status === 'waspada'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}>
                      {v.deviasiPct > 0 ? `+${formatPct(v.deviasiPct)}` : formatPct(v.deviasiPct)}
                      <div className="text-[10px] font-normal">
                        {v.deviasiKg > 0 ? `+${formatKg(v.deviasiKg)}` : formatKg(v.deviasiKg)} Kg
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        v.status === 'oos'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : v.status === 'waspada'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {v.status === 'oos' ? (
                          <>
                            <AlertOctagon className="w-3 h-3 text-rose-600" />
                            <span>OOS</span>
                          </>
                        ) : v.status === 'waspada' ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            <span>Waspada</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Normal</span>
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-left max-w-sm">
                      <div className="font-semibold text-slate-800 text-[11px]">
                        {v.faktorDominan}
                      </div>
                      <div className="text-slate-500 text-[11px] leading-relaxed">
                        {v.autoDiagnosa}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalDetailPages > 1 && (
            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 no-print">
              <div>
                Menampilkan {pagedVarianList.length} dari {varianKomparasiList.length} varian · Halaman {detailPage} / {totalDetailPages}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDetailPage((p) => Math.max(1, p - 1))}
                  disabled={detailPage <= 1}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDetailPage((p) => Math.min(totalDetailPages, p + 1))}
                  disabled={detailPage >= totalDetailPages}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 cursor-pointer"
                  aria-label="Halaman Berikutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
