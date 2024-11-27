import { TID } from "@atproto/common-web";
import { atom } from "jotai";
import { atomEffect } from "jotai-effect";
import { withHistory } from "jotai-history";
import { isDeepEqual, keys, omitBy } from "remeda";

import { Record as RelRecord } from "@/lexicon/types/my/skylights/rel";
import { delRel, putRel } from "./actions";

class Repo<T> {
  private prevTID?: string;
  private records: Partial<Record<string, T>> = {};

  constructor(
    private putRemote: (tid: string, data: T) => void,
    private deleteRel: (tid: string) => void,
  ) {}

  create(data: T) {
    this.prevTID = TID.nextStr(this.prevTID);
    this.records = { ...this.records, [this.prevTID]: data };
    this.putRemote(this.prevTID, data);
  }

  put(tid: string, data: T) {
    this.records[tid] = data;
    this.putRemote(tid, data);
  }

  delete(tid: string) {
    delete this.records[tid];
    this.deleteRel(tid);
  }
}

const relsRepo = new Repo<RelRecord>(putRel, delRel);

export const relsAtom = atom<Partial<Record<string, RelRecord>>>({});

const relsHistoryAtom = withHistory(relsAtom, 2);
export const syncRelsEffect = atomEffect((get) => {
  const [rels, prevRels] = get(relsHistoryAtom);
  const changedRels = omitBy(rels, (rel, id) =>
    isDeepEqual(rel, prevRels?.[id]),
  );
  const deletedRels = keys(prevRels ?? {}).filter((id) => !rels[id]);
  console.log(changedRels);
  syncRels(changedRels, deletedRels);
});
