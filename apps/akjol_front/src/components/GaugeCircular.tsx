"use client";

type Props = {
  value: number;
  ci: number;
  basedOn: number;
  size?: number;
  showCaption?: boolean;
};

export function GaugeCircular({ value, ci, basedOn, size = 96, showCaption = true }: Props) {
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  const color =
    value >= 70 ? "#a3cf91" : value >= 40 ? "#f5b86a" : "#ee7768";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#00000010"
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: "stroke-dasharray 400ms ease-out" }}
          />
        </svg>
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <span className="text-2xl font-semibold text-[#1a1d24]">{value}%</span>
          <span className="text-[10px] text-[#1a1d24]/50">± {ci}</span>
        </div>
      </div>
      {showCaption ? (
        <div className="text-[11px] text-[#1a1d24]/60 text-center max-w-[10rem]">
          basé sur {basedOn} dossiers similaires
        </div>
      ) : null}
    </div>
  );
}
