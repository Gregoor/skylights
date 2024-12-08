"use client";

import { TID } from "@atproto/common-web";
import React, { useState } from "react";
import { omit } from "remeda";

import { deleteRecord, putRecord } from "./actions";
import type { RelRecordValue } from "./utils";

const noop = () => {};

type Rels = Partial<Record<string, RelRecordValue>>;

const RelsCtx = React.createContext<{
  rels: Rels;
  setRels: React.Dispatch<React.SetStateAction<Rels>>;
  putRel: (rkey: string, record: RelRecordValue) => void;
  deleteRel: (rkey: string) => void;
}>({ rels: {}, setRels: noop, putRel: noop, deleteRel: noop });

export const getNextTID = (() => {
  let lastTID: string | undefined;
  return () => (lastTID = TID.nextStr(lastTID));
})();

const COLLECTION_REL_KEY = "my.skylights.rel";

export function RelsProvider({
  initialRels = {},
  children,
}: {
  initialRels?: Rels;
  children: React.ReactNode;
}) {
  const [rels, setRels] = useState(initialRels);
  return (
    <RelsCtx.Provider
      value={{
        rels,
        setRels,
        putRel(uri, record) {
          putRecord({
            collection: COLLECTION_REL_KEY,
            rkey: uri.split("/").pop()!,
            record,
          });
          setRels((rels) => ({ ...rels, [uri]: record }));
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

const RelsLoadingCtx = React.createContext<boolean>(false);
export const RelsLoadingProvider = RelsLoadingCtx.Provider;
export const useRelsLoading = () => React.useContext(RelsLoadingCtx);
