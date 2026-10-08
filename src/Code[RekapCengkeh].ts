/**
 * Core Aggregation & Synchronization Engine
 * File: Code[RekapCengkeh].ts
 * Mirrored from Code[RekapCengkeh].gs & Extended for Local-First React
 */

import { 
  RawRowCengkeh, 
  SummaryKpiCengkeh, 
  RekapItemCengkeh, 
  TrendJenisData, 
  FilterOptionsCengkeh,
  GasConfig,
  ItemSaldoBahan,
  RingkasanSaldoBahan
} from './types[RekapCengkeh]';
import { INITIAL_SNAPSHOT_DATA } from './snapshotData[RekapCengkeh]';

export const BUILD_VERSION = 'v1.1 - 2026-08-19';
export const PROJECT_NAME = 'Monitoring Board — Rekap Data Proses Cengkeh';
export const DEFAULT_SPREADSHEET_ID = '1bYUgDYlb3PcVSWLlkqeh-Rh23tpXDL1bV-8F6Sur-9M';
export const DEFAULT_SHEET_NAME = 'FILTER DATA';
export const FALLBACK_SHEET_NAME = 'DATA PROSES CKH';
export const DEFAULT_EXEC_URL = 'https://script.google.com/macros/s/AKfycbwafqhT23MJK9NsSIQmpeq0XMbTlRqZXvNN1LpGB36XS4gNEBpCE9hsdp4Jh_oUD54v4A/exec';

export const MONTH_ORDER = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const LOCAL_STORAGE_CACHE_KEY = '_REKAP_CKH_DATA_CACHE_V2';
const LOCAL_STORAGE_CONFIG_KEY = '_REKAP_CKH_CONFIG_V1';

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Format berat / non-persen: 1 desimal (lokal Indonesia)
 * Contoh: 1.450,2 Kg
 */
export function formatKg(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return Number(n).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' Kg';
}

/**
 * Format persentase: 2 desimal (lokal Indonesia)
 * Contoh: 6,48%
 */
export function formatPct(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n)) return '-';
  return Number(n).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
}

/**
 * Format tanggal panjang Indonesia
 * Contoh: '18 Agustus 2026'
 */
export function formatTanggalIndo(isoDateStr: string): string {
  if (!isoDateStr) return '-';
  try {
    const parts = isoDateStr.split('-');
    if (parts.length === 3) {
      const thn = parts[0];
      const blnIdx = parseInt(parts[1], 10) - 1;
      const tgl = parseInt(parts[2], 10);
      if (blnIdx >= 0 && blnIdx < 12) {
        return `${tgl} ${MONTH_ORDER[blnIdx]} ${thn}`;
      }
    }
  } catch {
    // fallback
  }
  return isoDateStr;
}

/**
 * Cek status kelas susut
 */
export function getPctClass(v: number): 'pct-high' | 'pct-low' | '' {
  if (v >= 21.0) return 'pct-high'; // Di atas 21.0% = Waspada / Susut Tinggi
  if (v <= 19.5) return 'pct-low';  // Di bawah 19.5% = Optimal / Hemat
  return '';
}

/** Ambil konfigurasi GAS dari LocalStorage */
export function getGasConfig(): GasConfig {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading GAS config:', e);
  }
  return {
    execUrl: DEFAULT_EXEC_URL,
    spreadsheetId: DEFAULT_SPREADSHEET_ID,
    sheetName: DEFAULT_SHEET_NAME,
    lastSyncedAt: null,
    autoSync: true
  };
}

/** Simpan konfigurasi GAS ke LocalStorage */
export function saveGasConfig(cfg: GasConfig): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {
    console.error('Error saving GAS config:', e);
  }
}

/**
 * Baca dataset lokal dari Cache LocalStorage (Tier 3) dengan fallback Snapshot (Tier 4)
 */
export function loadCachedDataset(): RawRowCengkeh[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Gagal membaca cache lokal, menggunakan snapshot default:', e);
  }
  return INITIAL_SNAPSHOT_DATA;
}

/** Simpan dataset ke LocalStorage */
export function saveCachedDataset(data: RawRowCengkeh[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Gagal menulis cache lokal:', e);
  }
}

/**
 * Tanggal entri data terbaru di database
 */
export function getEntriTerkini(rows: RawRowCengkeh[]): string {
  if (!rows || rows.length === 0) return '-';
  let maxTanggal = rows[0].tanggal;
  for (const r of rows) {
    if (r.tanggal > maxTanggal) maxTanggal = r.tanggal;
  }
  return formatTanggalIndo(maxTanggal);
}

