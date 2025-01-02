"use client";

import cx from "classix";
import { useId, useState } from "react";

const Star = ({
  fill: fill,
  className,
  smol,
}: {
  fill?: boolean | "half";
  className?: string;
  smol?: boolean;
}) => {
  const id = useId();
  const size = smol ? 20 : 28;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 260 245"
      className={className}
      width={size}
      height={size}
    >
      <defs>
        <linearGradient id={"grad" + id}>
          {fill && (
            <stop
              offset={fill == "half" ? "50%" : "100%"}
              stopColor="#fffae5"
            />
          )}
          {fill != true && <stop offset="50%" stopColor="#fffae520" />}
        </linearGradient>
      </defs>
      <path fill={`url(#grad${id})`} d="m56,237 74-228 74,228L10,96h240" />
    </svg>
  );
};

export function RatingSlider({
  value,
  disabled,
  onChange,
  smol,
}: {
  value?: number;
  disabled?: boolean;
  onChange?: (value: number) => void;
  smol?: boolean;
}) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  return (
    <div className="w-fit relative flex flex-row">
      {Array.from({ length: 5 }).map((_, i) => {
        const fullValue = (i + 1) * 2;
        const v = hoverValue ?? value;
        if (typeof v != "number" || v < fullValue - 1) {
          return <Star key={i} smol={smol} />;
        }
        if (v >= fullValue) return <Star key={i} smol={smol} fill />;
        return <Star key={i} smol={smol} fill="half" />;
      })}
      <input
        type="range"
        className={cx(
          "absolute left-0 top-0 w-full h-full opacity-0",
          !disabled && "cursor-pointer",
        )}
        min={1}
        max={10}
        disabled={disabled}
        value={value}
        onChange={(e) => {
          if (hoverValue != null) return;
          onChange?.(Number(e.target.value));
        }}
        onMouseMove={(event) => {
          if (disabled) return;
          const el = event.target as HTMLElement;
          const { left, width } = el.getBoundingClientRect();
          const x = event.clientX - left;
          setHoverValue(1 + Math.round(9 * (x / width)));
        }}
        onMouseLeave={() => setHoverValue(null)}
        onClick={(event) => {
          if (disabled) return;
          event.preventDefault();
          if (typeof hoverValue == "number") {
            onChange?.(hoverValue);
          }
        }}
      />
    </div>
  );
}
