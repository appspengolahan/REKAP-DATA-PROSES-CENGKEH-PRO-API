/**
 * Interactive SVG Charting Engine with Dynamic Floating Tooltips & Data Labels
 * File: Charts[RekapCengkeh].tsx
 */
import React, { useState } from 'react';
import { RekapItemCengkeh } from './types[RekapCengkeh]';
import { formatKg, formatPct } from './Code[RekapCengkeh]';
import { Maximize2, Sparkles, TrendingUp } from 'lucide-react';

// ===== 1. LINE CHART: TREN SUSUT (%) PER BULAN =====
interface LineChartProps {
  data: RekapItemCengkeh[];
  title?: string;
  lineColor?: string;
  fillColor?: string;
  onExpand?: () => void;
  isExpanded?: boolean;
}

export const TrendLineChartRekapCengkeh: React.FC<LineChartProps> = ({
  data,
  title,
  lineColor = '#1a56c4',
  fillColor = '#1a56c4',
  onExpand,
  isExpanded = false,
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const reactId = React.useId().replace(/[^a-zA-Z0-9]/g, '_');
  const areaGradId = `areaGrad_${reactId}`;
  const badgeShadowId = `badgeShadow_${reactId}`;

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <TrendingUp className="w-6 h-6 text-slate-300 mb-1" />
        <span>Tidak ada data grafik untuk periode ini</span>
      </div>
    );
  }

  const values = data.map((d) => d.totalSusutPct);
  const minVal = Math.max(0, Math.floor(Math.min(...values) - 0.8));
  const maxVal = Math.ceil(Math.max(...values) + 1.8);
  const valRange = maxVal - minVal || 1;

  const width = isExpanded ? 1020 : 780;
  const height = isExpanded ? 460 : 330;
  const paddingLeft = isExpanded ? 64 : 54;
  const paddingRight = isExpanded ? 40 : 36;
  const paddingTop = isExpanded ? 46 : 38; // Extra space for data value badges
  const paddingBottom = isExpanded ? 52 : 44;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, i) => {
    const x = paddingLeft + (i / Math.max(1, data.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - ((d.totalSusutPct - minVal) / valRange) * chartHeight;
    return { x, y, item: d };
  });

  const pathD = points.reduce((acc, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`;

  // Grid steps (4 horizontal lines)
  const steps = 4;
  const gridLines = Array.from({ length: steps + 1 }).map((_, i) => {
    const val = minVal + (i / steps) * valRange;
    const y = paddingTop + chartHeight - (i / steps) * chartHeight;
    return { val, y };
  });

  return (
    <div className="relative w-full select-none">
      {/* Header Bar */}
      {title && (
        <div className="text-xs font-bold text-slate-800 mb-2.5 px-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate">{title}</span>
            <span className="text-[10px] font-normal text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full shrink-0 border border-blue-200">
              Total Susut (%)
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onExpand && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                title="Klik untuk memperbesar grafik ke tengah layar"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>{isExpanded ? 'Layar Penuh' : 'Perbesar'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SVG Canvas Container */}
      <div 
        className="w-full overflow-x-auto relative cursor-pointer pt-1 pb-2"
        onClick={() => {
          if (!isExpanded && onExpand) onExpand();
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full h-auto ${isExpanded ? 'max-h-[520px]' : 'max-h-[360px]'} min-w-[520px]`}
        >
          <defs>
            {/* Blue Gradient - Vibrant & Executive Clean */}
            <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity="0.45" />
              <stop offset="35%" stopColor="#3b82f6" stopOpacity="0.25" />
              <stop offset="70%" stopColor="#60a5fa" stopOpacity="0.10" />
              <stop offset="100%" stopColor="#93c5fd" stopOpacity="0.00" />
            </linearGradient>
            <filter id={badgeShadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#1e3a8a" floodOpacity="0.10" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={g.y}
                x2={width - paddingRight}
                y2={g.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={g.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono font-medium"
              >
                {g.val.toFixed(1)}%
              </text>
            </g>
          ))}

          {/* Area fill with gorgeous Blue Gradient */}
          <path d={areaD} fill={`url(#${areaGradId})`} />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke="#1d4ed8"
            strokeWidth={isExpanded ? 3.6 : 3}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points, Dynamic Guides & Numeric Badges */}
          {points.map((pt, i) => {
            const isActive = activeIdx === i;
            return (
              <g 
                key={i} 
                className="cursor-pointer"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveIdx(activeIdx === i ? null : i);
                }}
              >
                {/* Vertical guideline */}
                {isActive && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + chartHeight}
                    stroke="#2563eb"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Point halo on active */}
                {isActive && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isExpanded ? 13 : 11}
                    fill="#3b82f6"
                    fillOpacity="0.22"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? (isExpanded ? 7.5 : 6.5) : (isExpanded ? 5.5 : 4.5)}
                  fill={isActive ? '#1d4ed8' : '#ffffff'}
                  stroke="#2563eb"
                  strokeWidth={isActive ? 3 : 2}
                />

                {/* Touch / Click hit target */}
                <circle cx={pt.x} cy={pt.y} r="20" fill="transparent" />

                {/* NUMERIC INDICATOR DIRECTLY ABOVE POINT */}
                <g transform={`translate(${pt.x}, ${pt.y - (isExpanded ? 16 : 14)})`}>
                  <rect
                    x={isExpanded ? "-27" : "-23"}
                    y={isExpanded ? "-12" : "-10"}
                    width={isExpanded ? "54" : "46"}
                    height={isExpanded ? "17" : "15"}
                    rx="4"
                    fill={isActive ? '#1e40af' : '#ffffff'}
                    stroke={isActive ? '#3b82f6' : '#bfdbfe'}
                    strokeWidth={isActive ? '1.5' : '1'}
                    filter={`url(#${badgeShadowId})`}
                  />
                  <text
                    x="0"
                    y={isExpanded ? "0.5" : "0.5"}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`${isExpanded ? 'text-[10px]' : 'text-[9px]'} font-bold font-mono ${
                      isActive ? 'fill-white' : 'fill-blue-950'
                    }`}
                  >
                    {pt.item.totalSusutPct.toFixed(2)}%
                  </text>
                </g>

                {/* X Axis Month Label */}
                <text
                  x={pt.x}
                  y={height - 15}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold ${
                    isActive ? 'fill-blue-700 font-bold' : 'fill-slate-600'
                  }`}
                >
                  {pt.item.label ? pt.item.label.split(' ')[0] : ''}
                </text>
                <text
                  x={pt.x}
                  y={height - 3}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 font-medium"
                >
                  {pt.item.tahun || (pt.item.label ? pt.item.label.split(' ')[1] : '')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* DYNAMIC FLOATING POPUP DIRECTLY ABOVE ACTIVE POINT (LIGHT SLEEK CARD WITH BLUE ACCENTS) */}
        {activeIdx !== null && points[activeIdx] && (() => {
          const pt = points[activeIdx];
          const pointXPercent = (pt.x / width) * 100;
          const pointYPercent = (pt.y / height) * 100;
          const clampLeft = Math.max(16, Math.min(84, pointXPercent));
          const isNearTop = pt.y < 120;
          const arrowLeftPercent = Math.max(12, Math.min(88, 50 + (pointXPercent - clampLeft) * 2));

          return (
            <div
              style={{
                left: `${clampLeft}%`,
                top: `${pointYPercent}%`,
                transform: isNearTop 
                  ? 'translate(-50%, 20px)' 
                  : 'translate(-50%, -100%) translateY(-22px)',
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-30 bg-white/98 text-slate-800 backdrop-blur-md rounded-xl p-3 text-xs shadow-xl shadow-blue-950/15 pointer-events-auto border border-blue-200 animate-in fade-in zoom-in-95 duration-150 min-w-[210px] max-w-[275px]"
            >
              {/* Dynamic pointer arrow */}
              {isNearTop ? (
                <div 
                  style={{ left: `${arrowLeftPercent}%` }}
                  className="absolute -top-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-b-8 border-b-white filter drop-shadow-[0_-1px_1px_rgba(59,130,246,0.3)]" 
                />
              ) : (
                <div 
                  style={{ left: `${arrowLeftPercent}%` }}
                  className="absolute -bottom-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-white filter drop-shadow-[0_1px_1px_rgba(59,130,246,0.3)]" 
                />
              )}

              <div className="flex items-center justify-between border-b border-blue-100 pb-1.5 mb-1.5">
                <span className="font-bold text-blue-950 text-[11px] truncate max-w-[130px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 inline-block"></span>
                  <span className="truncate">{pt.item.label || `${pt.item.bulan || ''} ${pt.item.tahun || ''}`}</span>
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200">
                  {formatPct(pt.item.totalSusutPct)}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Gld. Kering:</span>
                  <span className="font-semibold text-slate-900 font-mono">{formatKg(pt.item.gldKering)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Rajang Kering:</span>
                  <span className="font-semibold text-emerald-700 font-mono">{formatKg(pt.item.rjKering)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Total Susut:</span>
                  <span className="font-semibold text-rose-600 font-mono">-{formatKg(pt.item.totalSusutKg)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Susut Dryer:</span>
                  <span className="font-semibold text-amber-700 font-mono">{formatPct(pt.item.susutDryerPct)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Jumlah Batch:</span>
                  <span className="font-semibold text-blue-800 font-mono">{pt.item.jumlahData} partai</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

// ===== 2. GROUPED COLUMN CHART: GLD KERING VS RAJANG KERING (KG) =====
interface CompareChartProps {
  data: RekapItemCengkeh[];
  title?: string;
  onExpand?: () => void;
  isExpanded?: boolean;
}

export const CompareColumnChartRekapCengkeh: React.FC<CompareChartProps> = ({ 
  data, 
  title, 
  onExpand,
  isExpanded = false
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const reactId = React.useId().replace(/[^a-zA-Z0-9]/g, '_');
  const gldGradId = `gldGrad_${reactId}`;
  const rjGradId = `rjGrad_${reactId}`;
  const barShadowId = `barShadow_${reactId}`;

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <TrendingUp className="w-6 h-6 text-slate-300 mb-1" />
        <span>Tidak ada data komparasi untuk periode ini</span>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.gldKering, d.rjKering))) * 1.25 || 1000;

  const width = isExpanded ? 1020 : 780;
  const height = isExpanded ? 460 : 330;
  const paddingLeft = isExpanded ? 66 : 58;
  const paddingRight = isExpanded ? 40 : 36;
  const paddingTop = isExpanded ? 48 : 38;
  const paddingBottom = isExpanded ? 52 : 44;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(isExpanded ? 36 : 26, (groupWidth - 14) / 2);

  const steps = 4;
  const gridLines = Array.from({ length: steps + 1 }).map((_, i) => {
    const val = (i / steps) * maxVal;
    const y = paddingTop + chartHeight - (i / steps) * chartHeight;
    return { val, y };
  });

  // Helper formatting numbers on top of bars
  const formatShort = (n: number) => {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return Math.round(n).toString();
  };

  return (
    <div className="relative w-full select-none">
      {/* Header Bar */}
      {(title || isExpanded) && (
        <div className="text-xs font-bold text-slate-800 mb-2.5 px-1 flex items-center justify-between gap-2 flex-wrap">
          {title ? (
            <span className="truncate">{title}</span>
          ) : (
            <span className="font-semibold text-slate-600">Perbandingan Massa Bahan Baku Awal vs Hasil Pengeringan</span>
          )}
          <div className="flex items-center gap-3 text-[11px] font-normal">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-gradient-to-b from-blue-500 to-blue-700 inline-block shadow-2xs" />
              <span className="text-slate-600 font-medium">Gld. Kering</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-gradient-to-b from-emerald-500 to-emerald-700 inline-block shadow-2xs" />
              <span className="text-slate-600 font-medium">Rajang Kering</span>
            </span>
            {onExpand && !isExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 transition-colors cursor-pointer shadow-2xs ml-1"
                title="Klik untuk memperbesar grafik ke tengah layar"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Perbesar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SVG Container */}
      <div 
        className="w-full overflow-x-auto relative cursor-pointer pt-1 pb-2"
        onClick={() => {
          if (!isExpanded && onExpand) onExpand();
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full h-auto ${isExpanded ? 'max-h-[520px]' : 'max-h-[360px]'} min-w-[520px]`}
        >
          <defs>
            <linearGradient id={gldGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id={rjGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <filter id={barShadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#1e3a8a" floodOpacity="0.10" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={g.y}
                x2={width - paddingRight}
                y2={g.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={g.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono font-medium"
              >
                {Math.round(g.val).toLocaleString('id-ID')}
              </text>
            </g>
          ))}

          {/* Bars */}
          {data.map((d, i) => {
            const centerX = paddingLeft + i * groupWidth + groupWidth / 2;
            const bar1H = (d.gldKering / maxVal) * chartHeight;
            const bar2H = (d.rjKering / maxVal) * chartHeight;
            const y1 = paddingTop + chartHeight - bar1H;
            const y2 = paddingTop + chartHeight - bar2H;
            const isActive = activeIdx === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={(e) => {
                  if (onExpand && !isExpanded) {
                    onExpand();
                  } else {
                    e.stopPropagation();
                    setActiveIdx(activeIdx === i ? null : i);
                  }
                }}
              >
                {/* Background highlight on hover */}
                {isActive && (
                  <rect
                    x={centerX - groupWidth / 2 + 2}
                    y={paddingTop}
                    width={groupWidth - 4}
                    height={chartHeight}
                    fill="#eff6ff"
                    rx="6"
                  />
                )}

                {/* Bar 1: Gld Kering with blue gradient */}
                <rect
                  x={centerX - barWidth - 1.5}
                  y={y1}
                  width={barWidth}
                  height={bar1H}
                  fill={isActive ? '#1e40af' : `url(#${gldGradId})`}
                  rx="3.5"
                />
                {/* Bar 1 Number Badge */}
                <g transform={`translate(${centerX - barWidth / 2 - 1.5}, ${y1 - (isExpanded ? 14 : 11)})`}>
                  <rect 
                    x="-18" 
                    y="-9" 
                    width="36" 
                    height="14" 
                    rx="3" 
                    fill="#eff6ff" 
                    stroke="#bfdbfe" 
                    strokeWidth="0.8" 
                    filter={`url(#${barShadowId})`}
                  />
                  <text
                    x="0"
                    y="1.5"
                    textAnchor="middle"
                    className="text-[8.5px] font-bold fill-blue-900 font-mono select-none"
                  >
                    {formatShort(d.gldKering)}
                  </text>
                </g>

                {/* Bar 2: Rj Kering with emerald gradient */}
                <rect
                  x={centerX + 1.5}
                  y={y2}
                  width={barWidth}
                  height={bar2H}
                  fill={isActive ? '#065f46' : `url(#${rjGradId})`}
                  rx="3.5"
                />
                {/* Bar 2 Number Badge */}
                <g transform={`translate(${centerX + barWidth / 2 + 1.5}, ${y2 - (isExpanded ? 14 : 11)})`}>
                  <rect 
                    x="-18" 
                    y="-9" 
                    width="36" 
                    height="14" 
                    rx="3" 
                    fill="#f0fdf4" 
                    stroke="#bbf7d0" 
                    strokeWidth="0.8" 
                    filter={`url(#${barShadowId})`}
                  />
                  <text
                    x="0"
                    y="1.5"
                    textAnchor="middle"
                    className="text-[8.5px] font-bold fill-emerald-900 font-mono select-none"
                  >
                    {formatShort(d.rjKering)}
                  </text>
                </g>

                {/* Touch / Click hit target */}
                <rect
                  x={centerX - groupWidth / 2}
                  y={paddingTop}
                  width={groupWidth}
                  height={chartHeight + 30}
                  fill="transparent"
                />

                {/* X Axis Month Label */}
                <text
                  x={centerX}
                  y={height - 15}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold ${
                    isActive ? 'fill-blue-700 font-bold' : 'fill-slate-600'
                  }`}
                >
                  {d.label ? d.label.split(' ')[0] : ''}
                </text>
                <text
                  x={centerX}
                  y={height - 3}
                  textAnchor="middle"
                  className="text-[9px] fill-slate-400 font-medium"
                >
                  {d.tahun || (d.label ? d.label.split(' ')[1] : '')}
                </text>
              </g>
            );
          })}
        </svg>

        {/* DYNAMIC FLOATING POPUP DIRECTLY ABOVE ACTIVE BAR GROUP (LIGHT SLEEK CARD WITH BLUE ACCENTS) */}
        {activeIdx !== null && data[activeIdx] && (() => {
          const d = data[activeIdx];
          const groupCenterX = paddingLeft + activeIdx * groupWidth + groupWidth / 2;
          const groupXPercent = (groupCenterX / width) * 100;
          const topBarY = Math.min(
            paddingTop + chartHeight - (d.gldKering / maxVal) * chartHeight,
            paddingTop + chartHeight - (d.rjKering / maxVal) * chartHeight
          );
          const topYPercent = (topBarY / height) * 100;
          const clampLeft = Math.max(16, Math.min(84, groupXPercent));
          const isNearTop = topBarY < 120;
          const arrowLeftPercent = Math.max(12, Math.min(88, 50 + (groupXPercent - clampLeft) * 2));

          return (
            <div
              style={{
                left: `${clampLeft}%`,
                top: `${topYPercent}%`,
                transform: isNearTop 
                  ? 'translate(-50%, 20px)' 
                  : 'translate(-50%, -100%) translateY(-22px)',
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-30 bg-white/98 text-slate-800 backdrop-blur-md rounded-xl p-3 text-xs shadow-xl shadow-blue-950/15 pointer-events-auto border border-blue-200 animate-in fade-in zoom-in-95 duration-150 min-w-[215px] max-w-[280px]"
            >
              {/* Dynamic pointer arrow */}
              {isNearTop ? (
                <div 
                  style={{ left: `${arrowLeftPercent}%` }}
                  className="absolute -top-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-b-8 border-b-white filter drop-shadow-[0_-1px_1px_rgba(59,130,246,0.3)]" 
                />
              ) : (
                <div 
                  style={{ left: `${arrowLeftPercent}%` }}
                  className="absolute -bottom-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-white filter drop-shadow-[0_1px_1px_rgba(59,130,246,0.3)]" 
                />
              )}

              <div className="flex items-center justify-between border-b border-blue-100 pb-1.5 mb-1.5">
                <span className="font-bold text-blue-950 text-[11px] truncate max-w-[130px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 inline-block"></span>
                  <span className="truncate">{d.label}</span>
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">
                  Susut {formatPct(d.totalSusutPct)}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Gld. Kering (Awal):</span>
                  <span className="font-semibold text-blue-950 font-mono">{formatKg(d.gldKering)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Rajang Kering (Akhir):</span>
                  <span className="font-semibold text-emerald-700 font-mono">{formatKg(d.rjKering)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Total Selisih:</span>
                  <span className="font-semibold text-rose-600 font-mono">-{formatKg(d.totalSusutKg)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Susut Dryer:</span>
                  <span className="font-semibold text-amber-700 font-mono">{formatPct(d.susutDryerPct)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

// ===== 3. HORIZONTAL / VERTICAL BAR CHART: TOTAL SUSUT ANTAR JENIS CENGKEH =====
interface JenisBarChartProps {
  data: RekapItemCengkeh[];
  title?: string;
  onExpand?: () => void;
  isExpanded?: boolean;
}

export const JenisBarChartRekapCengkeh: React.FC<JenisBarChartProps> = ({ 
  data, 
  title, 
  onExpand,
  isExpanded = false
}) => {
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const reactId = React.useId().replace(/[^a-zA-Z0-9]/g, '_');
  const jenisGradId = `jenisGrad_${reactId}`;
  const jenisActiveGradId = `jenisActiveGrad_${reactId}`;
  const jenisShadowId = `jenisShadow_${reactId}`;

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <TrendingUp className="w-6 h-6 text-slate-300 mb-1" />
        <span>Tidak ada data jenis cengkeh untuk periode ini</span>
      </div>
    );
  }

  // Ambil top 14 jenis jika terlalu banyak
  const displayData = data.slice(0, 14);
  const maxSusut = Math.max(...displayData.map((d) => d.totalSusutPct)) * 1.25 || 25;

  const width = isExpanded ? 1040 : 780;
  const height = isExpanded ? 480 : 340;
  const paddingLeft = isExpanded ? 58 : 48;
  const paddingRight = isExpanded ? 40 : 36;
  const paddingTop = isExpanded ? 48 : 38;
  const paddingBottom = isExpanded ? 90 : 80; // Space for rotated variety names

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupWidth = chartWidth / displayData.length;
  const barWidth = Math.min(isExpanded ? 44 : 34, groupWidth - 10);

  const steps = 4;
  const gridLines = Array.from({ length: steps + 1 }).map((_, i) => {
    const val = (i / steps) * maxSusut;
    const y = paddingTop + chartHeight - (i / steps) * chartHeight;
    return { val, y };
  });

  return (
    <div className="relative w-full select-none">
      {/* Header Bar */}
      {title && (
        <div className="text-xs font-bold text-slate-800 mb-2.5 px-1 flex items-center justify-between gap-2">
          <span className="truncate">{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-normal text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Total Susut Rata-rata (%)
            </span>
            {onExpand && !isExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onExpand();
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 hover:text-blue-900 border border-blue-200 transition-colors cursor-pointer shadow-2xs"
                title="Klik untuk memperbesar grafik ke tengah layar"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Perbesar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SVG Container */}
      <div 
        className="w-full overflow-x-auto relative cursor-pointer pt-1 pb-2"
        onClick={() => {
          if (!isExpanded && onExpand) onExpand();
        }}
      >
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className={`w-full h-auto ${isExpanded ? 'max-h-[540px]' : 'max-h-[380px]'} min-w-[550px]`}
        >
          <defs>
            <linearGradient id={jenisGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id={jenisActiveGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
            <filter id={jenisShadowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.2" floodColor="#1e3a8a" floodOpacity="0.10" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLines.map((g, i) => (
            <g key={i}>
              <line
                x1={paddingLeft}
                y1={g.y}
                x2={width - paddingRight}
                y2={g.y}
                stroke="#e2e8f0"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 8}
                y={g.y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono font-medium"
              >
                {g.val.toFixed(1)}%
              </text>
            </g>
          ))}

          {/* Bars */}
          {displayData.map((d, i) => {
            const x = paddingLeft + i * groupWidth + (groupWidth - barWidth) / 2;
            const barH = (d.totalSusutPct / maxSusut) * chartHeight;
            const y = paddingTop + chartHeight - barH;
            const isActive = activeIdx === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setActiveIdx(i)}
                onClick={(e) => {
                  if (onExpand && !isExpanded) {
                    onExpand();
                  } else {
                    e.stopPropagation();
                    setActiveIdx(activeIdx === i ? null : i);
                  }
                }}
              >
                {/* Bar with rich blue gradient */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill={isActive ? `url(#${jenisActiveGradId})` : `url(#${jenisGradId})`}
                  rx="4"
                />

                {/* Touch / Click hit target */}
                <rect
                  x={paddingLeft + i * groupWidth}
                  y={paddingTop}
                  width={groupWidth}
                  height={chartHeight + 30}
                  fill="transparent"
                />

                {/* NUMERIC INDICATOR ABOVE BAR */}
                <g transform={`translate(${x + barWidth / 2}, ${y - (isExpanded ? 14 : 12)})`}>
                  <rect
                    x={isExpanded ? "-27" : "-23"}
                    y={isExpanded ? "-12" : "-10"}
                    width={isExpanded ? "54" : "46"}
                    height={isExpanded ? "17" : "15"}
                    rx="3.5"
                    fill={isActive ? '#1e40af' : '#ffffff'}
                    stroke={isActive ? '#3b82f6' : '#bfdbfe'}
                    strokeWidth={isActive ? '1.5' : '1'}
                    filter={`url(#${jenisShadowId})`}
                  />
                  <text
                    x="0"
                    y={isExpanded ? "0.5" : "0.5"}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className={`${isExpanded ? 'text-[10px]' : 'text-[9px]'} font-bold font-mono select-none ${
                      isActive ? 'fill-white' : 'fill-blue-950'
                    }`}
                  >
                    {d.totalSusutPct.toFixed(2)}%
                  </text>
                </g>

                {/* Diagonal Variant label */}
                <g transform={`translate(${x + barWidth / 2}, ${height - 64})`}>
                  <text
                    x={0}
                    y={0}
                    textAnchor="end"
                    transform="rotate(-40)"
                    className={`text-[10px] font-medium ${
                      isActive ? 'fill-blue-950 font-bold' : 'fill-slate-600'
                    }`}
                  >
                    {d.label.length > 22 ? d.label.substring(0, 20) + '…' : d.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>

        {/* DYNAMIC FLOATING POPUP DIRECTLY ABOVE ACTIVE BAR (LIGHT SLEEK CARD WITH BLUE ACCENTS) */}
        {activeIdx !== null && displayData[activeIdx] && (() => {
          const d = displayData[activeIdx];
          const barCenterX = paddingLeft + activeIdx * groupWidth + groupWidth / 2;
          const barXPercent = (barCenterX / width) * 100;
          const topBarY = paddingTop + chartHeight - (d.totalSusutPct / maxSusut) * chartHeight;
          const topYPercent = (topBarY / height) * 100;
          const clampLeft = Math.max(16, Math.min(84, barXPercent));
          const isNearTop = topBarY < 120;
          const arrowLeftPercent = Math.max(12, Math.min(88, 50 + (barXPercent - clampLeft) * 2));

          return (
            <div
              style={{
                left: `${clampLeft}%`,
                top: `${topYPercent}%`,
                transform: isNearTop 
                  ? 'translate(-50%, 20px)' 
                  : 'translate(-50%, -100%) translateY(-22px)',
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-30 bg-white/98 text-slate-800 backdrop-blur-md rounded-xl p-3 text-xs shadow-xl shadow-blue-950/15 pointer-events-auto border border-blue-200 animate-in fade-in zoom-in-95 duration-150 min-w-[215px] max-w-[280px]"
            >
              {/* Dynamic pointer arrow */}
              {isNearTop ? (
                <div 
                  style={{ left: `${arrowLeftPercent}%` }}
                  className="absolute -top-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-b-8 border-b-white filter drop-shadow-[0_-1px_1px_rgba(59,130,246,0.3)]" 
                />
              ) : (
                <div 
                  style={{ left: `${arrowLeftPercent}%` }}
                  className="absolute -bottom-2 -translate-x-1/2 w-0 h-0 border-x-6 border-x-transparent border-t-8 border-t-white filter drop-shadow-[0_1px_1px_rgba(59,130,246,0.3)]" 
                />
              )}

              <div className="flex items-center justify-between border-b border-blue-100 pb-1.5 mb-1.5">
                <span className="font-bold text-blue-950 text-[11px] truncate max-w-[130px] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 inline-block"></span>
                  <span className="truncate">{d.label}</span>
                </span>
                <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200">
                  {formatPct(d.totalSusutPct)}
                </span>
              </div>
              <div className="space-y-1.5 text-[11px] text-slate-600">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Total Volume Gld:</span>
                  <span className="font-semibold text-blue-950 font-mono">{formatKg(d.gldKering)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Hasil Rj. Kering:</span>
                  <span className="font-semibold text-emerald-700 font-mono">{formatKg(d.rjKering)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Porsi Kapasitas:</span>
                  <span className="font-semibold text-blue-800 font-mono">{formatPct(d.kapasitasPct)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                  <span className="text-slate-500">Jumlah Batch:</span>
                  <span className="font-semibold text-amber-700 font-mono">{d.jumlahData} partai</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
