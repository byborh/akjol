"use client";

type Props = { current: number; total: number };

export function StepBar({ current, total }: Props) {
  return (
    <div className="flex gap-1.5 w-full">
      {Array.from({ length: total }).map((_, i) => {
        const active = i < current;
        return (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-colors duration-300"
            style={{ background: active ? "#ee7768" : "#1a1d2415" }}
          />
        );
      })}
    </div>
  );
}