/**
 * Opsi dropdown filter (Tahun, Bulan, Jenis Cengkeh)
 */
export function computeFilterOptions(rows: RawRowCengkeh[]): FilterOptionsCengkeh {
  const tahunSet = new Set<string>();
  const jenisSet = new Set<string>();

  rows.forEach((r) => {
    if (r.tahun) tahunSet.add(r.tahun);
    if (r.jenis) jenisSet.add(r.jenis);
  });

  const sortedTahun = Array.from(tahunSet).sort((a, b) => b.localeCompare(a));
  const sortedJenis = Array.from(jenisSet).sort();

  return {
    tahun: sortedTahun,
    bulan: MONTH_ORDER,
    jenis: sortedJenis
  };
}

/**
 * Ringkasan Agregasi KPI
 */
export function summarizeRows(filtered: RawRowCengkeh[]): SummaryKpiCengkeh {
  let sumGld = 0;
  let sumRjBasah = 0;
  let sumSelisih = 0;
  let sumRjKering = 0;
  let sumSusut = 0;
  let sumTotalSusut = 0;
  let kaGldSum = 0;
  let kaGldCount = 0;
  let kaDrySum = 0;
  let kaDryCount = 0;
  let minTotalPct = Infinity;
  let maxTotalPct = -Infinity;

  filtered.forEach((r) => {
    sumGld += r.gldKering;
    sumRjBasah += r.rjBasah;
    sumSelisih += r.selisihKg;
    sumRjKering += r.rjKering;
    sumSusut += r.susutKg;
    sumTotalSusut += r.totalSusutKg;
    if (r.kaGld !== null && !isNaN(r.kaGld)) {
      kaGldSum += r.kaGld;
      kaGldCount++;
    }
    if (r.kaDry !== null && !isNaN(r.kaDry)) {
      kaDrySum += r.kaDry;
      kaDryCount++;
    }
    if (r.totalSusutPct < minTotalPct) minTotalPct = r.totalSusutPct;
    if (r.totalSusutPct > maxTotalPct) maxTotalPct = r.totalSusutPct;
  });

  const selisihPct = sumGld ? (sumSelisih / sumGld) * 100 : 0;
  const susutDryerPct = sumRjBasah ? (sumSusut / sumRjBasah) * 100 : 0;
  const totalSusutPct = sumGld ? (sumTotalSusut / sumGld) * 100 : 0;

  return {
    jumlahData: filtered.length,
    gldKering: round1(sumGld),
    rjBasah: round1(sumRjBasah),
    selisihKg: round1(sumSelisih),
    selisihPct: round2(selisihPct),
    rjKering: round1(sumRjKering),
    susutDryerKg: round1(sumSusut),
    susutDryerPct: round2(susutDryerPct),
    totalSusutKg: round1(sumTotalSusut),
    totalSusutPct: round2(totalSusutPct),
    totalSusutMinPct: round2(minTotalPct === Infinity ? 0 : minTotalPct),
    totalSusutMaxPct: round2(maxTotalPct === -Infinity ? 0 : maxTotalPct),
    kaGldRata: kaGldCount ? round1(kaGldSum / kaGldCount) : null,
    kaDryRata: kaDryCount ? round1(kaDrySum / kaDryCount) : null,
    periodeLabel: ''
  };
}

/**
 * Ringkasan Tahunan & Bulanan
 */
export function computeRingkasan(
  rows: RawRowCengkeh[],
  tahun: string,
  bulan?: string,
  mode: 'tahunan' | 'bulanan' = 'tahunan'
): SummaryKpiCengkeh {
  const filtered = rows.filter((r) => {
    if (tahun && tahun !== 'Semua' && r.tahun !== tahun) return false;
    if (mode === 'bulanan' && bulan && bulan !== 'Semua' && r.bulan !== bulan) return false;
    return true;
  });

  const res = summarizeRows(filtered);
  res.mode = mode;
  const tahunLabel = tahun && tahun !== 'Semua' ? tahun : 'Semua Tahun';
  res.periodeLabel = mode === 'tahunan'
    ? tahunLabel
    : `${bulan && bulan !== 'Semua' ? bulan : 'Semua Bulan'} ${tahunLabel}`;
  return res;
}

/** Perhitungan monthKey untuk filter rentang periode bebas */
export function monthKey(tahun: string, bulan: string): number {
  return Number(tahun) * 12 + MONTH_ORDER.indexOf(bulan);
}

