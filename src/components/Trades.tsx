import { useLiveQuery } from "dexie-react-hooks";
import db from "../data";
import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Tooltip from "@material-ui/core/Tooltip";
import Paper from "@material-ui/core/Paper";
import { DateTime } from "luxon";
import { TradeType } from "../data/ITrade";
import NumberFormat from "react-number-format";
import green from "@material-ui/core/colors/green";
import blue from "@material-ui/core/colors/blue";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  buy: {
    backgroundColor: blue[100],
  },
  sell: {
    backgroundColor: green[100],
  },
}));

export const Trades = () => {
  const classes = useStyles();
  const trades = useLiveQuery(() =>
    db.trades
      .reverse()
      .filter((p) => p.good !== "FUEL")
      .limit(20)
      .toArray()
  );

  if (!trades) return null; // Still loading.

  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label="Trades">
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell align="right">Location</TableCell>
            <TableCell align="right">Qty</TableCell>
            <TableCell align="right">Good</TableCell>
            <TableCell align="right">Cost</TableCell>
            <TableCell align="right">Profit</TableCell>
            <TableCell align="right">When</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {trades.map((trade) => (
            <TableRow
              className={clsx({
                [classes.sell]: trade.type === TradeType.Sell,
                [classes.buy]: trade.type === TradeType.Buy,
              })}
              key={trade.id}
            >
              <TableCell component="th" scope="row">
                {trade.type === TradeType.Buy ? "BUY" : "SELL"}
              </TableCell>
              <TableCell align="right">{trade.location}</TableCell>
              <TableCell align="right">
                <NumberFormat
                  value={trade.quantity}
                  thousandSeparator=","
                  displayType="text"
                />
              </TableCell>
              <TableCell align="right">{trade.good}</TableCell>
              <TableCell align="right">
                <NumberFormat
                  value={trade.cost}
                  thousandSeparator=","
                  displayType="text"
                  prefix="$"
                />
              </TableCell>
              <TableCell align="right">
                <NumberFormat
                  value={trade.profit}
                  thousandSeparator=","
                  displayType="text"
                  prefix="$"
                />
                {trade.type === TradeType.Buy && (
                  <Tooltip title="Estimated">
                    <span>*</span>
                  </Tooltip>
                )}
              </TableCell>
              <TableCell align="right">
                {DateTime.fromISO(trade.timestamp).toRelative()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
