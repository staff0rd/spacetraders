import { DataTable, right } from "components/DataTable";
import db from "data";
import { useLiveQuery } from "dexie-react-hooks";
import CircularProgress from "@material-ui/core/CircularProgress";
import { getShip } from "data/localStorage/shipCache";
import { formatCurrency } from "machines/Ship/formatNumber";
import Dexie from "dexie";
import { makeStyles, Typography } from "@material-ui/core";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  text: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
}));

export const Trades = () => {
  const classes = useStyles();
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
    <Typography className={classes.text}>
      <Link to={`/ships/owned/${row.shipId}`}>{getShip(row.shipId).name}</Link>
    </Typography>,
    right(formatCurrency(row.profit)),
  ]);
  const columns = ["Ship", right("Profit")];
  return <DataTable title="Trades" rows={rows} columns={columns} />;
};
