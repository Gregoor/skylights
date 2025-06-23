"use client";

import cx from "classix";
import { useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { entries } from "remeda";

import { Item } from "@/lexicon/types/my/skylights/defs";
import { useHasSession } from "@/session-ctx";
import { BUILT_IN_LISTS } from "@/utils";

import { fetchListInclusions, toggleListInclusion } from "./actions";

export function ListButton({ item }: { item: Item }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inclusions, setInclusions] = useState<Set<string> | null>(null);
  useEffect(() => {
    if ((isOpen || isHovered) && inclusions == null) {
      fetchListInclusions(item).then((i) => {
        setInclusions(new Set(i));
      });
    }
  }, [inclusions, isOpen, isHovered, item]);

  const hasSession = useHasSession();
  if (!hasSession) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={cx(
          "border border-white px-1.5 font-bold hover:opacity-100",
          isOpen ? "bg-white text-black !border-white" : "opacity-30",
        )}
        onClick={() => setIsOpen((isOpen) => !isOpen)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        +
      </button>
      {isOpen && (
        <ClickAwayListener
          onClickAway={(event) => {
            event.preventDefault();
            setIsOpen(false);
          }}
        >
          <div className="z-10 absolute top-full right-0 sm:left-0 w-fit bg-black border text-sm">
            {entries(BUILT_IN_LISTS).map(([key, label]) => (
              <label
                key={key}
                className="p-1 flex items-center gap-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  disabled={inclusions === null}
                  checked={inclusions?.has(key) ?? false}
                  onChange={() => {
                    toggleListInclusion(item, key);
                    setInclusions((inclusions) => {
                      if (inclusions === null) return inclusions;
                      const newValue = new Set(inclusions);
                      if (newValue.has(key)) {
                        newValue.delete(key);
                      } else {
                        newValue.add(key);
                      }
                      return newValue;
                    });
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </ClickAwayListener>
      )}
    </div>
  );
}
