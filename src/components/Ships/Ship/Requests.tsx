import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db from "data";
import Dexie from "dexie";
import { DataTable } from "components/DataTable";
import { Box, CircularProgress } from "@material-ui/core";
import { DateTime } from "luxon";

type Props = {
  shipId: string;
};

export const Requests = ({ shipId }: Props) => {
  const requests = useLiveQuery(
    () =>
      db.requests
        .where("[shipId+id]")
        .between([shipId, Dexie.minKey], [shipId, Dexie.maxKey])
        .reverse()
        .toArray(),
    [shipId]
  );

  if (!requests) return <CircularProgress color="primary" size={24} />;
  const rows = requests.map((row) => [
    <Box>
      <Box>{DateTime.fromISO(row.timestamp).toRelative()}</Box>
      <pre>{row.path}</pre>
      <pre>{JSON.stringify(row.request, null, 2)}</pre>
      <pre>{JSON.stringify(row.response, null, 2)}</pre>
    </Box>,
  ]);

  return <DataTable title="Requests" rows={rows} />;
};
