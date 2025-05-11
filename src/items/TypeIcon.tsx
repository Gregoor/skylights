import { BookOpenText, Film, TvMinimalPlay } from "lucide-react";
import React from "react";

const TYPE_ICONS = {
  film: Film,
  show: TvMinimalPlay,
  book: BookOpenText,
};

export const TypeIcon = ({ value }: { value: string }) => {
  const Comp = TYPE_ICONS[value as keyof typeof TYPE_ICONS];
  if (!Comp) return null;
  return <div title={value}>{React.createElement(Comp, { size: 16 })}</div>;
};