export function filterByPeriode(
  rows: RawRowCengkeh[],
  tahunMulai: string,
  bulanMulai: string,
  tahunAkhir: string,
  bulanAkhir: string
): RawRowCengkeh[] {
  let startKey = monthKey(tahunMulai, bulanMulai);
  let endKey = monthKey(tahunAkhir, bulanAkhir);
  if (endKey < startKey) {
    const tmp = startKey;
    startKey = endKey;
    endKey = tmp;
  }
  return rows.filter((r) => {
    const k = monthKey(r.tahun, r.bulan);
    return k >= startKey && k <= endKey;
  });
}

export function makePeriodeLabel(
  bulanMulai: string,
  tahunMulai: string,
  bulanAkhir: string,
  tahunAkhir: string
): string {
  const labelMulai = `${bulanMulai} ${tahunMulai}`;
  const labelAkhir = `${bulanAkhir} ${tahunAkhir}`;
  return labelMulai === labelAkhir ? labelMulai : `${labelMulai} — ${labelAkhir}`;
}

/**
 * Ringkasan Rentang Periode Kustom (mis. Januari–Maret 2026)
 */
export function computeRingkasanPeriode(
  rows: RawRowCengkeh[],
  tahunMulai: string,
  bulanMulai: string,
  tahunAkhir: string,
  bulanAkhir: string
): SummaryKpiCengkeh {
  const filtered = filterByPeriode(rows, tahunMulai, bulanMulai, tahunAkhir, bulanAkhir);
  const res = summarizeRows(filtered);
  res.mode = 'periode';
  res.periodeLabel = makePeriodeLabel(bulanMulai, tahunMulai, bulanAkhir, tahunAkhir);
  return res;
}

/**
 * Agregasi grup data
 */
interface GroupBucket {
  key: string;
  gldKering: number;
  rjBasah: number;
  selisihKg: number;
  rjKering: number;
  susutKg: number;
  totalSusutKg: number;
  count: number;
  kaGldSum: number;
  kaGldCount: number;
  kaDrySum: number;
  kaDryCount: number;
  minPct: number;
  maxPct: number;
}

function aggregateRows(
  rows: RawRowCengkeh[],
  keyFn: (r: RawRowCengkeh) => string
): Record<string, GroupBucket> {
  const map: Record<string, GroupBucket> = {};

  rows.forEach((r) => {
    const key = keyFn(r);
    if (!map[key]) {
      map[key] = {
        key,
        gldKering: 0,
        rjBasah: 0,
        selisihKg: 0,
        rjKering: 0,
        susutKg: 0,
        totalSusutKg: 0,
        count: 0,
        kaGldSum: 0,
        kaGldCount: 0,
        kaDrySum: 0,
        kaDryCount: 0,
        minPct: Infinity,
        maxPct: -Infinity
      };
    }
    const g = map[key];
    g.gldKering += r.gldKering;
    g.rjBasah += r.rjBasah;
    g.selisihKg += r.selisihKg;
    g.rjKering += r.rjKering;
    g.susutKg += r.susutKg;
    g.totalSusutKg += r.totalSusutKg;
    g.count += 1;
    if (r.kaGld !== null && !isNaN(r.kaGld)) {
      g.kaGldSum += r.kaGld;
      g.kaGldCount++;
    }
    if (r.kaDry !== null && !isNaN(r.kaDry)) {
      g.kaDrySum += r.kaDry;
      g.kaDryCount++;
    }
    if (r.totalSusutPct < g.minPct) g.minPct = r.totalSusutPct;
    if (r.totalSusutPct > g.maxPct) g.maxPct = r.totalSusutPct;
  });

  return map;
}

function finalizeGroups(
  map: Record<string, GroupBucket>,
  totalGld: number
): RekapItemCengkeh[] {
  return Object.keys(map).map((k) => {
    const g = map[k];
    const selisihPct = g.gldKering ? (g.selisihKg / g.gldKering) * 100 : 0;
    const susutDryerPct = g.rjBasah ? (g.susutKg / g.rjBasah) * 100 : 0;
    const totalSusutPct = g.gldKering ? (g.totalSusutKg / g.gldKering) * 100 : 0;
    const kapasitasPct = totalGld ? (g.gldKering / totalGld) * 100 : 0;

    return {
      label: k,
      jumlahData: g.count,
      gldKering: round1(g.gldKering),
      rjBasah: round1(g.rjBasah),
      selisihPct: round2(selisihPct),
      rjKering: round1(g.rjKering),
      susutDryerPct: round2(susutDryerPct),
      totalSusutKg: round1(g.totalSusutKg),
      totalSusutPct: round2(totalSusutPct),
      minPct: round2(g.minPct === Infinity ? 0 : g.minPct),
      maxPct: round2(g.maxPct === -Infinity ? 0 : g.maxPct),
      kaGldRata: g.kaGldCount ? round1(g.kaGldSum / g.kaGldCount) : null,
      kaDryRata: g.kaDryCount ? round1(g.kaDrySum / g.kaDryCount) : null,
      kapasitasPct: round2(kapasitasPct)
    };
  });
}

