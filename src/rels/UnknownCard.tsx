"use client";

import { Button, Card } from "@/ui";

import { useRels } from "./ctx";
import type { RelRecordValue } from "./utils";

export function UnknownCard({
  uri,
  readonly,
  rel,
}: {
  uri: string;
  readonly: boolean;
  rel?: Omit<RelRecordValue, "$type">;
}) {
  const { deleteRel } = useRels();
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex flex-row gap-2 justify-between">
        <p>Unknown item</p>
        {!readonly && (
          <Button
            className="text-sm"
            intent="danger"
            onClick={() => deleteRel(uri)}
          >
            Delete
          </Button>
        )}
      </div>
      <pre className="border border-gray-800 text-sm font-mono overflow-auto bg-gray-900">
        <code>{JSON.stringify(rel, null, 2)}</code>
      </pre>
    </Card>
  );
}
