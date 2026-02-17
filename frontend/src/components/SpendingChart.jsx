import React from 'react';

export default function SpendingChart({ data = [], height = 160 }) {
  const width = 600; // viewBox width, SVG will be responsive
  const padding = 32;

  if (!data || data.length === 0) return null;

  const values = data.map((d) => d.value);
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);

  const plotWidth = width - padding * 2;
  const stepX = plotWidth / Math.max(1, data.length - 1);

  const yFor = (v) => {
    const h = height - padding * 1.5;
    const ratio = (v - minVal) / (maxVal - minVal || 1);
    return padding + (1 - ratio) * h;
  };

  const points = data
    .map((d, i) => `${padding + i * stepX},${yFor(d.value)}`)
    .join(' ');

  const gridLines = 4;

  return (
    <div className="mt-6 bg-gray-800 dark:bg-gray-900 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-200">Spending (last 6 months)</div>
        <div className="text-xs text-gray-400">Total ₹{new Intl.NumberFormat('en-IN').format(values.reduce((a, b) => a + b, 0))}</div>
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* grid lines */}
          {Array.from({ length: gridLines + 1 }).map((_, i) => {
            const y = padding + (i * (height - padding * 1.5)) / gridLines;
            return (
              <line
                key={i}
                x1={padding}
                x2={width - padding}
                y1={y}
                y2={y}
                stroke="#374151"
                strokeWidth="0.5"
              />
            );
          })}

          {/* area fill */}
          <polygon
            points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
            fill="rgba(99,102,241,0.12)"
          />

          {/* polyline */}
          <polyline
            fill="none"
            stroke="#6366f1"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points}
          />

          {/* data points */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={padding + i * stepX} cy={yFor(d.value)} r={3.5} fill="#a78bfa" />
            </g>
          ))}

          {/* x labels */}
          {data.map((d, i) => (
            <text
              key={`t-${i}`}
              x={padding + i * stepX}
              y={height - 6}
              fontSize="10"
              fill="#9CA3AF"
              textAnchor="middle"
            >
              {d.label}
            </text>
          ))}
        </svg>
      </div>
    </div>
  );
}