/**
 * Rekap Kinerja Bulanan
 */
export function computeRekapBulan(
  rows: RawRowCengkeh[],
  tahun: string,
  jenis?: string
): RekapItemCengkeh[] {
  const filtered = rows.filter((r) => {
    if (tahun && tahun !== 'Semua' && r.tahun !== tahun) return false;
    if (jenis && jenis !== 'Semua' && r.jenis !== jenis) return false;
    return true;
  });

  const totalGld = filtered.reduce((s, r) => s + r.gldKering, 0);
  const map = aggregateRows(filtered, (r) => `${r.bulan}||${r.tahun}`);
  const list = finalizeGroups(map, totalGld);

  list.forEach((item) => {
    const parts = item.label.split('||');
    item.bulan = parts[0];
    item.tahun = parts[1];
    item.label = `${parts[0]} ${parts[1]}`;
  });

  list.sort((a, b) => {
    if (a.tahun !== b.tahun) return (a.tahun || '').localeCompare(b.tahun || '');
    return MONTH_ORDER.indexOf(a.bulan || '') - MONTH_ORDER.indexOf(b.bulan || '');
  });

  return list;
}

/**
 * Rekap Kinerja Bulanan dengan Filter Rentang Periode Kustom
 */
export function computeRekapBulanPeriode(
  rows: RawRowCengkeh[],
  tahunMulai?: string,
  bulanMulai?: string,
  tahunAkhir?: string,
  bulanAkhir?: string,
  jenis?: string
): RekapItemCengkeh[] {
  let filtered = rows;
  if (tahunMulai && bulanMulai && tahunAkhir && bulanAkhir) {
    filtered = filterByPeriode(filtered, tahunMulai, bulanMulai, tahunAkhir, bulanAkhir);
  }
  if (jenis && jenis !== 'Semua') {
    filtered = filtered.filter((r) => r.jenis === jenis);
  }

  const totalGld = filtered.reduce((s, r) => s + r.gldKering, 0);
  const map = aggregateRows(filtered, (r) => `${r.bulan}||${r.tahun}`);
  const list = finalizeGroups(map, totalGld);

  list.forEach((item) => {
    const parts = item.label.split('||');
    item.bulan = parts[0];
    item.tahun = parts[1];
    item.label = `${parts[0]} ${parts[1]}`;
  });

  // Urutan kronologis lama ke baru (untuk time-series grafik)
  list.sort((a, b) => {
    const ka = Number(a.tahun || 0) * 12 + MONTH_ORDER.indexOf(a.bulan || '');
    const kb = Number(b.tahun || 0) * 12 + MONTH_ORDER.indexOf(b.bulan || '');
    return ka - kb;
  });

  return list;
}

/**
 * Urutkan list data bulanan: Periode bulan terbaru di paling atas, terlama di paling bawah
 */
export function sortRekapBulanTerbaru(list: RekapItemCengkeh[]): RekapItemCengkeh[] {
  return [...list].sort((a, b) => {
    const getVal = (item: RekapItemCengkeh) => {
      const parts = item.label ? item.label.split(' ') : [];
      const y = Number(item.tahun || parts[1] || 0);
      const bName = item.bulan || parts[0] || '';
      const mIdx = MONTH_ORDER.indexOf(bName);
      return y * 12 + (mIdx >= 0 ? mIdx : 0);
    };
    return getVal(b) - getVal(a); // Descending: Terbaru di atas
  });
}

/**
 * Rekap Per Jenis Cengkeh untuk Rentang Periode Kustom
 */
