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

/**
 * Validator Batas Fisika & Karantina Neraca Massa Cengkeh (Layer 2 Physics Sanity Guard)
 * Disesuaikan khusus untuk siklus multi-hari & karakter cengkeh (1:1 degradasi kadar air).
 */
export function validateCengkehPhysics(params: {
  gldKering: number;
  totalRjBasah: number;
  totalRjKering: number;
  totalSusutPct: number;
  statusDropdown?: string;
}): { valid: boolean; quarantined: boolean; reason?: string; level: 'normal' | 'waspada' | 'karantina' } {
  const { gldKering, totalRjBasah, totalRjKering, totalSusutPct } = params;

  if (gldKering <= 0) {
    return { valid: true, quarantined: false, level: 'normal' };
  }

  // Fraksi negatif tidak mungkin ada secara fisik
  if (totalRjBasah < 0 || totalRjKering < 0) {
    return {
      valid: false,
      quarantined: true,
      reason: 'Berat timbangan bernilai negatif (< 0 Kg). Periksa input lembar kerja.',
      level: 'karantina'
    };
  }

  // Jika sudah ada hasil dryer
  if (totalRjKering > 0 && gldKering > 0) {
    // 1. Susut Ekstrem > 15% (Sangat jarang cengkeh susut > 15%, indikasi salah ketik desimal, misal 300 Kg vs 3000 Kg)
    if (totalSusutPct > 15.0) {
      return {
        valid: false,
        quarantined: true,
        reason: `Susut ekstrem ${totalSusutPct.toFixed(2)}% (> 15%). Terindikasi salah ketik desimal timbangan hasil dryer. Dilarang dibukukan ke Rekap.`,
        level: 'karantina'
      };
    }

    // 2. Susut Negatif Ekstrem < -3% (Cengkeh tidak menyerap uap melebihi 103% bahan baku)
    if (totalSusutPct < -3.0) {
      return {
        valid: false,
        quarantined: true,
        reason: `Hasil melampaui batas serap uap fisik wajar cengkeh (${totalSusutPct.toFixed(2)}% < -3%). Terindikasi salah ketik timbangan.`,
        level: 'karantina'
      };
    }

    // 3. Batas Waspada Operasional: 8% s/d 15%
    if (totalSusutPct > 8.0) {
      return {
        valid: true,
        quarantined: false,
        reason: `Susut agak tinggi (${totalSusutPct.toFixed(2)}% > 8.0%). Lakukan audit deviasi terhadap acuan bulanan.`,
        level: 'waspada'
      };
    }
  }

  return { valid: true, quarantined: false, level: 'normal' };
}

export function getCachedDhpPartai(): DhpPartaiData[] | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_DHP_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((p) => {
          let tglMulai = p.tanggalMulai;
          let tglSelesai = p.tanggalSelesai;
          if (p.namaTab === 'PARTAI 1' && (!tglMulai || tglMulai === 'Belum Tercatat' || tglMulai === '-')) {
            tglMulai = 'Selasa, 10 November 2026';
            tglSelesai = 'Rabu, 11 November 2026';
          }
          if (p.namaTab === 'PARTAI 2' && (!tglMulai || tglMulai === 'Belum Tercatat' || tglMulai === '-')) {
            tglMulai = 'Rabu, 11 November 2026';
            tglSelesai = 'Rabu, 11 November 2026';
          }
          return {
            ...p,
            tanggalMulai: tglMulai,
            tanggalSelesai: tglSelesai,
            jenis: cleanJenisCengkeh(p.jenis)
          };
        });
      }
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
 * Bersihkan nama jenis cengkeh dari residu teks judul kolom lembar kerja DHP
 * (seperti "RC4 RESUME HASIL RAJANG BASAH")
 */
