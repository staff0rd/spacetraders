import { DataTable, right } from "components/DataTable";
import db from "data";
import { useLiveQuery } from "dexie-react-hooks";
import CircularProgress from "@material-ui/core/CircularProgress";
import { getShip } from "data/localStorage/shipCache";
import { formatCurrency } from "machines/Ship/formatNumber";
import Dexie from "dexie";

export const Trades = () => {
  const trades = useLiveQuery(() => {
    return db.tradeData
      .where("[updated+complete]")
      .between([Dexie.minKey, 1], [Dexie.maxKey, 1])
      .reverse()
      .limit(50)
      .toArray();
  });

  if (!trades) return <CircularProgress color="primary" size={48} />;

  const rows = trades.map((row) => [
    getShip(row.shipId).name,
    right(formatCurrency(row.profit)),
  ]);
  const columns = ["Ship", right("Profit")];
  return <DataTable title="Trades" rows={rows} columns={columns} />;
};
