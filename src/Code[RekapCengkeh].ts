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
  GasConfig 
} from './types[RekapCengkeh]';
import { INITIAL_SNAPSHOT_DATA } from './snapshotData[RekapCengkeh]';

export const BUILD_VERSION = 'v1.1 - 2026-08-19';
export const PROJECT_NAME = 'Monitoring Board — Rekap Data Proses Cengkeh';
export const DEFAULT_SPREADSHEET_ID = '1bYUgDYlb3PcVSWLlkqeh-Rh23tpXDL1bV-8F6Sur-9M';
export const DEFAULT_SHEET_NAME = 'DATA PROSES CKH';
export const DEFAULT_EXEC_URL = 'https://script.google.com/macros/s/AKfycbyw73q9baE2EK5i4CyJD1kyZcpsbQ609624ZTas_CH79muNNu3XJUUecI__lsS1yRUgEg/exec';

export const MONTH_ORDER = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const LOCAL_STORAGE_CACHE_KEY = '_REKAP_CKH_DATA_CACHE_V1';
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
 * Trend Susut Rata-rata per Bulan untuk 1 Jenis Cengkeh Tertentu
 */
export function computeTrendJenis(
  rows: RawRowCengkeh[],
  tahun: string,
  jenis: string
): TrendJenisData {
  const filtered = rows.filter((r) => {
    if (r.jenis !== jenis) return false;
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

  return { jenis, data: list };
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
 * Sinkronisasi Tier 2: Ambil data langsung dari Google Visualization API (CSV Fallback)
 */
export async function fetchFromGVizCsv(spreadsheetId: string, sheetName: string): Promise<RawRowCengkeh[]> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  
  const res = await fetch(gvizUrl);
  if (!res.ok) {
    throw new Error(`GViz CSV fetch status: ${res.status} ${res.statusText}`);
  }

  const csvText = await res.text();
  const lines = csvText.split('\n');
  if (lines.length < 11) {
    throw new Error('Format CSV tidak memiliki cukup baris header data (DATA_START_ROW = 11)');
  }

  const rows: RawRowCengkeh[] = [];

  // Parse CSV baris demi baris (Header di baris 9, data mulai baris 11)
  for (let i = 10; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Simple CSV parser for quoted or unquoted values
    const cols = parseCsvLine(line);
    // Kolom mapping (1-indexed di GS, 0-indexed di array):
    // 1: Tanggal (Col B)
    // 2: Bulan (Col C)
    // 3: Tahun (Col D)
    // 4: Jenis (Col E)
    // 5: KA Gld (Col F)
    // 6: Gld Kering (Col G)
    // 7: Rj Basah (Col H)
    // 8: Selisih Kg (Col I)
    // 9: Selisih Pct (Col J)
    // 10: Rj Kering (Col K)
    // 11: KA Dry (Col L)
    // 12: Susut Kg (Col M)
    // 13: Susut Pct (Col N)
    // 14: Total Susut Kg (Col O)
    // 15: Total Susut Pct (Col P)

    const rawTgl = cols[1];
    const bulan = cols[2];
    const tahun = cols[3];
    const jenis = cols[4];
    const gldKering = parseFloat((cols[6] || '').replace(/,/g, ''));
    const rjBasah = parseFloat((cols[7] || '').replace(/,/g, ''));
    const rjKering = parseFloat((cols[10] || '').replace(/,/g, ''));

    if (!rawTgl || isNaN(gldKering) || isNaN(rjBasah) || isNaN(rjKering) || gldKering === 0) {
      continue;
    }

    const selisihKg = rjBasah - gldKering;
    const selisihPct = (selisihKg / gldKering) * 100;
    const susutKg = rjBasah - rjKering;
    const susutPct = (susutKg / rjBasah) * 100;
    const totalSusutKg = gldKering - rjKering;
    const totalSusutPct = (totalSusutKg / gldKering) * 100;

    const kaGld = cols[5] ? parseFloat(cols[5].replace(/,/g, '')) : null;
    const kaDry = cols[11] ? parseFloat(cols[11].replace(/,/g, '')) : null;

    rows.push({
      srcRow: i + 1,
      tanggal: cleanDate(rawTgl),
      bulan: bulan || 'Agustus',
      tahun: tahun || '2026',
      jenis: jenis || 'Cengkeh Lokal',
      kaGld: isNaN(kaGld as number) ? null : kaGld,
      gldKering: round1(gldKering),
      rjBasah: round1(rjBasah),
      selisihKg: round1(selisihKg),
      selisihPct: round2(selisihPct),
      rjKering: round1(rjKering),
      kaDry: isNaN(kaDry as number) ? null : kaDry,
      susutKg: round1(susutKg),
      susutPct: round2(susutPct),
      totalSusutKg: round1(totalSusutKg),
      totalSusutPct: round2(totalSusutPct),
      verified: true
    });
  }

  return rows;
}

function cleanDate(d: string): string {
  if (!d) return '';
  d = d.replace(/['"]/g, '').trim();
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
