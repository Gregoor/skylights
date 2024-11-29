"use client";

import { useState } from "react";

const Star = ({ full }: { full?: boolean }) => (
  <span style={{ opacity: full ? 1 : 0.1 }}>★</span>
);

export function RatingSlider({
  value,
  readonly,
  onChange,
}: {
  value?: number;
  readonly?: boolean;
  onChange: (value: number) => void;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  return (
    <div className="relative text-2xl" style={{ color: "#fffae5" }}>
      {Array.from({ length: 5 }).map((_, i) => {
        const fullValue = (i + 1) * 2;
        const v = hoverValue ?? value;
        if (typeof v != "number" || v < fullValue - 1) {
          return <Star key={i} />;
        }
        if (v >= fullValue) return <Star key={i} full />;
        return (
          <span key={i} className="relative">
            <Star />
            <span className="absolute left-0 w-1/2 overflow-hidden">★</span>
          </span>
        );
      })}
      <input
        type="range"
        className="absolute left-0 top-0 w-full h-full opacity-0"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        onMouseMove={(event) => {
          if (readonly) return;
          const el = event.target as HTMLElement;
          const { left, width } = el.getBoundingClientRect();
          const x = event.clientX - left;
          setHoverValue(1 + Math.round((9 * x) / width));
        }}
        onMouseLeave={() => setHoverValue(null)}
      />
    </div>
  );
}
