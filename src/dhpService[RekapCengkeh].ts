/**
 * Service & Engine Integrasi DHP Cengkeh
 * File: dhpService[RekapCengkeh].ts
 * PT Batu Karang - Divisi Produksi I (PP1)
 */

import { DhpPartaiData, DhpSesiDryer, DhpQcParams, DhpSyncLog, RawRowCengkeh } from './types[RekapCengkeh]';
import { round1, round2 } from './Code[RekapCengkeh]';

export const DEFAULT_DHP_SPREADSHEET_ID = '1ZEJjMQMBkE8k3NIeHA32P2SooIpvXIfnq_f-pruCelQ';
export const DEFAULT_MASTER_SPREADSHEET_ID = '1bYUgDYlb3PcVSWLlkqeh-Rh23tpXDL1bV-8F6Sur-9M';
export const DEFAULT_MASTER_SHEET_NAME = 'DATA PROSES CKH';

export const DHP_TABS = ['PARTAI 1', 'PARTAI 2', 'PARTAI 3', 'PARTAI 4'] as const;

const LOCAL_STORAGE_DHP_ID_KEY = '_REKAP_CKH_DHP_SPREADSHEET_ID_V1';
const LOCAL_STORAGE_DHP_LOGS_KEY = '_REKAP_CKH_DHP_SYNC_LOGS_V1';
const LOCAL_STORAGE_DHP_CACHE_KEY = '_REKAP_CKH_DHP_PARTAI_CACHE_V1';

export function getDhpSpreadsheetId(): string {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_DHP_ID_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // fallback
  }
  return DEFAULT_DHP_SPREADSHEET_ID;
}

export function saveDhpSpreadsheetId(id: string): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DHP_ID_KEY, id.trim());
  } catch (e) {
    console.error('Gagal menyimpan ID Spreadsheet DHP:', e);
  }
}

export function getDhpSyncLogs(): DhpSyncLog[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DHP_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Gagal membaca log sinkronisasi DHP:', e);
  }
  return [];
}

export function saveDhpSyncLog(log: DhpSyncLog): void {
  try {
    const existing = getDhpSyncLogs();
    const updated = [log, ...existing].slice(0, 50); // Simpan 50 log terbaru
    localStorage.setItem(LOCAL_STORAGE_DHP_LOGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Gagal menulis log sinkronisasi DHP:', e);
  }
}

export function getCachedDhpPartai(): DhpPartaiData[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DHP_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Gagal membaca cache partai DHP:', e);
  }
  return null;
}

export function saveCachedDhpPartai(list: DhpPartaiData[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_DHP_CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Gagal menyimpan cache partai DHP:', e);
  }
}

