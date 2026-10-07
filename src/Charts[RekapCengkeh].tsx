/**
 * Interactive SVG Charting Engine
 * File: Charts[RekapCengkeh].tsx
 */
import React, { useState } from 'react';
import { RekapItemCengkeh } from './types[RekapCengkeh]';
import { formatKg, formatPct } from './Code[RekapCengkeh]';
import { Maximize2 } from 'lucide-react';

// ===== 1. LINE CHART: TREN SUSUT (%) PER BULAN =====
interface LineChartProps {
  data: RekapItemCengkeh[];
  title?: string;
  lineColor?: string;
  fillColor?: string;
  onExpand?: () => void;
}

export const TrendLineChartRekapCengkeh: React.FC<LineChartProps> = ({
  data,
  title,
  lineColor = '#1a56c4', // Blue PP1
  fillColor = '#1a56c4',
  onExpand
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        Tidak ada data grafik untuk periode ini
      </div>
    );
  }

  const values = data.map((d) => d.totalSusutPct);
  const minVal = Math.max(0, Math.floor(Math.min(...values) - 1));
  const maxVal = Math.ceil(Math.max(...values) + 1.5);
  const valRange = maxVal - minVal || 1;

  const width = 760;
  const height = 260;
  const paddingLeft = 50;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

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
    <div className="relative w-full overflow-hidden select-none">
      {title && (
        <div className="text-xs font-bold text-slate-700 mb-2 px-1 flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-normal text-slate-400">Total Susut (%)</span>
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Perbesar Grafik (Mode Presentasi)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] min-w-[500px]"
        >
          <defs>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor} stopOpacity="0.22" />
              <stop offset="100%" stopColor={fillColor} stopOpacity="0.01" />
            </linearGradient>
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
                className="text-[10px] fill-slate-400 font-mono"
              >
                {g.val.toFixed(1)}%
              </text>
            </g>
          ))}

          {/* Area fill */}
          <path d={areaD} fill="url(#areaGradient)" />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={lineColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & X Labels */}
          {points.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g key={i} className="cursor-pointer">
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={pt.x}
                    y1={paddingTop}
                    x2={pt.x}
                    y2={paddingTop + chartHeight}
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? 6 : 4}
                  fill={isHovered ? '#1e40af' : '#ffffff'}
                  stroke={lineColor}
                  strokeWidth={isHovered ? 3 : 2}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {/* X Axis label */}
                <text
                  x={pt.x}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[10.5px] font-medium ${isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'}`}
                >
                  {pt.item.label ? pt.item.label.split(' ')[0] : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover Tooltip Card */}
      {hoveredIdx !== null && points[hoveredIdx] && (
        <div
          className="absolute z-10 top-2 right-4 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none animate-in fade-in duration-100 flex items-center gap-3"
        >
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-semibold">
              {points[hoveredIdx].item.label}
            </div>
            <div className="text-sm font-bold text-amber-300">
              {formatPct(points[hoveredIdx].item.totalSusutPct)}
            </div>
          </div>
          <div className="border-l border-slate-700 pl-3 space-y-0.5 text-[11px] text-slate-300">
            <div>Gld: <span className="font-semibold text-white">{formatKg(points[hoveredIdx].item.gldKering)}</span></div>
            <div>Rj Kering: <span className="font-semibold text-white">{formatKg(points[hoveredIdx].item.rjKering)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== 2. GROUPED COLUMN CHART: GLD KERING VS RAJANG KERING (KG) =====
interface CompareChartProps {
  data: RekapItemCengkeh[];
  title?: string;
  onExpand?: () => void;
}

export const CompareColumnChartRekapCengkeh: React.FC<CompareChartProps> = ({ data, title, onExpand }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        Tidak ada data komparasi untuk periode ini
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => Math.max(d.gldKering, d.rjKering))) * 1.15 || 1000;

  const width = 760;
  const height = 260;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const groupWidth = chartWidth / data.length;
  const barWidth = Math.min(22, (groupWidth - 12) / 2);

  const steps = 4;
  const gridLines = Array.from({ length: steps + 1 }).map((_, i) => {
    const val = (i / steps) * maxVal;
    const y = paddingTop + chartHeight - (i / steps) * chartHeight;
    return { val, y };
  });

  return (
    <div className="relative w-full overflow-hidden select-none">
      {title && (
        <div className="text-xs font-bold text-slate-700 mb-2 px-1 flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-3 text-[11px] font-normal">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1a56c4] inline-block" />
              <span className="text-slate-600">Gld. Kering (Awal)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#1b8a5a] inline-block" />
              <span className="text-slate-600">Rajang Kering (Akhir)</span>
            </span>
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer ml-1"
                title="Perbesar Grafik (Mode Presentasi)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[300px] min-w-[500px]"
        >
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
                className="text-[10px] fill-slate-400 font-mono"
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
            const isHovered = hoveredIdx === i;

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Background highlight on hover */}
                {isHovered && (
                  <rect
                    x={centerX - groupWidth / 2 + 2}
                    y={paddingTop}
                    width={groupWidth - 4}
                    height={chartHeight}
                    fill="#f1f5f9"
                    rx="4"
                  />
                )}

                {/* Bar 1: Gld Kering */}
                <rect
                  x={centerX - barWidth - 1.5}
                  y={y1}
                  width={barWidth}
                  height={bar1H}
                  fill={isHovered ? '#0d3a8a' : '#1a56c4'}
                  rx="3"
                />

                {/* Bar 2: Rj Kering */}
                <rect
                  x={centerX + 1.5}
                  y={y2}
                  width={barWidth}
                  height={bar2H}
                  fill={isHovered ? '#146c46' : '#1b8a5a'}
                  rx="3"
                />

                {/* X Axis Label */}
                <text
                  x={centerX}
                  y={height - 12}
                  textAnchor="middle"
                  className={`text-[10.5px] font-medium ${isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-500'}`}
                >
                  {d.label ? d.label.split(' ')[0] : ''}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredIdx !== null && data[hoveredIdx] && (
        <div className="absolute z-10 top-2 right-4 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none flex items-center gap-3">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-semibold">
              {data[hoveredIdx].label}
            </div>
            <div className="text-xs text-amber-300 font-bold mt-0.5">
              Susut: {formatPct(data[hoveredIdx].totalSusutPct)} ({formatKg(data[hoveredIdx].totalSusutKg)})
            </div>
          </div>
          <div className="border-l border-slate-700 pl-3 space-y-0.5 text-[11px] text-slate-300">
            <div>Gld. Kering: <span className="font-semibold text-white">{formatKg(data[hoveredIdx].gldKering)}</span></div>
            <div>Rj. Kering: <span className="font-semibold text-emerald-400">{formatKg(data[hoveredIdx].rjKering)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== 3. HORIZONTAL / VERTICAL BAR CHART: TOTAL SUSUT ANTAR JENIS CENGKEH =====
interface JenisBarChartProps {
  data: RekapItemCengkeh[];
  title?: string;
  onExpand?: () => void;
}

export const JenisBarChartRekapCengkeh: React.FC<JenisBarChartProps> = ({ data, title, onExpand }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        Tidak ada data jenis cengkeh untuk periode ini
      </div>
    );
  }

  // Ambil top 12 jenis jika terlalu banyak
  const displayData = data.slice(0, 12);
  const maxSusut = Math.max(...displayData.map((d) => d.totalSusutPct)) * 1.15 || 25;

  const width = 760;
  const height = 280;
  const paddingLeft = 45;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 75; // Space for tilted / rotated variant names

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;
  const barWidth = Math.min(36, (chartWidth / displayData.length) - 10);

  const steps = 4;
  const gridLines = Array.from({ length: steps + 1 }).map((_, i) => {
    const val = (i / steps) * maxSusut;
    const y = paddingTop + chartHeight - (i / steps) * chartHeight;
    return { val, y };
  });

  return (
    <div className="relative w-full overflow-hidden select-none">
      {title && (
        <div className="text-xs font-bold text-slate-700 mb-2 px-1 flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-normal text-slate-400">Total Susut Rata-rata (%)</span>
            {onExpand && (
              <button
                type="button"
                onClick={onExpand}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Perbesar Grafik (Mode Presentasi)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[320px] min-w-[550px]"
        >
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
                className="text-[10px] fill-slate-400 font-mono"
              >
                {g.val.toFixed(1)}%
              </text>
            </g>
          ))}

          {displayData.map((d, i) => {
            const groupWidth = chartWidth / displayData.length;
            const x = paddingLeft + i * groupWidth + (groupWidth - barWidth) / 2;
            const barH = (d.totalSusutPct / maxSusut) * chartHeight;
            const y = paddingTop + chartHeight - barH;
            const isHovered = hoveredIdx === i;

            // Warna konsisten dengan template Google Charts #1a56c4
            const barFill = isHovered ? '#0d3a8a' : '#1a56c4';

            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  fill={barFill}
                  rx="3"
                />

                {/* Percentage on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-slate-700 font-mono"
                >
                  {d.totalSusutPct.toFixed(2)}%
                </text>

                {/* Diagonal Variant label */}
                <g transform={`translate(${x + barWidth / 2}, ${height - 60})`}>
                  <text
                    x={0}
                    y={0}
                    textAnchor="end"
                    transform="rotate(-40)"
                    className={`text-[9.5px] font-medium ${isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-600'}`}
                  >
                    {d.label.length > 20 ? d.label.substring(0, 18) + '...' : d.label}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      {hoveredIdx !== null && displayData[hoveredIdx] && (
        <div className="absolute z-10 top-2 right-4 bg-slate-900 text-white rounded-lg px-3 py-2 text-xs shadow-lg pointer-events-none flex items-center gap-3">
          <div>
            <div className="text-slate-400 text-[10px] uppercase font-semibold">
              {displayData[hoveredIdx].label}
            </div>
            <div className="text-xs text-amber-300 font-bold mt-0.5">
              Total Susut: {formatPct(displayData[hoveredIdx].totalSusutPct)}
            </div>
          </div>
          <div className="border-l border-slate-700 pl-3 space-y-0.5 text-[11px] text-slate-300">
            <div>Volume: <span className="font-semibold text-white">{formatKg(displayData[hoveredIdx].gldKering)}</span></div>
            <div>Kapasitas: <span className="font-semibold text-emerald-400">{formatPct(displayData[hoveredIdx].kapasitasPct)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
};
