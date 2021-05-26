import { useLiveQuery } from "dexie-react-hooks";
import db from "data";
import Dexie from "dexie";
import { DataTable } from "components/DataTable";
import { CircularProgress } from "@material-ui/core";
import { DateTime } from "luxon";

type Props = {
  shipId: string;
};

export const Orders = ({ shipId }: Props) => {
  const orders = useLiveQuery(
    () =>
      db.shipOrders
        .where("[shipId+createdAt]")
        .between([shipId, Dexie.minKey], [shipId, Dexie.maxKey])
        .reverse()
        .toArray(),
    [shipId]
  );

  if (!orders) return <CircularProgress color="primary" size={24} />;
  const rows = orders.map((row) => [
    DateTime.fromISO(row.createdAt).toRelative(),
    row.order,
    row.createdReason,
    row.completedAt ? DateTime.fromISO(row.completedAt).toRelative() : "",
    <pre>{JSON.stringify(row.payload, null, 2)}</pre>,
  ]);

  const columns = ["Created", "Order", "Reason", "Completed", "Data"];

  return <DataTable title="Requests" rows={rows} columns={columns} />;
};