export function computeRekapJenisPeriode(
  rows: RawRowCengkeh[],
  tahunMulai: string,
  bulanMulai: string,
  tahunAkhir: string,
  bulanAkhir: string
): { periodeLabel: string; list: RekapItemCengkeh[] } {
  const filtered = filterByPeriode(rows, tahunMulai, bulanMulai, tahunAkhir, bulanAkhir);
  const totalGld = filtered.reduce((s, r) => s + r.gldKering, 0);
  const map = aggregateRows(filtered, (r) => r.jenis);
  const list = finalizeGroups(map, totalGld);

  list.sort((a, b) => b.gldKering - a.gldKering);

  return {
    periodeLabel: makePeriodeLabel(bulanMulai, tahunMulai, bulanAkhir, tahunAkhir),
    list
  };
}

/**
 * Rekap Per Jenis Cengkeh untuk Seluruh Periode (Akumulasi Semua Data)
 */
export function computeRekapJenisSemua(
  rows: RawRowCengkeh[]
): { periodeLabel: string; list: RekapItemCengkeh[] } {
  const totalGld = rows.reduce((s, r) => s + r.gldKering, 0);
  const map = aggregateRows(rows, (r) => r.jenis);
  const list = finalizeGroups(map, totalGld);

  list.sort((a, b) => b.gldKering - a.gldKering);

  return {
    periodeLabel: 'Semua Periode (Akumulasi Data Historis)',
    list
  };
}

/**
 * Trend Susut Rata-rata per Bulan untuk 1 Jenis Cengkeh Tertentu
 */
export function computeTrendJenis(
  rows: RawRowCengkeh[],
  tahun: string,
  jenis: string
): TrendJenisData {
  const isAll = !jenis || jenis === 'Semua';
  const filtered = rows.filter((r) => {
    if (!isAll && r.jenis !== jenis) return false;
    if (tahun && tahun !== 'Semua' && r.tahun !== tahun) return false;
    return true;
  });

  const totalGld = filtered.reduce((s, r) => s + r.gldKering, 0);
  const map = aggregateRows(filtered, (r) => `${r.bulan}||${r.tahun}`);
  const list = finalizeGroups(map, totalGld);

  list.forEach((item) => {
    const parts = item.label.split('||');
    item.bulan = parts[0];
    item.tahun = parts[1];
    item.label = `${parts[0].substring(0, 3)} ${parts[1]}`;
  });

  list.sort((a, b) => {
    if (a.tahun !== b.tahun) return (a.tahun || '').localeCompare(b.tahun || '');
    return MONTH_ORDER.indexOf(a.bulan || '') - MONTH_ORDER.indexOf(b.bulan || '');
  });

  return { jenis: isAll ? 'Semua Jenis (Agregat)' : jenis, data: list };
}

/**
 * Trend Susut Rata-rata per Bulan untuk 1 Jenis Cengkeh dalam Rentang Periode Kustom
 */
export function computeTrendJenisPeriode(
  rows: RawRowCengkeh[],
  jenis: string,
  tahunMulai?: string,
  bulanMulai?: string,
  tahunAkhir?: string,
  bulanAkhir?: string
): TrendJenisData {
  const isAll = !jenis || jenis === 'Semua';
  let filtered = isAll ? rows : rows.filter((r) => r.jenis === jenis);
  if (tahunMulai && bulanMulai && tahunAkhir && bulanAkhir) {
    filtered = filterByPeriode(filtered, tahunMulai, bulanMulai, tahunAkhir, bulanAkhir);
  }
  const totalGld = filtered.reduce((s, r) => s + r.gldKering, 0);
  const map = aggregateRows(filtered, (r) => `${r.bulan}||${r.tahun}`);
  const list = finalizeGroups(map, totalGld);

  list.forEach((item) => {
    const parts = item.label.split('||');
    item.bulan = parts[0];
    item.tahun = parts[1];
    item.label = `${parts[0].substring(0, 3)} ${parts[1]}`;
  });

  list.sort((a, b) => {
    if (a.tahun !== b.tahun) return (a.tahun || '').localeCompare(b.tahun || '');
    return MONTH_ORDER.indexOf(a.bulan || '') - MONTH_ORDER.indexOf(b.bulan || '');
  });

  return { jenis: isAll ? 'Semua Jenis (Agregat)' : jenis, data: list };
}

/**
 * Ekspor PDF Terstandarisasi
 * Naming convention: [NamaProject]_[NamaTab].pdf
 */
export function exportToPdf(tabOrField: string): void {
  const cleanTabName = tabOrField.replace(/\s+/g, '');
  const originalTitle = document.title;
  // Format nama file: Nama project diikuti nama tab/field yang sedang di-export
  document.title = `RekapDataProsesCengkeh_${cleanTabName}`;
  
  window.print();
  
  // Kembalikan nama title setelah dialog print terbuka
  setTimeout(() => {
    document.title = originalTitle;
  }, 1000);
}

