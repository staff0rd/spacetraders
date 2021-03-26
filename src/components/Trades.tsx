import { useState } from "react";
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
import CircularProgress from "@material-ui/core/CircularProgress";
import { DateTime } from "luxon";
import { TradeType } from "../data/ITrade";
import NumberFormat from "react-number-format";
import green from "@material-ui/core/colors/green";
import blue from "@material-ui/core/colors/blue";
import clsx from "clsx";
import { makeStyles } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

const useStyles = makeStyles((theme) => ({
  buy: {
    backgroundColor: blue[50],
  },
  sell: {
    backgroundColor: green[50],
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

export const Trades = () => {
  const classes = useStyles();
  const [good, setGood] = useState("");
  const [type, setType] = useState<string | number>("");

  const trades = useLiveQuery(() => {
    return db.trades
      .reverse()
      .filter(
        (p) =>
          (good ? p.good === good : p.good !== "FUEL") &&
          (type !== "" ? type === p.type : true)
      )
      .limit(50)
      .toArray();
  }, [good, type]);

  const goods = useLiveQuery(() => db.trades.orderBy("good").uniqueKeys());

  if (!trades) return <CircularProgress color="primary" size={24} />;

  return (
    <>
      <FormControl className={classes.formControl}>
        <InputLabel id="select-type-label">Type</InputLabel>
        <Select
          labelId="select-type-label"
          id="select-type"
          value={type}
          onChange={(e) => setType(e.target.value as string | number)}
        >
          <MenuItem value={""}>All</MenuItem>
          <MenuItem value={0}>Buy</MenuItem>
          <MenuItem value={1}>Sell</MenuItem>
        </Select>
      </FormControl>
      {goods && (
        <FormControl className={classes.formControl}>
          <InputLabel id="select-good-label">Good</InputLabel>
          <Select
            labelId="select-good-label"
            id="select-good"
            value={good}
            placeholder="All"
            onChange={(e) => setGood(e.target.value as string)}
          >
            <MenuItem value={""}>All</MenuItem>
            {goods!.map((good: any) => (
              <MenuItem value={good}>{good}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
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
    </>
  );
};
