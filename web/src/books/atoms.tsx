import { atom } from "jotai";

type Ratings = Record<string, number>;

export const ratingsAtom = atom<Ratings>({});