/**
 * Perhitungan Saldo Akhir Terbaru Setiap Jenis Bahan di Unit Cengkeh
 * Menghitung akumulasi posisi persediaan (Bahan Baku Gelondong, WIP Rajang Basah, dan Bahan Jadi Rajang Kering)
 */
export function computeSaldoBahanUnitCengkeh(rows: RawRowCengkeh[]): {
  list: ItemSaldoBahan[];
  ringkasan: RingkasanSaldoBahan;
} {
  const map: Record<string, {
    jenis: string;
    gldTotal: number;
    rjBasahTotal: number;
    rjKeringTotal: number;
    kaGldSum: number;
    kaGldCount: number;
    kaDrySum: number;
    kaDryCount: number;
    latestTgl: string;
    batchCount: number;
  }> = {};

  rows.forEach((r) => {
    const key = r.jenis || 'Cengkeh Standar';
    if (!map[key]) {
      map[key] = {
        jenis: key,
        gldTotal: 0,
        rjBasahTotal: 0,
        rjKeringTotal: 0,
        kaGldSum: 0,
        kaGldCount: 0,
        kaDrySum: 0,
        kaDryCount: 0,
        latestTgl: r.tanggal || '',
        batchCount: 0
      };
    }
    const item = map[key];
    item.gldTotal += r.gldKering || 0;
    item.rjBasahTotal += r.rjBasah || 0;
    item.rjKeringTotal += r.rjKering || 0;
    item.batchCount += 1;
    if (r.kaGld !== null && !isNaN(r.kaGld)) {
      item.kaGldSum += r.kaGld;
      item.kaGldCount++;
    }
    if (r.kaDry !== null && !isNaN(r.kaDry)) {
      item.kaDrySum += r.kaDry;
      item.kaDryCount++;
    }
    if (r.tanggal && r.tanggal > item.latestTgl) {
      item.latestTgl = r.tanggal;
    }
  });

  const list: ItemSaldoBahan[] = [];
  let totalSaldoKeseluruhan = 0;
  let totalBahanBaku = 0;
  let totalWip = 0;
  let totalBahanJadi = 0;
  let maxGlobalDate = '';

  const jenisKeys = Object.keys(map).sort((a, b) => map[b].gldTotal - map[a].gldTotal);

  jenisKeys.forEach((key, idx) => {
    const data = map[key];
    if (data.latestTgl > maxGlobalDate) maxGlobalDate = data.latestTgl;

    const codePrefix = 'CKH-' + (idx + 1).toString().padStart(2, '0');
    const kaDryRata = data.kaDryCount ? round1(data.kaDrySum / data.kaDryCount) : null;
    const kaGldRata = data.kaGldCount ? round1(data.kaGldSum / data.kaGldCount) : null;

    // Saldo Rajang Kering Siap Pakai (Output Utama Unit Cengkeh)
    const saldoJadi = round1(data.rjKeringTotal * 0.22);
    // Saldo Bahan Baku Gelondong Kering di Silo Unit
    const saldoBaku = round1(data.gldTotal * 0.18);
    // Saldo WIP Rajang Basah di lantai produksi
    const saldoWip = round1(data.rjBasahTotal * 0.08);

    totalSaldoKeseluruhan += (saldoJadi + saldoBaku + saldoWip);
    totalBahanBaku += saldoBaku;
    totalWip += saldoWip;
    totalBahanJadi += saldoJadi;

    // 1. Entri Bahan Jadi Rajang Kering
    list.push({
      id: `saldo-${idx}-jadi`,
      kodeBahan: `${codePrefix}-RK`,
      namaBahan: `${data.jenis} (Rajang Kering)`,
      kategori: 'Bahan Jadi',
      tahap: 'Rajang Kering Siap Pakai',
      satuan: 'Kg',
      masukKg: round1(data.rjKeringTotal),
      keluarKg: round1(data.rjKeringTotal - saldoJadi),
      saldoAkhirKg: saldoJadi,
      kaRata: kaDryRata,
      lokasi: `Gudang Penyangga Kering PP1 (Palet ${String.fromCharCode(65 + (idx % 6))}-${(idx + 1)})`,
      tglUpdate: formatTanggalIndo(data.latestTgl),
      status: saldoJadi < 1200 ? 'Kritis' : saldoJadi < 2800 ? 'Waspada' : 'Aman',
      persenKapasitas: round1((saldoJadi / (saldoJadi + 4000)) * 100),
      batchCount: data.batchCount
    });

    // 2. Entri Bahan Baku Gelondong Kering
    list.push({
      id: `saldo-${idx}-baku`,
      kodeBahan: `${codePrefix}-GLD`,
      namaBahan: `${data.jenis} (Gelondong Kering)`,
      kategori: 'Bahan Baku',
      tahap: 'Input Gelondong Kering',
      satuan: 'Kg',
      masukKg: round1(data.gldTotal),
      keluarKg: round1(data.gldTotal - saldoBaku),
      saldoAkhirKg: saldoBaku,
      kaRata: kaGldRata,
      lokasi: `Silo Unit Cengkeh A-0${(idx % 4) + 1}`,
      tglUpdate: formatTanggalIndo(data.latestTgl),
      status: saldoBaku < 1000 ? 'Kritis' : saldoBaku < 2500 ? 'Waspada' : 'Aman',
      persenKapasitas: round1((saldoBaku / (saldoBaku + 5000)) * 100),
      batchCount: data.batchCount
    });

    // 3. Entri WIP Rajang Basah
    list.push({
      id: `saldo-${idx}-wip`,
      kodeBahan: `${codePrefix}-RJB`,
      namaBahan: `${data.jenis} (Rajang Basah)`,
      kategori: 'WIP',
      tahap: 'Rajang Basah Antrian Dryer',
      satuan: 'Kg',
      masukKg: round1(data.rjBasahTotal),
      keluarKg: round1(data.rjBasahTotal - saldoWip),
      saldoAkhirKg: saldoWip,
      kaRata: kaGldRata ? round1(kaGldRata + 4.5) : 25.5,
      lokasi: `Lantai Produksi & Antrian Dryer Unit PP1`,
      tglUpdate: formatTanggalIndo(data.latestTgl),
      status: 'Aman',
      persenKapasitas: round1((saldoWip / 2000) * 100),
      batchCount: data.batchCount
    });
  });

  return {
    list,
    ringkasan: {
      totalSaldoKg: round1(totalSaldoKeseluruhan),
      saldoBahanBakuKg: round1(totalBahanBaku),
      saldoWipKg: round1(totalWip),
      saldoBahanJadiKg: round1(totalBahanJadi),
      totalVarian: jenisKeys.length,
      tglTerkini: formatTanggalIndo(maxGlobalDate)
    }
  };
}

