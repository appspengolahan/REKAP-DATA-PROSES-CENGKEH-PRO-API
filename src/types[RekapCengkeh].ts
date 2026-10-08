/**
 * Types & Data Contracts
 * Project: Monitoring Board — Rekap Data Proses Cengkeh
 * Divisi Produksi I (PP1) - PT Batu Karang
 */

export interface RawRowCengkeh {
  srcRow: number;
  tanggal: string; // ISO 'yyyy-MM-dd'
  bulan: string;   // 'Januari' ... 'Desember'
  tahun: string;   // '2024', '2025', '2026'
  jenis: string;   // e.g., 'Manado Grade A (2023)', 'Ambon Super (2024)'
  kaGld: number | null;
  gldKering: number;   // Gelondong Kering (Kg) - Input awal
  rjBasah: number;     // Rajang Basah (Kg)
  selisihKg: number;   // Tahap 1: rjBasah - gldKering
  selisihPct: number;  // (selisihKg / gldKering) * 100
  rjKering: number;    // Rajang Kering (Kg) - Output akhir
  kaDry: number | null;
  susutKg: number;     // Tahap 2: rjBasah - rjKering
  susutPct: number;    // (susutKg / rjBasah) * 100
  totalSusutKg: number;// Awal ke Akhir: gldKering - rjKering
  totalSusutPct: number;// (totalSusutKg / gldKering) * 100
  kaSimpan?: number | null;
  rawTanggal?: string;
  verified?: boolean;  // Local check status for audit
}

export interface SummaryKpiCengkeh {
  jumlahData: number;
  gldKering: number;
  rjBasah: number;
  selisihKg: number;
  selisihPct: number;
  rjKering: number;
  susutDryerKg: number;
  susutDryerPct: number;
  totalSusutKg: number;
  totalSusutPct: number;
  totalSusutMinPct: number;
  totalSusutMaxPct: number;
  kaGldRata: number | null;
  kaDryRata: number | null;
  periodeLabel: string;
  mode?: 'tahunan' | 'bulanan' | 'periode';
}

export interface RekapItemCengkeh {
  label: string;
  bulan?: string;
  tahun?: string;
  jumlahData: number;
  gldKering: number;
  rjBasah: number;
  selisihPct: number;
  rjKering: number;
  susutDryerPct: number;
  totalSusutKg: number;
  totalSusutPct: number;
  minPct: number;
  maxPct: number;
  kaGldRata: number | null;
  kaDryRata: number | null;
  kapasitasPct: number;
}

export interface TrendJenisData {
  jenis: string;
  data: RekapItemCengkeh[];
}

export interface FilterOptionsCengkeh {
  tahun: string[];
  bulan: string[];
  jenis: string[];
}

export interface PeriodeRentang {
  bulan: string;
  tahun: string;
}

export type UserRole = 
  | 'Project Manager' 
  | 'Site Engineer' 
  | 'Vendor' 
  | 'Client' 
  | 'Admin'
  | 'Super Admin' 
  | 'Client Hub';

export type ActiveTabCengkeh = 
  | 'dashboard' 
  | 'rekap-bulan' 
  | 'rekap-jenis' 
  | 'saldo-bahan'
  | 'data-explorer';

export interface ItemSaldoBahan {
  id: string;
  kodeBahan: string;
  namaBahan: string;
  kategori: 'Bahan Baku' | 'WIP' | 'Bahan Jadi';
  tahap: string;
  satuan: string;
  masukKg: number;
  keluarKg: number;
  saldoAkhirKg: number;
  kaRata: number | null;
  lokasi: string;
  tglUpdate: string;
  status: 'Aman' | 'Waspada' | 'Kritis';
  persenKapasitas: number;
  batchCount: number;
}

export interface RingkasanSaldoBahan {
  totalSaldoKg: number;
  saldoBahanBakuKg: number;
  saldoWipKg: number;
  saldoBahanJadiKg: number;
  totalVarian: number;
  tglTerkini: string;
}

export interface GasConfig {
  execUrl: string;
  spreadsheetId: string;
  sheetName: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
}