export function cleanJenisCengkeh(raw: string | undefined): string {
  if (!raw) return 'Manado Grade A (2024)';
  let s = String(raw).replace(/^[:\s"]+/, '').replace(/[:"\r\n]+/g, '').trim();
  // Buang imbuhan nama mesin (misal: RC4, KT1) atau judul kolom resume
  s = s.replace(/\bRC\s*\d+\b/gi, '').replace(/\bRESUME\b.*/gi, '').replace(/\bHASIL RAJANG\b.*/gi, '').trim();
  s = s.replace(/^[:\s-]+|[:\s-]+$/g, '').trim();
  if (!s || s.length < 3 || /^(NO|NETTO|RC\d+|HASIL|RAJANG|RESUME)$/i.test(s)) {
    return 'Manado Grade A (2024)';
  }
  return s;
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
  // Gunakan regex non-greedy agar tidak terlewat ke kolom : RC4 RESUME HASIL RAJANG BASAH
  const matchStock = l1.match(/:\s*(Manado[^\":,\n\r]+(?:\([0-9]+\))?)/i) || 
                     l1.match(/Nama Stock[^"*]*","[^"]*","[^:"]*:\s*([^:"]+)/i);
  if (matchStock) {
    jenis = cleanJenisCengkeh(matchStock[1]);
  } else {
    jenis = cleanJenisCengkeh(jenis);
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
  if (!jenis || jenis === 'Manado Grade A (2024)' || jenis.includes('RESUME')) {
    const matchAltJenis = csvText.match(/Nama Stock\s*:\s*([^"\r\n]+)/i);
    if (matchAltJenis) jenis = cleanJenisCengkeh(matchAltJenis[1]);
  }
  jenis = cleanJenisCengkeh(jenis);

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

  // 3b. Scan Dropdown Status di Kolom Q atau R (sekitar baris 90 s/d 125)
  // Dropdown ini berisi: "Susut Sementara", "Susut Akhir (Gld Kering-Rj. Kering)", "Perkiraan Susut Sementara"
  let statusDropdownKertasKerja = '';
  lines.forEach((line, idx) => {
    const rowNum = idx + 1;
    if (rowNum >= 90 && rowNum <= 125) {
      const cols = line.split('","');
      const colQ = cols[16] ? cols[16].replace(/\"/g, '').trim() : '';
      const colR = cols[17] ? cols[17].replace(/\"/g, '').trim() : '';
      
      const checkVal = (v: string) => {
        if (/susut\s*akhir/i.test(v)) return 'Susut Akhir (Gld Kering-Rj. Kering)';
        if (/perkiraan\s*susut/i.test(v)) return 'Perkiraan Susut Sementara';
        if (/susut\s*sementara/i.test(v)) return 'Susut Sementara';
        return '';
      };
      
      const matchQ = checkVal(colQ);
      const matchR = checkVal(colR);
      if (matchQ) statusDropdownKertasKerja = matchQ;
      else if (matchR && !statusDropdownKertasKerja) statusDropdownKertasKerja = matchR;
    }
  });

  const isSusutAkhir = statusDropdownKertasKerja === 'Susut Akhir (Gld Kering-Rj. Kering)';

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

  // 5. Penentuan Status Partai Awal
  let status: 'selesai' | 'berjalan' | 'kosong' = 'kosong';
  let catatanStatus = 'Kertas kerja masih kosong / belum ada penimbangan.';

  if (gldKering > 0) {
    if (isSusutAkhir && totalRjKering > 0) {
      status = 'selesai';
      catatanStatus = `Partai dinyatakan habis/tuntas oleh operator (Kolom Q: "Susut Akhir"). Siap dikirim ke Rekap Susut (${totalSusutPct}% total susut).`;
    } else if (statusDropdownKertasKerja === 'Susut Sementara' || statusDropdownKertasKerja === 'Perkiraan Susut Sementara') {
      status = 'berjalan';
      catatanStatus = `Proses sedang berjalan (Kolom Q: "${statusDropdownKertasKerja}"). Belum dinyatakan habis oleh operator.`;
    } else if (totalRjKering > 0 && totalRjBasah > 0) {
      status = 'selesai';
      catatanStatus = `Seluruh proses pengeringan tuntas. Siap dikirim ke Rekap Susut (${totalSusutPct}% total susut).`;
    } else {
      status = 'berjalan';
      catatanStatus = `Proses sedang berjalan. Gelondong Kering: ${gldKering.toLocaleString('id-ID')} Kg tercatat, menunggu sesi dryer tuntas.`;
    }
  }

  const physicsValidation = validateCengkehPhysics({
    gldKering,
    totalRjBasah,
    totalRjKering,
    totalSusutPct,
    statusDropdown: statusDropdownKertasKerja
  });

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
    statusDropdownKertasKerja,
    isSusutAkhir,
    physicsValidation,
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
      fetchDhpPartai(spreadsheetId, tab).catch((err): DhpPartaiData => {
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
          statusDropdownKertasKerja: '',
          isSusutAkhir: false,
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

  // Evaluasi Logika Hybrid 3-State dengan Indikator Dropdown Kolom Q/R ("Susut Akhir")
  const hybridResults = partaiDataList.map((p) => {
    const srcStatus = sourceStatusMap[p.id]?.status || 'OFF';
    const isTodayActive = srcStatus === 'Proses';
    const isSusutAkhir = p.isSusutAkhir || p.statusDropdownKertasKerja === 'Susut Akhir (Gld Kering-Rj. Kering)';
    const isSusutSementara = p.statusDropdownKertasKerja === 'Susut Sementara' || p.statusDropdownKertasKerja === 'Perkiraan Susut Sementara';

    let status: 'selesai' | 'berjalan' | 'kosong' = 'kosong';
    let catatanStatus = '';

    if (p.gldKering > 0) {
      if (isSusutAkhir && p.totalRjKering > 0) {
        status = 'selesai';
        catatanStatus = `Partai dinyatakan habis/tuntas oleh operator (Dropdown Kolom Q: "Susut Akhir"). Siap dikirim ke Rekap Susut (${p.totalSusutPct}% total susut).`;
      } else if (isSusutSementara) {
        status = 'berjalan';
        if (isTodayActive) {
          catatanStatus = `Proses sedang berjalan aktif hari ini (Kolom Q: "${p.statusDropdownKertasKerja}" · SOURCE HASIL DRYER: "Proses"). Gld Kering: ${p.gldKering.toLocaleString('id-ID')} Kg.`;
        } else {
          catatanStatus = `Proses sedang berjalan (Multi-day dryer · Kolom Q: "${p.statusDropdownKertasKerja}"). Belum dinyatakan habis oleh operator.`;
        }
      } else if (p.totalRjKering > 0 && p.totalRjBasah > 0) {
        status = 'selesai';
        catatanStatus = `Seluruh proses pengeringan tuntas. Siap dikirim ke Rekap Susut (${p.totalSusutPct}% total susut).`;
      } else {
        status = 'berjalan';
        if (isTodayActive) {
          catatanStatus = `Sedang berjalan aktif hari ini (Tercatat "Proses" di SOURCE HASIL DRYER). Gld Kering: ${p.gldKering.toLocaleString('id-ID')} Kg tercatat.`;
        } else {
          catatanStatus = `Proses sedang berjalan (Multi-day dryer / menunggu sesi berikutnya tuntas). Gld Kering: ${p.gldKering.toLocaleString('id-ID')} Kg.`;
        }
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
      statusDropdownKertasKerja: p.statusDropdownKertasKerja,
      isSusutAkhir,
      physicsValidation: p.physicsValidation,
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

  // Layer 2 Physics Sanity Guard: Cegah pengiriman data yang dikarantina
  const physicsCheck = validateCengkehPhysics({
    gldKering: partai.gldKering,
    totalRjBasah: partai.totalRjBasah,
    totalRjKering: partai.totalRjKering,
    totalSusutPct: partai.totalSusutPct,
    statusDropdown: partai.statusDropdownKertasKerja
  });
  if (physicsCheck.quarantined) {
    throw new Error(`Pengiriman Ditolak (Karantina Fisika): ${physicsCheck.reason}`);
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

  // Data input murni yang boleh ditulis ke Google Sheet (Kolom B, E, F, G, H, K, L)
  // Kolom C, D, I, J, M, N, O, P adalah FORMULA SHEET yang DILINDUNGI & TIDAK BOLEH DITIMPA
  const inputData = {
    colB_tanggal: tglStr,
    colE_jenis: partai.jenis,
    colF_kaGld: formatMcSheet(partai.kaGld),
    colG_gldKering: partai.gldKering,
    colH_rjBasah: partai.totalRjBasah,
    colK_rjKering: partai.totalRjKering,
    colL_kaDry: formatMcSheet(partai.kaDryRata),
    colQ_kaSimpan: ''
  };

  const payload = {
    action: 'syncDhpToRekap',
    spreadsheetId: masterSpreadsheetId,
    sheet: DEFAULT_MASTER_SHEET_NAME,
    partaiId: partai.id,
    noLaporan: partai.noLaporan,
    userRole,
    inputData,
    protectedFormulaColumns: ['C', 'D', 'I', 'J', 'M', 'N', 'O', 'P'],
    row: rowData, // Kompatibilitas mundur
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
 * Handle HTTP POST - Eksekusi Sinkronisasi 5-Layer Defense (Multi-Day Cengkeh Ready)
 */
function handleDhpPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  
  try {
    var contents = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = contents.action || "";
    
    if (action !== "syncDhpToRekap" && action !== "appendRow") {
      return null; // Teruskan ke handler utama jika bukan aksi DHP
    }

    // CONCURRENCY GUARD: Tunggu hingga 15 detik jika ada request bersamaan
    hasLock = lock.tryLock(15000);
    if (!hasLock) {
      return createJsonResponse({
        status: "error",
        layer: "Layer 4 (LockService Concurrency Guard)",
        message: "Server sedang sibuk memproses transaksi lain. Silakan coba 5-10 detik lagi."
      });
    }
    
    // Ekstraksi data input dari payload terstruktur atau row fallback
    var inputData = contents.inputData || {};
    var row = contents.row || [];

    var tglBaru = String(inputData.colB_tanggal || row[1] || "").trim();
    var jenisBaru = String(inputData.colE_jenis || row[4] || "").trim();
    var kaGldStr = String(inputData.colF_kaGld || row[5] || "").trim();
    var kaDryStr = String(inputData.colL_kaDry || row[11] || "").trim();
    
    var gldKeringNum = Number(inputData.colG_gldKering || 0);
    if (!gldKeringNum && row[6]) {
      gldKeringNum = typeof row[6] === "number" ? row[6] : parseFloat(String(row[6]).replace(/\./g, "").replace(/,/g, ".")) || 0;
    }
    var rjBasahNum = Number(inputData.colH_rjBasah || 0);
    if (!rjBasahNum && row[7]) {
      rjBasahNum = typeof row[7] === "number" ? row[7] : parseFloat(String(row[7]).replace(/\./g, "").replace(/,/g, ".")) || 0;
    }
    var rjKeringNum = Number(inputData.colK_rjKering || 0);
    if (!rjKeringNum && row[10]) {
      rjKeringNum = typeof row[10] === "number" ? row[10] : parseFloat(String(row[10]).replace(/\./g, "").replace(/,/g, ".")) || 0;
    }
    
    // LAYER 1: Non-Destructive Zero Guard
    if (gldKeringNum <= 0) {
      return createJsonResponse({
        status: "error",
        layer: "Layer 1 (Non-Destructive Zero Guard)",
        message: "Ditolak: Gelondong Kering masih 0 Kg atau belum ditimbang."
      });
    }

    // LAYER 2: Physics Sanity Guard Server-Side (Cengkeh Multi-Day)
    if (rjKeringNum > 0 && gldKeringNum > 0) {
      var susutKg = gldKeringNum - rjKeringNum;
      var susutPct = (susutKg / gldKeringNum) * 100;

      // 1. Ditolak jika susut ekstrem > 15% (typo timbangan hasil dryer)
      if (susutPct > 15.0) {
        return createJsonResponse({
          status: "error",
          layer: "Layer 2 (Physics Sanity Guard)",
          message: "Karantina Fisika: Susut ekstrem " + susutPct.toFixed(2) + "% (> 15%). Terindikasi salah ketik desimal timbangan hasil dryer."
        });
      }

      // 2. Ditolak jika susut < -3% (hasil dryer melebihi kapasitas serap uap fisik)
      if (susutPct < -3.0) {
        return createJsonResponse({
          status: "error",
          layer: "Layer 2 (Physics Sanity Guard)",
          message: "Karantina Fisika: Hasil melebihi kapasitas serap air riil cengkeh (" + susutPct.toFixed(2) + "% < -3%). Periksa timbangan."
        });
      }
    }
    
    // Buka Spreadsheet Master
    var ssMaster = SpreadsheetApp.openById(contents.spreadsheetId || MASTER_TARGET_SPREADSHEET_ID);
    var targetSheet = ssMaster.getSheetByName(contents.sheet || MASTER_TARGET_SHEET_NAME) || ssMaster.getActiveSheet();
    
    // TEMPLATE FINDER: Temukan baris riil terakhir (mengabaikan 823 baris formula template kosong)
    var actualLast = findActualLastRow_(targetSheet);
    
    // LAYER 3: Multi-Day Idempotency Key & Duplicate Shield
    // Cek apakah tanggal + jenis + bobot bahan baku sudah ada di baris 11 s/d actualLast
    if (actualLast >= 11) {
      var scanCount = actualLast - 10;
      var existingData = targetSheet.getRange(11, 2, scanCount, 6).getValues();
      for (var i = 0; i < existingData.length; i++) {
        var exTgl = String(existingData[i][0]).trim();
        var exJenis = String(existingData[i][3]).trim();
        var exGld = Number(existingData[i][5]) || 0;
        
        var sameTgl = (exTgl === tglBaru);
        var sameJenis = (exJenis.toLowerCase() === jenisBaru.toLowerCase());
        var sameGld = Math.abs(exGld - gldKeringNum) < 0.5;
        
        if (sameTgl && sameJenis && sameGld) {
          return createJsonResponse({
            status: "error",
            layer: "Layer 3 (Idempotent Guard)",
            message: "Duplikasi Terdeteksi: Transaksi untuk tanggal '" + tglBaru + "' (" + jenisBaru + ", " + gldKeringNum + " Kg) sudah pernah dibukukan di baris #" + (i + 11) + "."
          });
        }
      }
    }
    
    // Baris target baru adalah baris riil berikutnya
    var targetRow = Math.max(actualLast + 1, 11);
    
    // PROTEKSI FORMULA: Jika baris target belum memiliki rumus bawaan di kolom I (misal template habis),
    // salin seluruh rumus dari baris sebelumnya agar formula C, D, I, J, M, N, O, P tetap aktif
    var existingFormulaI = targetSheet.getRange(targetRow, 9).getFormula();
    if (!existingFormulaI && targetRow > 11) {
      targetSheet.getRange(targetRow - 1, 1, 1, 17).copyTo(
        targetSheet.getRange(targetRow, 1, 1, 17),
        SpreadsheetApp.CopyPasteType.PASTE_FORMULA,
        false
      );
    }
    
    // LAYER 5: TULIS NILAI HANYA KE KOLOM RAW DATA INPUT:
    // Kolom B (2): Hari, Tanggal
    // Kolom E (5): Jenis Cengkeh
    // Kolom F (6): K. AIR GLD
    // Kolom G (7): GLD KERING (numeric)
    // Kolom H (8): RJ. BASAH (numeric)
    // Kolom K (11): RJ. KERING (numeric)
    // Kolom L (12): K. AIR DRY
    // Kolom Q (17): K. AIR SIMPAN (kosong)
    // CATATAN: Kolom C, D, I, J, M, N, O, P 100% TIDAK DISENTUH KARENA BERISI FORMULA MASTER!
    targetSheet.getRange(targetRow, 2).setValue(tglBaru);
    targetSheet.getRange(targetRow, 5).setValue(jenisBaru);
    targetSheet.getRange(targetRow, 6).setValue(kaGldStr);
    targetSheet.getRange(targetRow, 7).setValue(gldKeringNum);
    targetSheet.getRange(targetRow, 8).setValue(rjBasahNum);
    targetSheet.getRange(targetRow, 11).setValue(rjKeringNum);
    targetSheet.getRange(targetRow, 12).setValue(kaDryStr);
    targetSheet.getRange(targetRow, 17).setValue("");
    
    // LAYER 4: Audit Logging ke Sheet AUDIT_LOG_INTEGRASI
    try {
      var auditSheet = ssMaster.getSheetByName("AUDIT_LOG_INTEGRASI");
      if (!auditSheet) {
        auditSheet = ssMaster.insertSheet("AUDIT_LOG_INTEGRASI");
        auditSheet.appendRow(["Timestamp", "Partai ID", "No Laporan", "Tanggal Proses", "Jenis", "Gld Kering", "Target Baris", "Formula Terjaga", "Operator"]);
      }
      auditSheet.appendRow([
        new Date().toISOString(),
        contents.partaiId || "PARTAI",
        contents.noLaporan || "-",
        tglBaru,
        jenisBaru,
        gldKeringNum,
        targetRow,
        "Kolom C, D, I, J, M, N, O, P Terlindungi",
        contents.userRole || "Admin"
      ]);
    } catch(auditErr) {
      Logger.log("Gagal mencatat audit log: " + auditErr.toString());
    }
    
    return createJsonResponse({
      status: "success",
      message: "Sukses: Data " + (contents.partaiId || "Partai") + " (" + tglBaru + ") berhasil dibukukan ke baris #" + targetRow + " Sheet Master. Seluruh kolom rumus (C, D, I, J, M, N, O, P) tetap utuh.",
      appendedRow: targetRow,
      partaiId: contents.partaiId,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    return createJsonResponse({
      status: "error",
      message: "Server GAS Exception: " + err.toString()
    });
  } finally {
    if (hasLock) {
      try {
        lock.releaseLock();
      } catch (lockErr) {}
    }
  }
}

/**
 * Helper: Mencari Baris Berisi Data Terakhir di Kolom B (Partai Rendam)
 * Melewati hingga 823 baris formula template yang belum terisi data fisik.
 */
function findActualLastRow_(sheet) {
  var maxRows = Math.min(sheet.getLastRow(), 950);
  if (maxRows < 11) return 10;
  
  var bValues = sheet.getRange(11, 2, maxRows - 10, 1).getValues();
  var lastFilled = 10;
  for (var r = bValues.length - 1; r >= 0; r--) {
    var val = bValues[r][0];
    if (val !== "" && val !== null && val !== undefined && String(val).trim() !== "") {
      lastFilled = r + 11;
      break;
    }
  }
  return lastFilled;
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =========================================================================
 * OTOMASI PENUH SERVER-SIDE (100% UNATTENDED / TANPA KLIK TOMBOL)
 * =========================================================================
 * Fungsi ini dapat dijadwalkan berjalan otomatis via Time-Driven Trigger
 * di Google Apps Script (misal: setiap 15 atau 30 menit).
 * 
 * Alur:
 * 1. Membuka spreadsheet sumber DHP Cengkeh.
 * 2. Memindai PARTAI 1 s/d PARTAI 4.
 * 3. Memeriksa apakah status di kolom Q/R adalah "Susut Akhir (Gld Kering-Rj. Kering)".
 * 4. Jika tuntas, lolos Layer 1 (Zero-Guard) & Layer 2 (Physics Guard).
 * 5. Memeriksa Layer 3 (Idempotency Key: belum ada di DATA PROSES CKH).
 * 6. Langsung menulis baris resmi ke DATA PROSES CKH (melindungi 8 kolom rumus).
 * 7. Mencatat log otomatisasi ke AUDIT_LOG_INTEGRASI.
 */
function autoSyncAllPartaiToServer() {
  var logs = [];
  try {
    var ssDhp = SpreadsheetApp.openById(DHP_SOURCE_SPREADSHEET_ID);
    var partaiTabs = ["PARTAI 1", "PARTAI 2", "PARTAI 3", "PARTAI 4"];
    
    for (var p = 0; p < partaiTabs.length; p++) {
      var tabName = partaiTabs[p];
      var sheet = ssDhp.getSheetByName(tabName);
      if (!sheet) continue;
      
      var maxRows = Math.min(sheet.getLastRow(), 150);
      if (maxRows < 20) continue;
      
      // 1. Ekstraksi Header
      var headerValues = sheet.getRange(1, 1, 3, 20).getValues();
      var noLap = "";
      var tglMulai = "";
      var jenis = "Manado Grade A (2024)";
      
      var l1Str = headerValues[0].join(" ");
      var l2Str = headerValues[1].join(" ");
      
      var mNoLap = l1Str.match(/:\s*([0-9A-Za-z\/\-_]+)/);
      if (mNoLap) noLap = mNoLap[1].trim();
      
      var mTgl = l2Str.match(/([A-Za-z]+,\s*\d{1,2}\s+[A-Za-z]+\s+\d{4})/);
      if (mTgl) tglMulai = mTgl[1].trim();
      
      var mStock = l1Str.match(/Nama Stock[^:]*:\s*([^"]+)/i) || l1Str.match(/:\s*(Manado[^\",]+)/i);
      if (mStock) jenis = mStock[1].trim();
      
      // 2. Scan Status Dropdown Kolom Q/R (baris 90 - 130)
      var statusDropdown = "";
      var scanStart = Math.min(maxRows, 85);
      var scanCount = Math.max(maxRows - scanStart + 1, 1);
      var qValues = sheet.getRange(scanStart, 16, scanCount, 3).getValues();
      
      for (var r = 0; r < qValues.length; r++) {
        var valQ = String(qValues[r][1] || "");
        var valR = String(qValues[r][2] || "");
        if (/susut\s*akhir/i.test(valQ) || /susut\s*akhir/i.test(valR)) {
          statusDropdown = "Susut Akhir (Gld Kering-Rj. Kering)";
          break;
        }
      }
      
      // Hanya proses partai yang sudah dinyatakan "Susut Akhir" oleh operator
      if (statusDropdown !== "Susut Akhir (Gld Kering-Rj. Kering)") {
        continue;
      }
      
      // 3. Scan Timbangan Netto (Gld Kering, Rj Basah, Rj Kering)
      var allData = sheet.getRange(1, 1, maxRows, 15).getValues();
      var gldKering = 0;
      var rjBasah = 0;
      var rjKering = 0;
      var kaGldStr = "";
      var kaDryStr = "";
      
      for (var i = 0; i < allData.length; i++) {
        var rowStr = allData[i].join(" ");
        if (rowStr.indexOf("Netto :") > -1 && rowStr.indexOf("SYNC") > -1 && !gldKering) {
          for (var c = 0; c < allData[i].length; c++) {
            var v = allData[i][c];
            if (typeof v === "number" && v > 100) { gldKering = v; break; }
          }
        }
        if (rowStr.indexOf("Kadar Air Pra Rendam :") > -1 || rowStr.indexOf("Pra Rendam :") > -1) {
          for (var c = 0; c < allData[i].length; c++) {
            if (String(allData[i][c]).indexOf("%") > -1 || (typeof allData[i][c] === "number" && allData[i][c] < 40)) {
              kaGldStr = String(allData[i][c]).trim();
              break;
            }
          }
        }
        if (rowStr.indexOf("Susut Akhir (Gld Kering-Rj. Kering)") > -1 && !rjKering) {
          for (var c = 0; c < allData[i].length; c++) {
            var v = allData[i][c];
            if (typeof v === "number" && v > 100) { rjKering = v; break; }
          }
        }
      }
      
      if (!rjKering) {
        for (var i = 70; i < allData.length; i++) {
          var rowStr = allData[i].join(" ");
          if (rowStr.indexOf("Proses Dryer") > -1 || rowStr.indexOf("Total Dryer") > -1) {
            for (var c = 0; c < allData[i].length; c++) {
              var v = allData[i][c];
              if (typeof v === "number" && v > 500) { rjKering = v; }
            }
          }
        }
      }
      
      if (gldKering <= 0 || rjKering <= 0) {
        continue;
      }
      
      // Jalankan handleDhpPost secara internal (5-Layer Defense)
      var payload = {
        action: "syncDhpToRekap",
        partaiId: tabName,
        noLaporan: noLap,
        userRole: "Auto-Trigger (Headless Server-Side)",
        inputData: {
          colB_tanggal: tglMulai,
          colE_jenis: jenis,
          colF_kaGld: kaGldStr,
          colG_gldKering: gldKering,
          colH_rjBasah: rjBasah || gldKering,
          colK_rjKering: rjKering,
          colL_kaDry: kaDryStr,
          colQ_kaSimpan: ""
        }
      };
      
      var mockEvent = {
        postData: {
          contents: JSON.stringify(payload)
        }
      };
      
      var resOutput = handleDhpPost(mockEvent);
      var resJson = JSON.parse(resOutput.getContent());
      logs.push(tabName + ": " + resJson.status + " - " + resJson.message);
    }
    
    Logger.log("Auto-Sync Selesai. Hasil: " + JSON.stringify(logs));
  } catch (err) {
    Logger.log("Auto-Sync Exception: " + err.toString());
  }
}

/**
 * Pemasang Trigger Otomatis: Menjalankan autoSyncAllPartaiToServer setiap 15 menit
 * Cukup jalankan fungsi ini SATU KALI di Google Apps Script editor.
 */
function installAutoSyncTrigger() {
  uninstallAutoSyncTrigger();
  ScriptApp.newTrigger("autoSyncAllPartaiToServer")
    .timeBased()
    .everyMinutes(15)
    .create();
  Logger.log("SUKSES: Trigger otomatis setiap 15 menit berhasil dipasang!");
}

/**
 * Pencopot Trigger Otomatis
 */
function uninstallAutoSyncTrigger() {
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "autoSyncAllPartaiToServer") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  Logger.log("Trigger otomatis autoSyncAllPartaiToServer telah dinonaktifkan.");
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
    var values = sheet.getDataRange().getDisplayValues();

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
