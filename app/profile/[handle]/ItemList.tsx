"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import useInfiniteScroll from "react-infinite-scroll-hook";
import { mapValues } from "remeda";

import { useRels } from "@/items/ctx";
import { getBasicItemFields, Info } from "@/items/info";
import { ItemCard } from "@/items/ItemCard";
import { Item } from "@/lexicon/types/my/skylights/defs";

import { findItemsWithInfo, RelsOrderBy } from "./actions";
import { PAGE_SIZE } from "./share";

export function ItemList({
  did,
  handle,
  list,
  readonly,
  info: initialInfo,
  orderBy,
}: {
  did: string;
  handle: string;
  list?: string;
  readonly: boolean;
  info: Info;
  orderBy: RelsOrderBy;
}) {
  const { setRels } = useRels();
  const [items, setItems] = useState<Item[]>([]);
  const [info, setInfo] = useState(initialInfo);
  const [hasNextPage, setHasNextPage] = useState(true);

  const pageRef = useRef(-1);
  const [loading, setLoading] = useState(false);
  const loadMore = async () => {
    setLoading(true);
    const newPage = pageRef.current + 1;
    const result = await findItemsWithInfo(did, {
      limit: PAGE_SIZE,
      offset: newPage * PAGE_SIZE,
      list,
      orderBy,
    });
    setHasNextPage(result.items.length >= PAGE_SIZE);
    setLoading(false);
    setRels((rels) => ({
      ...rels,
      ...Object.fromEntries(result.rels.map((r) => [r.key, r.value])),
    }));
    setInfo((info) =>
      mapValues(info, (value, key) => ({ ...value, ...result.info[key] })),
    );
    setItems((items) => [...items, ...result.items]);
    pageRef.current = newPage;
  };

  const [sentryRef] = useInfiniteScroll({
    loading,
    hasNextPage,
    onLoadMore: loadMore,
    rootMargin: "0px 0px 400px 0px",
  });

  return (
    <>
      {items.map((item, i) => {
        const fields = getBasicItemFields(item, info);
        if (!fields) return null;
        return (
          <AnimatePresence key={i}>
            <motion.div
              initial={i < PAGE_SIZE ? undefined : { y: 16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <ItemCard
                key={i}
                info={info}
                item={item}
                profileHandle={handle}
                {...{ readonly }}
              />
            </motion.div>
          </AnimatePresence>
        );
      })}
      {hasNextPage && <div ref={sentryRef}>Loading...</div>}
    </>
  );
}
