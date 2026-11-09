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
  sumber?: 'DHP' | 'REKAP_MASTER'; // Sumber data transaksi
  dhpPartaiId?: string; // ID partai jika berasal dari DHP
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
  | 'data-explorer'
  | 'integrasi-dhp'
  | 'analisis-deviasi';

export interface DeviasiAcuanConfig {
  bulanDasarMulai: string;
  bulanDasarSampai: string;
  tahunDasar: string;
  acuanAktifBulan: string;
  batasWaspadaPct: number; // e.g. 0.30
  batasOosPct: number;     // e.g. 0.60
}

export interface VarianDeviasiResult {
  jenis: string;
  jalur: 'SKT' | 'SKM' | 'Global';
  bakuKg: number;
  hasilKg: number;
  susutRiilKg: number;
  susutRiilPct: number;
  acuanPct: number;
  acuanKg: number;
  deviasiPct: number; // susutRiilPct - acuanPct
  deviasiKg: number;  // susutRiilKg - acuanKg
  status: 'normal' | 'waspada' | 'oos';
  faktorDominan: string;
  autoDiagnosa: string;
  alasanLapangan?: string;
  kaGld?: number | null;
  kaDry?: number | null;
  jumlahBatch?: number;
}

export interface GasConfig {
  execUrl: string;
  spreadsheetId: string;
  sheetName: string;
  lastSyncedAt: string | null;
  autoSync: boolean;
  dhpSpreadsheetId?: string;
}

export interface DhpDryerMachineParams {
  rpmInput: number | null;        // RPM Input Cengkeh (Rpm)
  putaranCylinder: number | null; // Putaran Cylinder (Rpm)
  tekananUap: number | null;      // Tekanan Uap (Bar)
  suhuCylinder: number | null;    // Suhu Cylinder (°C)
  anginHe: number | null;         // Angin HE (Wi)
}

export interface DhpSesiDryer {
  sesi: number;
  label: string;
  tanggal: string;
  rjBasah: number;
  hasilDryer: number;
  kaDry: number | null;
  susutDryerKg: number;
  susutDryerPct: number;
  status: 'selesai' | 'berjalan' | 'belum';
  dryerParams?: DhpDryerMachineParams;
}

export interface DhpQcParams {
  uapBar: number | null;
  admoistRpm: number | null;
  airLpm: number | null;
  kaPraRendam: number | null;
  mesin: string;
  pengering: string;
}

export interface DhpPartaiData {
  id: string; // 'PARTAI 1', 'PARTAI 2', etc.
  namaTab: string;
  noLaporan: string;
  tanggalMulai: string;
  tanggalSelesai: string;
  tanggalAdmoist?: string; // Cell R11 pada lembar kerja Kertas Kerja DHP (proses admoist)
  tanggalRajang?: string;  // Cell K7:N7 pada lembar kerja Kertas Kerja DHP (proses rajang basah)
  tanggalDryer?: string;   // Tanggal Dryer Sesi 1 / Sesi 2
  jenis: string;
  mesin: string;
  gldKering: number;
  koliGld: number;
  kaGld: number | null;
  totalRjBasah: number;
  totalRjKering: number;
  kaDryRata: number | null;
  selisihKg: number;
  selisihPct: number;
  susutDryerKg: number;
  susutDryerPct: number;
  totalSusutKg: number;
  totalSusutPct: number;
  status: 'selesai' | 'berjalan' | 'kosong';
  catatanStatus: string;
  statusDropdownKertasKerja?: string; // Dropdown status Kolom Q / R lembar kerja ("Susut Akhir", "Susut Sementara", "Perkiraan Susut Sementara")
  isSusutAkhir?: boolean;             // True jika operator memilih "Susut Akhir (Gld Kering-Rj. Kering)"
  physicsValidation?: {
    valid: boolean;
    quarantined: boolean;
    reason?: string;
    level: 'normal' | 'waspada' | 'karantina';
  };
  sourceDryerStatus?: 'Proses' | 'OFF'; // Status dari SOURCE HASIL DRYER Cell I14:I25
  isTodayActive?: boolean;              // True jika ada sesi partai yang tanggalnya == Today
  dryerParams?: DhpDryerMachineParams;
  sesiList: DhpSesiDryer[];
  qc: DhpQcParams;
  rawFetchedAt: string;
}

export interface DhpSyncLog {
  id: string;
  partai: string;
  noLaporan: string;
  tanggalProses: string;
  jenis: string;
  gldKering: number;
  rjBasah: number;
  rjKering: number;
  totalSusutKg: number;
  totalSusutPct: number;
  waktuKirim: string;
  pengirim: string;
  status: 'sukses' | 'gagal';
  pesan: string;
}

