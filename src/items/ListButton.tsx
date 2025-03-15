import cx from "classix";
import { useEffect, useState } from "react";
import ClickAwayListener from "react-click-away-listener";
import { entries } from "remeda";

import { Item } from "@/lexicon/types/my/skylights/defs";

import { fetchListInclusions, toggleListInclusion } from "./actions";

const BUILT_INS = {
  todo: "To-Do",
  inProgress: "In Progress",
  abandoned: "Abandoned",
  owned: "Owned",
  wanted: "Want to",
};

export function ListButton({ item }: { item: Item }) {
  return null;
  const [isOpen, setIsOpen] = useState(false);
  const [inclusions, setInclusions] = useState(new Set());
  useEffect(() => {
    if (isOpen) {
      fetchListInclusions(item).then((i) => {
        console.log("fetchListInclusions", i);
        setInclusions(new Set(i));
      });
    }
  }, [isOpen]);
  return (
    <div className="relative">
      <button
        type="button"
        className={cx(
          "border border-gray-400 px-1.5 font-bold hover:border-white",
          isOpen && "bg-white text-black !border-white",
        )}
        onClick={() => setIsOpen((isOpen) => !isOpen)}
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
          <div className="z-10 absolute top-full left-0 w-fit bg-black border text-sm">
            {entries(BUILT_INS).map(([key, label]) => (
              <label
                key={key}
                className="p-1 flex items-center gap-1 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={inclusions.has(key)}
                  onChange={() => {
                    toggleListInclusion(item, key);
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
