"use client";

import cx from "classix";
import Image from "next/image";
import { useId, useState } from "react";

import swipeImg from "./swipe.png";

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
  value: number | null;
  disabled?: boolean;
  onChange?: (value: number | null) => void;
  smol?: boolean;
}) {
  const [swiping, setSwiping] = useState(false);
  const [isInDeleteZone, setIsInDeleteZone] = useState(false);
  const [tempValue, setTempValue] = useState<number | null>(null);

  const getValueFromClientX = (el: HTMLElement, clientX: number) => {
    const { left, width } = el.getBoundingClientRect();
    const x = clientX - left;
    return 1 + Math.round(9 * (x / width));
  };

  const updateTemp = (...params: Parameters<typeof getValueFromClientX>) => {
    setTempValue(getValueFromClientX(...params));
  };

  const stopSwipe = () => {
    setSwiping(false);
    setTempValue(null);
    setIsInDeleteZone(false);
    if (isInDeleteZone) {
      onChange?.(null);
    } else if (typeof tempValue == "number") {
      onChange?.(tempValue);
    }
  };

  return (
    <div className="w-fit relative">
      {!smol && value == null && tempValue == null && (
        <div className="absolute left-0 right-0 top-1 w-full text-center opacity-80">
          not yet rated
        </div>
      )}
      <div
        className={cx(
          "transition-opacity pointer-events-none",
          "absolute left-0 right-0 top-2",
        )}
      >
        <Image
          className={cx(
            "mx-auto invert bg-gray-200/40 rounded-xl",
            swiping ? "opacity-60" : "opacity-0",
          )}
          src={swipeImg}
          alt="swipe"
          width={60}
        />
        <div
          className={cx(
            "mt-2 p-0.5 border border-red-500 rounded text-center text-sm bg-gray-800/70",
            swiping ? "opacity-100" : "opacity-0",
            isInDeleteZone && "bg-red-500",
          )}
        >
          swipe down to unrate
        </div>
      </div>
      <div
        className={cx(
          "flex flex-row transition-all duration-75",
          swiping && "-translate-y-6 bg-gray-800/40 rounded-xl",
        )}
      >
        {Array.from({ length: 5 }).map((_, i) => {
          const fullValue = (i + 1) * 2;
          const v = tempValue ?? value;
          if (typeof v != "number" || v < fullValue - 1) {
            return <Star key={i} smol={smol} />;
          }
          if (v >= fullValue) return <Star key={i} smol={smol} fill />;
          return <Star key={i} smol={smol} fill="half" />;
        })}
      </div>
      <input
        type="range"
        className={cx(
          "absolute left-0 top-0 w-full h-full opacity-0",
          !disabled && "cursor-pointer",
        )}
        min={1}
        max={10}
        disabled={disabled}
        value={value ?? 0}
        onChange={(e) => {
          if (tempValue != null || swiping) return;
          onChange?.(Number(e.target.value));
        }}
        onMouseMove={(event) => {
          if (disabled) return;
          updateTemp(event.target as HTMLElement, event.clientX);
        }}
        onMouseLeave={() => setTempValue(null)}
        onClick={(event) => {
          if (disabled) return;
          event.preventDefault();
          if (typeof tempValue == "number") {
            onChange?.(tempValue == value ? null : tempValue);
          }
        }}
        onTouchMove={(event) => {
          if (disabled) return;
          event.preventDefault();
          const el = event.target as HTMLElement;
          const touch = event.touches[0];

          const { top } = el.getBoundingClientRect();
          const y = touch.clientY - top;
          setIsInDeleteZone(y > 80);
          setSwiping(true);
          updateTemp(el, touch.clientX);
        }}
        onTouchEnd={stopSwipe}
        onTouchCancel={stopSwipe}
      />
    </div>
  );
}
