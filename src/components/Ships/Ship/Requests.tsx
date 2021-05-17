import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db from "data";
import Dexie from "dexie";
import { DataTable } from "components/DataTable";
import { Box, CircularProgress, Tooltip, makeStyles } from "@material-ui/core";
import { DateTime } from "luxon";

const useStyles = makeStyles(() => ({
  timestamp: {
    display: "inline",
  },
}));

type Props = {
  shipId: string;
};

export const Requests = ({ shipId }: Props) => {
  const classes = useStyles();
  const requests = useLiveQuery(
    () =>
      db.requests
        .where("[shipId+timestamp]")
        .between([shipId, Dexie.minKey], [shipId, Dexie.maxKey])
        .reverse()
        .toArray(),
    [shipId]
  );

  if (!requests) return <CircularProgress color="primary" size={24} />;
  const rows = requests.map((row) => [
    <Box>
      <Tooltip title={row.timestamp}>
        <Box className={classes.timestamp}>
          {DateTime.fromISO(row.timestamp).toRelative()}
        </Box>
      </Tooltip>
      <pre>{row.path}</pre>
      <pre>{JSON.stringify(row.request, null, 2)}</pre>
      <pre>{JSON.stringify(row.response, null, 2)}</pre>
    </Box>,
  ]);

  return <DataTable title="Requests" rows={rows} />;
};
