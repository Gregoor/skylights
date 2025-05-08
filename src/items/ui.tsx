import cx from "classix";

export const Badge = ({ type }: { type: string }) => (
  <div
    className={cx(
      "absolute -rotate-45 border-b border-gray-500/50 pt-5 pb-1 px-8",
      "text-white text-xs uppercase font-bold opacity-80",
    )}
    style={{ top: -6, left: -36, background: "#0b1128" }}
  >
    {type}
  </div>
);