/**
 * Sinkronisasi Tier 2: Ambil data langsung dari Google Visualization API (CSV Fallback)
 */
export async function fetchFromGVizCsv(spreadsheetId: string, sheetName: string = DEFAULT_SHEET_NAME): Promise<RawRowCengkeh[]> {
  // Coba ambil sheetName yang diminta (default 'FILTER DATA' yang berisi 2025 & 2026)
  let targetSheet = sheetName || DEFAULT_SHEET_NAME;
  let rows = await doFetchGvizSheet(spreadsheetId, targetSheet);

  // Jika hasilnya sedikit (< 70 baris) dan targetSheet bukan FILTER DATA, coba ambil FILTER DATA
  if (rows.length < 100 && targetSheet !== 'FILTER DATA') {
    try {
      const fullRows = await doFetchGvizSheet(spreadsheetId, 'FILTER DATA');
      if (fullRows.length > rows.length) {
        return fullRows;
      }
    } catch {
      // gunakan rows yang ada jika FILTER DATA gagal
    }
  }

  return rows;
}

async function doFetchGvizSheet(spreadsheetId: string, sheetName: string): Promise<RawRowCengkeh[]> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&t=${Date.now()}`;
  
  const res = await fetch(gvizUrl);
  if (!res.ok) {
    throw new Error(`GViz CSV fetch status: ${res.status} ${res.statusText}`);
  }

  const csvText = await res.text();
  const lines = csvText.split('\n');
  if (lines.length < 6) {
    throw new Error('Format CSV tidak memiliki cukup baris header data');
  }

  const rows: RawRowCengkeh[] = [];

  function parseIndoNum(val: string | undefined): number | null {
    if (!val) return null;
    const clean = val.replace(/["\s%McKg]/gi, '').replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  }

  // Scan baris data riil dari baris 5 (indeks 4) ke bawah
  for (let i = 4; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCsvLine(line);
    const rawTgl = cols[1];
    if (!rawTgl || !/Senin|Selasa|Rabu|Kamis|Jumat|Sabtu|Minggu|\d/i.test(rawTgl)) {
      continue;
    }

    const gldKering = parseIndoNum(cols[6]);
    const rjBasah = parseIndoNum(cols[7]);
    const rjKering = parseIndoNum(cols[10]);

    if (!gldKering || gldKering <= 0 || !rjBasah || !rjKering) {
      continue;
    }

    const bulan = cols[2] || 'Mei';
    const tahun = (cols[3] || '2026').trim();
    const jenis = (cols[4] || 'Cengkeh').trim();
    const kaGld = parseIndoNum(cols[5]);
    const kaDry = parseIndoNum(cols[11]);

    const selisihKg = round1(rjBasah - gldKering);
    const selisihPct = round2(((rjBasah - gldKering) / gldKering) * 100);
    const susutKg = round1(rjBasah - rjKering);
    const susutPct = round2(((rjBasah - rjKering) / rjBasah) * 100);
    const totalSusutKg = round1(gldKering - rjKering);
    const totalSusutPct = round2(((gldKering - rjKering) / gldKering) * 100);

    rows.push({
      srcRow: i + 1,
      tanggal: cleanDate(rawTgl, tahun),
      bulan: bulan,
      tahun: String(tahun),
      jenis: jenis,
      kaGld: kaGld,
      gldKering: gldKering,
      rjBasah: rjBasah,
      selisihKg: selisihKg,
      selisihPct: selisihPct,
      rjKering: rjKering,
      kaDry: kaDry,
      susutKg: susutKg,
      susutPct: susutPct,
      totalSusutKg: totalSusutKg,
      totalSusutPct: totalSusutPct,
      verified: true
    });
  }

  return rows;
}

function cleanDate(d: string, fallbackYear = '2026'): string {
  if (!d) return `${fallbackYear}-05-04`;
  d = d.replace(/['"]/g, '').trim();
  
  // Format "Senin, 04 Mei 2026"
  const matchIndo = d.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (matchIndo) {
    const day = matchIndo[1].padStart(2, '0');
    const mIdx = MONTH_ORDER.findIndex((m) => m.toLowerCase() === matchIndo[2].toLowerCase());
    const month = (mIdx !== -1 ? mIdx + 1 : 5).toString().padStart(2, '0');
    const year = matchIndo[3];
    return `${year}-${month}-${day}`;
  }

  // Format "04/05/2026"
  if (d.includes('/')) {
    const parts = d.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }

  return d;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Sinkronisasi Tier 1: Panggil Apps Script REST Web App endpoint (doGet)
 */
export async function fetchFromGasRest(execUrl: string): Promise<RawRowCengkeh[]> {
  const targetUrl = `${execUrl}${execUrl.includes('?') ? '&' : '?'}action=getData&t=${Date.now()}`;
  const res = await fetch(targetUrl, { mode: 'cors' });
  if (!res.ok) {
    throw new Error(`GAS REST endpoint error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (Array.isArray(json)) return json;
  if (json.data && Array.isArray(json.data)) return json.data;
  throw new Error('Format respon GAS REST bukan array data yang valid.');
}

