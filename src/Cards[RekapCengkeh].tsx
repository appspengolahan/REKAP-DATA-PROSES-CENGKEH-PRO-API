/**
 * Summary KPI Cards & Highlight Banners
 * File: Cards[RekapCengkeh].tsx
 * Reference: https://rekap-dataproses-tembakau-pro.vercel.app/
 */
import React from 'react';
import { SummaryKpiCengkeh, PeriodeRentang, RekapItemCengkeh } from './types[RekapCengkeh]';
import { formatKg, formatPct } from './Code[RekapCengkeh]';
import { TrendingUp, TrendingDown, Scale, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

interface KpiItemProps {
  label: string;
  value: string;
  sub?: string;
}

const KpiCard: React.FC<KpiItemProps> = ({ label, value, sub }) => {
  return (
    <div className="bg-[#fafbfd] border border-[#e1e5ec] rounded-[10px] p-3 text-left">
      <div className="text-[10.5px] text-[#6b7280] uppercase tracking-[0.03em] font-medium">
        {label}
      </div>
      <div className="text-[18px] font-bold mt-1 text-[#0d3a8a] leading-tight">
        {value}
      </div>
      {sub ? (
        <div className="text-[11px] text-[#6b7280] mt-0.5 truncate">
          {sub}
        </div>
      ) : (
        <div className="text-[11px] text-transparent mt-0.5 select-none">-</div>
      )}
    </div>
  );
};

export const SummaryKpiGrid: React.FC<{ data: SummaryKpiCengkeh | null }> = ({ data }) => {
  if (!data) {
    return <div className="text-center py-6 text-[#6b7280] text-xs">Memuat data KPI...</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
      <KpiCard
        label="Jumlah Data"
        value={`${data.jumlahData.toLocaleString('id-ID')} entri`}
      />
      <KpiCard
        label="Gld. Kering"
        value={formatKg(data.gldKering)}
      />
      <KpiCard
        label="Rajang Basah"
        value={formatKg(data.rjBasah)}
      />
      <KpiCard
        label="Selisih Rata²"
        value={formatPct(data.selisihPct)}
        sub={formatKg(data.selisihKg)}
      />
      <KpiCard
        label="Rajang Kering"
        value={formatKg(data.rjKering)}
      />
      <KpiCard
        label="Susut Dryer Rata²"
        value={formatPct(data.susutDryerPct)}
        sub={formatKg(data.susutDryerKg)}
      />
      <KpiCard
        label="Total Susut Rata²"
        value={formatPct(data.totalSusutPct)}
        sub={`Min ${formatPct(data.totalSusutMinPct)} · Max ${formatPct(data.totalSusutMaxPct)}`}
      />
      <KpiCard
        label="Kadar Air Gld"
        value={data.kaGldRata !== null ? `${data.kaGldRata.toFixed(1)}%` : '-'}
      />
      <KpiCard
        label="Kadar Air Dryer"
        value={data.kaDryRata !== null ? `${data.kaDryRata.toFixed(1)}%` : '-'}
      />
    </div>
  );
};

interface ExecutiveSummarySectionProps {
  ringkasanTahunan: SummaryKpiCengkeh | null;
  ringkasanBulanan: SummaryKpiCengkeh | null;
  ringkasanPeriode: SummaryKpiCengkeh | null;
  rekapBulan?: RekapItemCengkeh[];
  bulanRingkasan: string;
  onBulanRingkasanChange: (b: string) => void;
  monthsList: string[];
  yearsList: string[];
  periodeAwal: PeriodeRentang;
  periodeAkhir: PeriodeRentang;
  onPeriodeChange: (awal: PeriodeRentang, akhir: PeriodeRentang) => void;
  onApplyPeriode: () => void;
}

export const ExecutiveSummaryCardsRekapCengkeh: React.FC<ExecutiveSummarySectionProps> = ({
  ringkasanTahunan,
  ringkasanBulanan,
  ringkasanPeriode,
  rekapBulan = [],
  bulanRingkasan,
  onBulanRingkasanChange,
  monthsList,
  yearsList,
  periodeAwal,
  periodeAkhir,
  onPeriodeChange,
  onApplyPeriode
}) => {
  // Highlight statistics
  const sortedBySusut = [...rekapBulan].sort((a, b) => b.totalSusutPct - a.totalSusutPct);
  const bulanTertinggi = sortedBySusut.length > 0 ? sortedBySusut[0] : null;
  const bulanOptimal = sortedBySusut.length > 0 ? sortedBySusut[sortedBySusut.length - 1] : null;

  return (
    <div className="space-y-4 mb-5">
      {/* 4 Highlight Metric Cards (Reference Layout) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Highlight 1: Total Baku */}
        <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Total Input Gld. Kering
            </div>
            <div className="text-lg md:text-xl font-bold text-slate-900 mt-0.5">
              {formatKg(ringkasanTahunan?.gldKering || 0)}
            </div>
            <div className="text-[11px] text-blue-600 font-medium mt-0.5">
              Hasil Jd: {formatKg(ringkasanTahunan?.rjKering || 0)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Highlight 2: Rerata Susut Tahunan */}
        <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Rerata Total Susut
            </div>
            <div className="text-lg md:text-xl font-bold text-[#0d3a8a] mt-0.5">
              {formatPct(ringkasanTahunan?.totalSusutPct || 0)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Total Selisih: {formatKg(ringkasanTahunan?.totalSusutKg || 0)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Highlight 3: Bulan Susut Tertinggi */}
        <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Bulan Susut Tertinggi
            </div>
            <div className="text-lg md:text-xl font-bold text-rose-600 mt-0.5">
              {bulanTertinggi ? formatPct(bulanTertinggi.totalSusutPct) : '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[130px]">
              {bulanTertinggi ? `${bulanTertinggi.bulan} ${bulanTertinggi.tahun || ''}` : 'Data stabil'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Highlight 4: Bulan Paling Efisien */}
        <div className="bg-white border border-[#e1e5ec] rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
              Bulan Paling Efisien
            </div>
            <div className="text-lg md:text-xl font-bold text-emerald-600 mt-0.5">
              {bulanOptimal ? formatPct(bulanOptimal.totalSusutPct) : '-'}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[130px]">
              {bulanOptimal ? `${bulanOptimal.bulan} ${bulanOptimal.tahun || ''}` : 'Data stabil'}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2 Kolom Grid: Rekap Tahunan & Rekap Bulanan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Rekap Tahunan */}
        <div className="bg-white border border-[#e1e5ec] rounded-[12px] p-4 shadow-2xs">
          <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
            <h3 className="m-0 text-[14px] font-bold text-[#0d3a8a]">
              📅 Rekap Tahunan
            </h3>
            <span className="text-[11px] bg-[#eef3fd] text-[#0d3a8a] px-2.5 py-1 rounded-full font-semibold">
              {ringkasanTahunan?.periodeLabel || '-'}
            </span>
          </div>
          <SummaryKpiGrid data={ringkasanTahunan} />
        </div>

        {/* 2. Rekap Bulanan */}
        <div className="bg-white border border-[#e1e5ec] rounded-[12px] p-4 shadow-2xs">
          <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
            <h3 className="m-0 text-[14px] font-bold text-[#0d3a8a]">
              🗓️ Rekap Bulanan
            </h3>
            <select
              value={bulanRingkasan}
              onChange={(e) => onBulanRingkasanChange(e.target.value)}
              className="px-2 py-1 rounded-md border border-[#e1e5ec] text-[12px] bg-white text-[#1f2937] cursor-pointer"
            >
              <option value="Semua">Semua</option>
              {monthsList.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="text-[11px] bg-[#eef3fd] text-[#0d3a8a] px-2.5 py-1 rounded-full font-semibold inline-block mb-3">
            {ringkasanBulanan?.periodeLabel || '-'}
          </div>
          <SummaryKpiGrid data={ringkasanBulanan} />
        </div>
      </div>

      {/* 3. Rekap Rentang Periode (Full Width) */}
      <div id="periodeCardAnchor" className="bg-white border border-[#e1e5ec] rounded-[12px] p-4 shadow-2xs">
        <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
          <h3 className="m-0 text-[14px] font-bold text-[#0d3a8a]">
            📆 Rekap Rentang Periode <span className="font-normal text-[#6b7280] text-xs">(mis. Januari–Maret)</span>
          </h3>
          <div className="flex items-center gap-2 flex-wrap text-xs no-print">
            <span className="text-[#6b7280]">Dari</span>
            <select
              value={periodeAwal.bulan}
              onChange={(e) => onPeriodeChange({ ...periodeAwal, bulan: e.target.value }, periodeAkhir)}
              className="px-2 py-1 rounded-md border border-[#e1e5ec] text-[12px] bg-white cursor-pointer"
            >
              {monthsList.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={periodeAwal.tahun}
              onChange={(e) => onPeriodeChange({ ...periodeAwal, tahun: e.target.value }, periodeAkhir)}
              className="px-2 py-1 rounded-md border border-[#e1e5ec] text-[12px] bg-white cursor-pointer"
            >
              {yearsList.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <span className="text-[#6b7280]">sampai</span>
            <select
              value={periodeAkhir.bulan}
              onChange={(e) => onPeriodeChange(periodeAwal, { ...periodeAkhir, bulan: e.target.value })}
              className="px-2 py-1 rounded-md border border-[#e1e5ec] text-[12px] bg-white cursor-pointer"
            >
              {monthsList.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              value={periodeAkhir.tahun}
              onChange={(e) => onPeriodeChange(periodeAwal, { ...periodeAkhir, tahun: e.target.value })}
              className="px-2 py-1 rounded-md border border-[#e1e5ec] text-[12px] bg-white cursor-pointer"
            >
              {yearsList.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <button
              onClick={onApplyPeriode}
              className="bg-[#1a56c4] hover:bg-[#0d3a8a] text-white px-3.5 py-1 rounded-md text-[12px] font-medium transition-colors cursor-pointer"
            >
              Terapkan
            </button>
          </div>
        </div>

        <div className="text-[11px] bg-[#eef3fd] text-[#0d3a8a] px-2.5 py-1 rounded-full font-semibold inline-block mb-1.5">
          {ringkasanPeriode?.periodeLabel || '-'}
        </div>
        <div className="text-[11px] text-[#6b7280] mb-3">
          🔗 Rentang ini otomatis mengatur metrik di sini serta tabel di tab "Rekap per Jenis Cengkeh"
        </div>

        <SummaryKpiGrid data={ringkasanPeriode} />
      </div>
    </div>
  );
};