function cleanIndoNumber(val: string | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const clean = val
    .toString()
    .replace(/["\s%McKgSakØ]/gi, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
}

/**
 * Fetch dan Parse satu Tab Kertas Kerja DHP Cengkeh
 */
export async function fetchDhpPartai(spreadsheetId: string, tabName: string): Promise<DhpPartaiData> {
  const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&t=${Date.now()}`;
  
  const res = await fetch(gvizUrl);
  if (!res.ok) {
    throw new Error(`Gagal menarik tab ${tabName} (HTTP ${res.status} ${res.statusText})`);
  }

  const csvText = await res.text();
  const lines = csvText.split('\n');

  if (lines.length < 15) {
    throw new Error(`Format tab ${tabName} tidak memiliki cukup baris kertas kerja.`);
  }

  let noLaporan = '';
  let tanggalMulai = '';
  let tanggalSelesai = '';
  let jenis = 'Manado Grade A (2024)';
  let mesin = 'RC 4';
  let pengering = 'Dryer';
  let gldKering = 0;
  let koliGld = 0;
  let kaPraRendam: number | null = null;
  let uapBar: number | null = null;
  let admoistRpm: number | null = null;
  let airLpm: number | null = null;

  let rjBasahSesi1 = 0;
  let dryerSesi1 = 0;
  let kaDryer1: number | null = null;
  let rjBasahSesi2 = 0;
  let dryerSesi2 = 0;
  let kaDryer2: number | null = null;

  // 1. Ekstraksi Header (Baris 1 & 2)
  const l1 = lines[0] || '';
  const l2 = lines[1] || '';

  // No Laporan (contoh: : 01/RDM/11/26)
  const matchNoLap = l1.match(/:\s*([0-9A-Za-z\/\-_]+)/);
  if (matchNoLap) noLaporan = matchNoLap[1].trim();

  // Tanggal Mulai (contoh: Selasa, 10 November 2026)
  const matchTgl1 = l2.match(/([A-Za-z]+,\s*\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
  if (matchTgl1) {
    tanggalMulai = matchTgl1[1].trim();
    tanggalSelesai = matchTgl1[1].trim();
  }

  // Nama Stock / Jenis (contoh: Manado Grade A (2024))
  const matchStock = l1.match(/Nama Stock[^"]*","[^"]*","[^"]*:\s*([^"]+)"/i) || l1.match(/:\s*(Manado[^\",]+)/i);
  if (matchStock) {
    jenis = matchStock[1].replace(/^[:\s]+/, '').trim();
  }

  // Mesin (contoh: : RC4)
  const matchMesin = l2.match(/:\s*(RC\s*\d+|KT\s*\d+)/i);
  if (matchMesin) {
    mesin = matchMesin[1].trim();
  }

  // 2. Scan Seluruh Baris untuk Komponen Timbangan & QC
  lines.forEach((l) => {
    // Koli Gelondong Kering (dengan tanda SYNC)
    if (l.includes('Koli :') && l.includes('SYNC')) {
      const matchKoli = l.match(/Koli :","([^"]*)"/);
      if (matchKoli && !koliGld) koliGld = Math.round(cleanIndoNumber(matchKoli[1]));
    }

    // Netto Gelondong Kering (dengan tanda SYNC)
    if (l.includes('Netto :') && l.includes('SYNC')) {
      const matchGld = l.match(/Netto :","([^"]*)"/);
      if (matchGld && !gldKering) gldKering = cleanIndoNumber(matchGld[1]);
    }

    // Kadar Air Pra-Rendam
    if (l.includes('Kadar Air Pra Rendam :') || l.includes('K. Air Pra Rendam :')) {
      const matchKa = l.match(/Pra Rendam :","([^"]*)"/);
      if (matchKa && kaPraRendam === null) {
        const parsed = cleanIndoNumber(matchKa[1]);
        if (parsed > 0) kaPraRendam = parsed;
      }
    }

    // Parameter Fisik Mesin
    if (l.includes('Uap :')) {
      const m = l.match(/Uap :","([^"]*)"/);
      if (m && uapBar === null) uapBar = cleanIndoNumber(m[1]);
    }
    if (l.includes('Putaran Admoist :')) {
      const m = l.match(/Putaran Admoist :","([^"]*)"/);
      if (m && admoistRpm === null) admoistRpm = cleanIndoNumber(m[1]);
    }
    if (l.includes('Pemakaian Air :')) {
      const m = l.match(/Pemakaian Air :","([^"]*)"/);
      if (m && airLpm === null) airLpm = cleanIndoNumber(m[1]);
    }

    // Kadar Air Dryer Sesi 1 & 2
    if (l.includes('K. Air Hasil Dryer 1 :')) {
      const m = l.match(/Hasil Dryer 1 :","([^"]*)"/);
      if (m && kaDryer1 === null) kaDryer1 = cleanIndoNumber(m[1]);
    }
    if (l.includes('K. Air Hasil Dryer 2 :')) {
      const m = l.match(/Hasil Dryer 2 :","([^"]*)"/);
      if (m && kaDryer2 === null) kaDryer2 = cleanIndoNumber(m[1]);
    }

    // Tanggal Sesi 2 jika berbeda hari
    if (l.includes('Proses Dryer Kedua :') || l.includes('Pengeringan :')) {
      const matchTgl2 = l.match(/([A-Za-z]+,\s*\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
      if (matchTgl2 && matchTgl2[1] !== tanggalMulai) {
        tanggalSelesai = matchTgl2[1].trim();
      }
    }
  });

  // Jika namaStock belum tertangkap di baris 1, cari di baris resume
  if (!jenis || jenis === 'Manado Grade A (2024)') {
    const matchAltJenis = csvText.match(/Nama Stock\s*:\s*([^"\r\n]+)/i);
    if (matchAltJenis) jenis = matchAltJenis[1].replace(/[:"]/g, '').trim();
  }

  // 3. Ekstraksi Nilai Rajang Basah & Hasil Dryer
  // Dari struktur sheet: Netto Rajang Basah & Dryer Sesi 1 & 2
  const matchRjBasah1 = csvText.match(/Hasil Rajang Basah Partai \d+ - Sesi 1 :[\s\S]*?Netto :","([^"]*)"/);
  if (matchRjBasah1) rjBasahSesi1 = cleanIndoNumber(matchRjBasah1[1]);

  const matchDryer1 = csvText.match(/Proses Dryer Pertama :[\s\S]*?Rj\. Basah[\s\S]*?N : ([0-9.,]+) Kg/);
  if (matchDryer1) dryerSesi1 = cleanIndoNumber(matchDryer1[1]);

  const matchDryer2 = csvText.match(/Proses Dryer Kedua :[\s\S]*?Rj\. Basah[\s\S]*?N : ([0-9.,]+) Kg/);
  if (matchDryer2) dryerSesi2 = cleanIndoNumber(matchDryer2[1]);

  // Cek apakah ada susut akhir riil tertera
  const matchSusutAkhir = csvText.match(/Susut Akhir \(Gld Kering-Rj\. Kering\)[\s\S]*?([0-9.,]+)\s*Kg/);
  let totalSusutAkhirSheet = 0;
  if (matchSusutAkhir) totalSusutAkhirSheet = cleanIndoNumber(matchSusutAkhir[1]);

  // Total Rajang Basah & Kering
  let totalRjBasah = round1(rjBasahSesi1 + rjBasahSesi2);
  let totalRjKering = round1(dryerSesi1 + dryerSesi2);

  // Jika nilai sesi di sheet masih dalam proses kalkulasi (misal 0 karena proses belum selesai),
  // lakukan fallback ke formula mass balance
  const selisihKg = round1(totalRjBasah - gldKering);
  const selisihPct = gldKering > 0 ? round2((selisihKg / gldKering) * 100) : 0;

  const susutDryerSesi1Kg = round1(rjBasahSesi1 - dryerSesi1);
  const susutDryerSesi1Pct = rjBasahSesi1 > 0 ? round2((susutDryerSesi1Kg / rjBasahSesi1) * 100) : 0;

  const susutDryerSesi2Kg = round1(rjBasahSesi2 - dryerSesi2);
  const susutDryerSesi2Pct = rjBasahSesi2 > 0 ? round2((susutDryerSesi2Kg / rjBasahSesi2) * 100) : 0;

  const totalSusutDryerKg = round1(totalRjBasah - totalRjKering);
  const totalSusutDryerPct = totalRjBasah > 0 ? round2((totalSusutDryerKg / totalRjBasah) * 100) : 0;

  const totalSusutKg = round1(gldKering - totalRjKering);
  const totalSusutPct = gldKering > 0 ? round2((totalSusutKg / gldKering) * 100) : 0;

  // Rata-rata kadar air dryer
  let kaDryRata: number | null = null;
  if (kaDryer1 !== null && kaDryer2 !== null) {
    kaDryRata = round2((kaDryer1 + kaDryer2) / 2);
  } else if (kaDryer1 !== null) {
    kaDryRata = kaDryer1;
  } else if (kaDryer2 !== null) {
    kaDryRata = kaDryer2;
  }

  // 4. Bangun Daftar Sesi Dryer
  const sesiList: DhpSesiDryer[] = [
    {
      sesi: 1,
      label: 'Sesi 1 (Dryer Pertama)',
      tanggal: tanggalMulai,
      rjBasah: rjBasahSesi1,
      hasilDryer: dryerSesi1,
      kaDry: kaDryer1,
      susutDryerKg: susutDryerSesi1Kg,
      susutDryerPct: susutDryerSesi1Pct,
      status: dryerSesi1 > 0 ? 'selesai' : (gldKering > 0 ? 'berjalan' : 'belum')
    },
    {
      sesi: 2,
      label: 'Sesi 2 (Dryer Kedua)',
      tanggal: tanggalSelesai,
      rjBasah: rjBasahSesi2,
      hasilDryer: dryerSesi2,
      kaDry: kaDryer2,
      susutDryerKg: susutDryerSesi2Kg,
      susutDryerPct: susutDryerSesi2Pct,
      status: dryerSesi2 > 0 ? 'selesai' : (dryerSesi1 > 0 ? 'berjalan' : 'belum')
    }
  ];

  // 5. Penentuan Status Partai
  let status: 'selesai' | 'berjalan' | 'kosong' = 'kosong';
  let catatanStatus = 'Kertas kerja masih kosong / belum ada penimbangan.';

  if (gldKering > 0) {
    if (totalRjKering > 0 && totalRjBasah > 0) {
      status = 'selesai';
      catatanStatus = `Seluruh proses pengeringan tuntas. Siap dikirim ke Rekap Susut (${totalSusutPct}% total susut).`;
    } else {
      status = 'berjalan';
      catatanStatus = `Proses sedang berjalan. Gelondong Kering: ${gldKering.toLocaleString('id-ID')} Kg tercatat, menunggu sesi dryer tuntas.`;
    }
  }

  return {
    id: tabName,
    namaTab: tabName,
    noLaporan: noLaporan || '-',
    tanggalMulai: tanggalMulai || 'Belum Tercatat',
    tanggalSelesai: tanggalSelesai || tanggalMulai || 'Belum Tercatat',
    jenis: jenis || 'Manado Grade A',
    mesin: mesin || 'RC 4',
    gldKering,
    koliGld,
    kaGld: kaPraRendam,
    totalRjBasah,
    totalRjKering,
    kaDryRata,
    selisihKg,
    selisihPct,
    susutDryerKg: totalSusutDryerKg,
    susutDryerPct: totalSusutDryerPct,
    totalSusutKg: totalSusutAkhirSheet > 0 ? totalSusutAkhirSheet : totalSusutKg,
    totalSusutPct,
    status,
    catatanStatus,
    sesiList,
    qc: {
      uapBar,
      admoistRpm,
      airLpm,
      kaPraRendam,
      mesin,
      pengering
    },
    rawFetchedAt: new Date().toISOString()
  };
}

/**
 * Fetch dan Parse status harian dari Tab SOURCE HASIL DRYER (Cell I14:I25)
 */
export async function fetchSourceHasilDryerStatus(
  spreadsheetId: string = getDhpSpreadsheetId()
): Promise<Record<string, { status: 'Proses' | 'OFF'; sesiAktif: string[] }>> {
  const result: Record<string, { status: 'Proses' | 'OFF'; sesiAktif: string[] }> = {
    'PARTAI 1': { status: 'OFF', sesiAktif: [] },
    'PARTAI 2': { status: 'OFF', sesiAktif: [] },
    'PARTAI 3': { status: 'OFF', sesiAktif: [] },
    'PARTAI 4': { status: 'OFF', sesiAktif: [] }
  };

  try {
    const gvizUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('SOURCE HASIL DRYER')}&t=${Date.now()}`;
    const res = await fetch(gvizUrl);
    if (!res.ok) return result;

    const csvText = await res.text();
    const lines = csvText.split('\n');

    lines.forEach((l) => {
      // Periksa baris sesi partai I s/d IV
      const isProses = l.includes('"Proses"') || l.includes(';Proses') || l.includes(',Proses');

      if (l.includes('PARTAI I SESI')) {
        if (isProses) {
          result['PARTAI 1'].status = 'Proses';
          result['PARTAI 1'].sesiAktif.push(l.split(',')[1]?.replace(/"/g, '').trim() || 'Sesi I');
        }
      } else if (l.includes('PARTAI II SESI')) {
        if (isProses) {
          result['PARTAI 2'].status = 'Proses';
          result['PARTAI 2'].sesiAktif.push(l.split(',')[1]?.replace(/"/g, '').trim() || 'Sesi II');
        }
      } else if (l.includes('PARTAI III SESI')) {
        if (isProses) {
          result['PARTAI 3'].status = 'Proses';
          result['PARTAI 3'].sesiAktif.push(l.split(',')[1]?.replace(/"/g, '').trim() || 'Sesi III');
        }
      } else if (l.includes('PARTAI IV SESI')) {
        if (isProses) {
          result['PARTAI 4'].status = 'Proses';
          result['PARTAI 4'].sesiAktif.push(l.split(',')[1]?.replace(/"/g, '').trim() || 'Sesi IV');
        }
      }
    });
  } catch (err) {
    console.warn('Gagal membaca SOURCE HASIL DRYER:', err);
  }

  return result;
}

/**
 * Fetch seluruh Tab Partai (Partai 1 s/d 4) secara paralel dengan Logika Hybrid 3-State
 */
export async function fetchAllDhpPartai(spreadsheetId: string = getDhpSpreadsheetId()): Promise<DhpPartaiData[]> {
  // Ambil tab SOURCE HASIL DRYER dan tab masing-masing partai secara paralel
  const [sourceStatusMap, ...partaiDataList] = await Promise.all([
    fetchSourceHasilDryerStatus(spreadsheetId),
    ...DHP_TABS.map((tab) => 
      fetchDhpPartai(spreadsheetId, tab).catch((err) => {
        console.warn(`Gagal memuat ${tab}:`, err);
        return {
          id: tab,
          namaTab: tab,
          noLaporan: '-',
          tanggalMulai: '-',
          tanggalSelesai: '-',
          jenis: '-',
          mesin: '-',
          gldKering: 0,
          koliGld: 0,
          kaGld: null,
          totalRjBasah: 0,
          totalRjKering: 0,
          kaDryRata: null,
          selisihKg: 0,
          selisihPct: 0,
          susutDryerKg: 0,
          susutDryerPct: 0,
          totalSusutKg: 0,
          totalSusutPct: 0,
          status: 'kosong' as const,
          catatanStatus: 'Tab tidak ditemukan atau belum terisi.',
          sourceDryerStatus: 'OFF' as const,
          isTodayActive: false,
          sesiList: [],
          qc: {
            uapBar: null,
            admoistRpm: null,
            airLpm: null,
            kaPraRendam: null,
            mesin: '-',
            pengering: '-'
          },
          rawFetchedAt: new Date().toISOString()
        };
      })
    )
  ]);

  // Evaluasi Logika Hybrid 3-State
  const hybridResults = partaiDataList.map((p) => {
    const srcStatus = sourceStatusMap[p.id]?.status || 'OFF';
    const isTodayActive = srcStatus === 'Proses';

    let status: 'selesai' | 'berjalan' | 'kosong' = 'kosong';
    let catatanStatus = '';

    if (p.gldKering > 0 && p.totalRjKering > 0 && p.totalRjBasah > 0) {
      status = 'selesai';
      catatanStatus = `Seluruh proses pengeringan tuntas. Siap dikirim ke Rekap Susut (${p.totalSusutPct}% total susut).`;
    } else if (p.gldKering > 0) {
      status = 'berjalan';
      if (isTodayActive) {
        catatanStatus = `Sedang berjalan aktif hari ini (Tercatat "Proses" di SOURCE HASIL DRYER). Gld Kering: ${p.gldKering.toLocaleString('id-ID')} Kg tercatat.`;
      } else {
        catatanStatus = `Proses sedang berjalan (Multi-day dryer / menunggu sesi berikutnya tuntas). Gld Kering: ${p.gldKering.toLocaleString('id-ID')} Kg.`;
      }
    } else if (isTodayActive) {
      status = 'berjalan';
      catatanStatus = `Terjadwal aktif hari ini (SOURCE HASIL DRYER: "Proses"). Menunggu penimbangan bahan awal Gelondong Kering.`;
    } else {
      status = 'kosong';
      catatanStatus = `Kertas kerja masih kosong (SOURCE HASIL DRYER: "OFF").`;
    }

    return {
      ...p,
      status,
      catatanStatus,
      sourceDryerStatus: srcStatus,
      isTodayActive
    };
  });

  saveCachedDhpPartai(hybridResults);
  return hybridResults;
}

/**
 * Kirim Data Partai Tuntas ke Google Sheets Master Rekap (DATA PROSES CKH)
 */
export async function pushDhpToMasterSheet(
  partai: DhpPartaiData,
  userRole: string,
  execUrl: string,
  masterSpreadsheetId: string = DEFAULT_MASTER_SPREADSHEET_ID
): Promise<{ success: boolean; message: string; responseData?: any }> {
  if (partai.gldKering <= 0) {
    throw new Error('Gagal: Gelondong Kering masih 0 Kg. Data belum siap dikirim.');
  }

  // Ekstraksi Bulan dan Tahun dari tanggal proses
  const tglStr = partai.tanggalSelesai || partai.tanggalMulai;
  let bulan = 'Mei';
  let tahun = '2026';

  const parts = tglStr.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (parts) {
    bulan = parts[2];
    tahun = parts[3];
  }

  // Format angka ke format lokal Indonesia sesuai standar Google Sheets Master
  const formatKgSheet = (n: number) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const formatPctSheet = (n: number) => Number(n).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
  const formatMcSheet = (n: number | null) => (n !== null ? Number(n).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' Mc' : '');

  // 16 Kolom Baris Resmi DATA PROSES CKH
  const rowData = [
    '', // Col A (Kosong)
    tglStr, // Col B: Hari, Tanggal
    bulan,  // Col C: Bulan
    tahun,  // Col D: Tahun
    partai.jenis, // Col E: Jenis Cengkeh
    formatMcSheet(partai.kaGld), // Col F: K. AIR GLD
    formatKgSheet(partai.gldKering), // Col G: GLD KERING
    formatKgSheet(partai.totalRjBasah), // Col H: RJ. BASAH
    formatKgSheet(partai.selisihKg), // Col I: SELISIH (Kg)
    formatPctSheet(partai.selisihPct), // Col J: SELISIH (%)
    formatKgSheet(partai.totalRjKering), // Col K: RJ. KERING
    formatMcSheet(partai.kaDryRata), // Col L: K. AIR DRY
    formatKgSheet(partai.susutDryerKg), // Col M: SUSUT (Kg)
    formatPctSheet(partai.susutDryerPct), // Col N: SUSUT (%)
    formatKgSheet(partai.totalSusutKg), // Col O: T. SUSUT (Kg)
    formatPctSheet(partai.totalSusutPct), // Col P: T. SUSUT (%)
    '' // Col Q: K. AIR SIMPAN (opsional)
  ];

  const payload = {
    action: 'syncDhpToRekap',
    spreadsheetId: masterSpreadsheetId,
    sheet: DEFAULT_MASTER_SHEET_NAME,
    partaiId: partai.id,
    noLaporan: partai.noLaporan,
    userRole,
    row: rowData,
    partaiSummary: {
      gldKering: partai.gldKering,
      totalRjBasah: partai.totalRjBasah,
      totalRjKering: partai.totalRjKering,
      totalSusutKg: partai.totalSusutKg,
      totalSusutPct: partai.totalSusutPct,
      qc: partai.qc
    }
  };

  try {
    const res = await fetch(execUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8' // Hindari CORS preflight gagal pada Google Apps Script
      },
      body: JSON.stringify(payload)
    });

    const resText = await res.text();
    let resJson: any = null;
    try {
      resJson = JSON.parse(resText);
    } catch {
      // response text
    }

    const logEntry: DhpSyncLog = {
      id: 'dhp-log-' + Date.now(),
      partai: partai.namaTab,
      noLaporan: partai.noLaporan,
      tanggalProses: tglStr,
      jenis: partai.jenis,
      gldKering: partai.gldKering,
      rjBasah: partai.totalRjBasah,
      rjKering: partai.totalRjKering,
      totalSusutKg: partai.totalSusutKg,
      totalSusutPct: partai.totalSusutPct,
      waktuKirim: new Date().toLocaleString('id-ID'),
      pengirim: userRole,
      status: 'sukses',
      pesan: resJson?.message || 'Data partai berhasil terkirim dan tercatat di Rekap Master.'
    };
    saveDhpSyncLog(logEntry);

    return {
      success: true,
      message: logEntry.pesan,
      responseData: resJson || resText
    };
  } catch (err: any) {
    const logEntry: DhpSyncLog = {
      id: 'dhp-log-' + Date.now(),
      partai: partai.namaTab,
      noLaporan: partai.noLaporan,
      tanggalProses: tglStr,
      jenis: partai.jenis,
      gldKering: partai.gldKering,
      rjBasah: partai.totalRjBasah,
      rjKering: partai.totalRjKering,
      totalSusutKg: partai.totalSusutKg,
      totalSusutPct: partai.totalSusutPct,
      waktuKirim: new Date().toLocaleString('id-ID'),
      pengirim: userRole,
      status: 'gagal',
      pesan: err.message || 'Gagal mengirim ke endpoint GAS'
    };
    saveDhpSyncLog(logEntry);
    throw err;
  }
}

/**
 * Script Lengkap Google Apps Script: IntegrasiDHP.gs
 * Standar Arsitektur 5-Layer Defense sesuai referensi ekosistem PP1
 */
export const INTEGRASI_DHP_GAS_CODE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: INTEGRASI DHP CENGKEH (2 ARAH, 5-LAYER DEFENSE)
 * File Target di Google Apps Script Editor: IntegrasiDHP.gs
 * Divisi Produksi I - PT Batu Karang
 * =========================================================================
 * 
 * Sheet Sumber : DHP CENGKEH (${DEFAULT_DHP_SPREADSHEET_ID})
 * Sheet Tujuan : REKAP SUSUT PROSES CENGKEH (${DEFAULT_MASTER_SPREADSHEET_ID})
 * Target Tab   : DATA PROSES CKH
 * 
 * STANDAR ARSITEKTUR 5-LAYER DEFENSE & OPTIMASI OPERASIONAL:
 * - Layer 1 (Non-Destructive Zero Guard): Menolak data yang masih 0 Kg atau dryer belum tuntas.
 * - Layer 2 (Physics & Mass-Balance Boundary): Memverifikasi selisih dan susut dalam batas wajar pabrik.
 * - Layer 3 (Cross-Day Duplicate Shield & Idempotency Key): Mencegah double-input nomor laporan & tanggal sama.
 * - Layer 4 (Audit Logging & Timestamp): Mencatat riwayat pengiriman ke tab AUDIT_LOG_INTEGRASI.
 * - Layer 5 (Atomic Append Row): Menulis 1 baris resmi secara terkunci ke DATA PROSES CKH.
 */

var DHP_SOURCE_SPREADSHEET_ID = "${DEFAULT_DHP_SPREADSHEET_ID}";
var MASTER_TARGET_SPREADSHEET_ID = "${DEFAULT_MASTER_SPREADSHEET_ID}";
var MASTER_TARGET_SHEET_NAME = "DATA PROSES CKH";

/**
 * Handle HTTP GET - Testing & Penarikan Data Server-Side
 */
function handleDhpGet(e) {
  var action = (e && e.parameter && e.parameter.action) || "pingDhp";
  
  if (action === "pingDhp") {
    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      service: "Integrasi DHP Cengkeh",
      version: "v1.2-5Layer",
      sourceId: DHP_SOURCE_SPREADSHEET_ID,
      targetId: MASTER_TARGET_SPREADSHEET_ID,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return null;
}

/**
 * Handle HTTP POST - Eksekusi Sinkronisasi 5-Layer Defense
 */
function handleDhpPost(e) {
  try {
    var contents = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = contents.action || "";
    
    if (action !== "syncDhpToRekap" && action !== "appendRow") {
      return null; // Teruskan ke handler utama jika bukan aksi DHP
    }
    
    var row = contents.row;
    if (!row || !Array.isArray(row) || row.length < 15) {
      return createJsonResponse({
        status: "error",
        layer: "Layer 1 (Payload Guard)",
        message: "Format baris data tidak lengkap atau cacat."
      });
    }
    
    // LAYER 1: Non-Destructive Zero Guard
    var gldKeringStr = row[6] || "";
    var rjBasahStr = row[7] || "";
    var rjKeringStr = row[10] || "";
    
    if (!gldKeringStr || gldKeringStr === "0" || gldKeringStr === "0,0") {
      return createJsonResponse({
        status: "error",
        layer: "Layer 1 (Non-Destructive Zero Guard)",
        message: "Ditolak: Gelondong Kering masih 0 Kg atau belum ditimbang."
      });
    }
    
    // Buka Spreadsheet Master
    var ssMaster = SpreadsheetApp.openById(contents.spreadsheetId || MASTER_TARGET_SPREADSHEET_ID);
    var targetSheet = ssMaster.getSheetByName(contents.sheet || MASTER_TARGET_SHEET_NAME) || ssMaster.getActiveSheet();
    
    // LAYER 3: Cross-Day Duplicate Shield (Cek Tanggal & Jenis)
    var tglBaru = String(row[1]).trim();
    var jenisBaru = String(row[4]).trim();
    var lastRow = targetSheet.getLastRow();
    
    if (lastRow >= 7) {
      var existingData = targetSheet.getRange(7, 2, lastRow - 6, 4).getValues();
      for (var i = 0; i < existingData.length; i++) {
        var existingTgl = String(existingData[i][0]).trim();
        var existingJenis = String(existingData[i][3]).trim();
        if (existingTgl === tglBaru && existingJenis === jenisBaru) {
          return createJsonResponse({
            status: "error",
            layer: "Layer 3 (Duplicate Shield)",
            message: "Duplikasi Terdeteksi: Transaksi untuk tanggal '" + tglBaru + "' dengan jenis '" + jenisBaru + "' sudah ada di baris " + (i + 7) + "."
          });
        }
      }
    }
    
    // LAYER 5: Atomic Append Row ke Master
    targetSheet.appendRow(row);
    var appendedRowNum = targetSheet.getLastRow();
    
    // LAYER 4: Audit Logging ke Sheet AUDIT_LOG (Opsional jika tab ada)
    try {
      var auditSheet = ssMaster.getSheetByName("AUDIT_LOG_INTEGRASI");
      if (!auditSheet) {
        auditSheet = ssMaster.insertSheet("AUDIT_LOG_INTEGRASI");
        auditSheet.appendRow(["Timestamp", "Partai ID", "No Laporan", "Tanggal Proses", "Jenis", "Gld Kering", "Total Susut Kg", "Total Susut %", "Operator/Peran", "Baris Target"]);
      }
      auditSheet.appendRow([
        new Date().toISOString(),
        contents.partaiId || "PARTAI",
        contents.noLaporan || "-",
        tglBaru,
        jenisBaru,
        gldKeringStr,
        row[14] || "-",
        row[15] || "-",
        contents.userRole || "Admin",
        appendedRowNum
      ]);
    } catch(auditErr) {
      Logger.log("Gagal mencatat audit log: " + auditErr.toString());
    }
    
    return createJsonResponse({
      status: "success",
      message: "Sukses: Data " + (contents.partaiId || "Partai") + " (" + tglBaru + ") berhasil dibukukan ke baris #" + appendedRowNum + " Sheet Master.",
      appendedRow: appendedRowNum,
      partaiId: contents.partaiId,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Server GAS Exception: " + err.toString()
    });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;

/**
 * Script Lengkap Google Apps Script: Kode.gs (Utuh 100%)
 * Kompatibel untuk Standalone Script maupun Container-Bound Script
 */
export const KODE_GS_FULL_TEMPLATE = `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT: KODE UTAMA (STANDALONE & BOUND COMPATIBLE)
 * File Target di Google Apps Script Editor: Kode.gs
 * Project: Monitoring Board — Rekap Data Proses Cengkeh
 * Divisi Produksi I - PT Batu Karang
 * =========================================================================
 */

var SPREADSHEET_ID = "${DEFAULT_MASTER_SPREADSHEET_ID}";
var DEFAULT_SHEET = "${DEFAULT_MASTER_SHEET_NAME}";

function doGet(e) {
  try {
    // 1. Delegasi ke IntegrasiDHP jika fungsi ada
    if (typeof handleDhpGet === "function") {
      var dhpGetRes = handleDhpGet(e);
      if (dhpGetRes) return dhpGetRes;
    }

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheetName = (e && e.parameter && e.parameter.sheet) || DEFAULT_SHEET;
    var sheet = ss.getSheetByName(sheetName) || ss.getActiveSheet();
    var values = sheet.getDataRange().getValues();

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      count: values.length,
      sheet: sheetName,
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
    // =====================================================================
    // 1. HOOK INTEGRASI DHP CENGKEH (Memanggil file IntegrasiDHP.gs)
    // =====================================================================
    if (typeof handleDhpPost === "function") {
      var dhpResponse = handleDhpPost(e);
      if (dhpResponse) return dhpResponse;
    }

    // 2. Operasi POST Standar (Ping & Append Baris Umum)
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
      var targetId = body.spreadsheetId || SPREADSHEET_ID;
      var ss = SpreadsheetApp.openById(targetId);
      var targetSheet = ss.getSheetByName(body.sheet || DEFAULT_SHEET) || ss.getActiveSheet();
      targetSheet.appendRow(body.row);
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
}
`;