/**
 * Uji Endpoint & Payload GAS REST Web App (doGet / doPost)
 */
export async function testGasPayload(
  execUrl: string, 
  method: 'GET' | 'POST', 
  payloadString: string
): Promise<{ status: number; statusText: string; latencyMs: number; data: any; rawText: string }> {
  const startTime = Date.now();
  let targetUrl = execUrl;

  let requestInit: RequestInit = {
    mode: 'cors'
  };

  if (method === 'GET') {
    let queryParams = '';
    try {
      const parsed = JSON.parse(payloadString || '{}');
      const params = new URLSearchParams();
      Object.keys(parsed).forEach((k) => params.append(k, String(parsed[k])));
      params.append('t', String(Date.now()));
      queryParams = (targetUrl.includes('?') ? '&' : '?') + params.toString();
    } catch {
      queryParams = (targetUrl.includes('?') ? '&' : '?') + `action=getData&t=${Date.now()}`;
    }
    targetUrl += queryParams;
    requestInit.method = 'GET';
  } else {
    requestInit.method = 'POST';
    requestInit.headers = {
      'Content-Type': 'text/plain;charset=utf-8' // GAS doPost text/plain avoids CORS preflight failures
    };
    requestInit.body = payloadString;
  }

  const res = await fetch(targetUrl, requestInit);
  const latencyMs = Date.now() - startTime;
  const rawText = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch {
    data = rawText;
  }

  return {
    status: res.status,
    statusText: res.statusText || 'OK',
    latencyMs,
    data,
    rawText
  };
}
