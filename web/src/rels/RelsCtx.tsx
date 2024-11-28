"use client";

import { TID } from "@atproto/common-web";
import React, { useState } from "react";
import { omit } from "remeda";

import { deleteRecord, putRecord } from "./actions";
import type { RelRecordValue } from "./utils";

const noop = () => {};

type Rels = Record<string, RelRecordValue>;

const RelsCtx = React.createContext<{
  rels: Rels;
  putRel: (rkey: string, record: RelRecordValue) => void;
  deleteRel: (rkey: string) => void;
}>({ rels: {}, putRel: noop, deleteRel: noop });

export const getNextTID = (() => {
  let lastTID: string | undefined;
  return () => (lastTID = TID.nextStr(lastTID));
})();

const COLLECTION_REL_KEY = "my.skylights.rel";

export function RelsProvider({
  initialRels,
  children,
}: {
  initialRels: Rels;
  children: React.ReactNode;
}) {
  const [rels, setRels] = useState(initialRels);
  return (
    <RelsCtx.Provider
      value={{
        rels,
        putRel(rkey, record) {
          putRecord({ collection: COLLECTION_REL_KEY, rkey, record });
          setRels((rels) => ({ ...rels, [rkey]: record }));
        },
        deleteRel(uri) {
          deleteRecord({
            collection: COLLECTION_REL_KEY,
            rkey: uri.split("/").pop()!,
          });
          setRels((rels) => omit(rels, [uri]));
        },
      }}
    >
      {children}
    </RelsCtx.Provider>
  );
}

export const useRels = () => React.useContext(RelsCtx);
