import { TrendPoint } from "@/types/steplog";

interface SparklineProps {
  data: TrendPoint[];
  color: string;
  height?: number;
  width?: number | string;
}

export default function Sparkline({ data, color, height = 40, width = 120 }: SparklineProps) {
  const vals = data.map((d) => d.predicted);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const vbW = 300; // fixed viewBox width; SVG stretches via width="100%"
  const effectiveW = typeof width === "string" ? vbW : width;

  const pts = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * effectiveW;
    const y = height - ((v - min) / range) * (height - 6) - 3;
    return `${x},${y}`;
  });

  const pathD = `M ${pts.join(" L ")}`;
  const gradId = `sg-${color.replace(/[^a-z0-9]/gi, "")}`;

  return (
    <svg
      width={typeof width === "string" ? "100%" : width}
      height={height}
      viewBox={`0 0 ${effectiveW} ${height}`}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${pathD} L ${effectiveW},${height} L 0,${height} Z`}
        fill={`url(#${gradId})`}
      />
      <path d={pathD} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}