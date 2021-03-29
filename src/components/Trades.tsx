import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../data";
import { DataTable, right } from "./DataTable";
import Tooltip from "@material-ui/core/Tooltip";
import CircularProgress from "@material-ui/core/CircularProgress";
import { DateTime } from "luxon";
import { TradeType } from "../data/ITrade";
import NumberFormat from "react-number-format";
import green from "@material-ui/core/colors/green";
import blue from "@material-ui/core/colors/blue";
import { makeStyles } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { fade } from "@material-ui/core/styles/colorManipulator";
import { CustomSelect } from "./CustomSelect";
import BuyIcon from "@material-ui/icons/AddCircle";
import SellIcon from "@material-ui/icons/RemoveCircle";
import clsx from "clsx";

const useStyles = makeStyles((theme) => ({
  buyIcon: {
    color: fade(blue[500], 0.3),
  },
  buy: {
    backgroundColor: fade(blue[500], 0.15),
  },
  sellIcon: {
    color: fade(green[500], 0.3),
  },
  sell: {
    backgroundColor: fade(green[500], 0.15),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

export const Trades = () => {
  const classes = useStyles();
  const [type, setType] = useState<string | number>("");
  const [good, setGood] = useState("");

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
  const columns = [
    "",
    "Location",
    "Qty",
    "Good",
    right("Cost"),
    right("Profit"),
    "When",
  ];
  const rows = trades.map((trade) => [
    trade.type === TradeType.Buy ? (
      <Tooltip title="Buy">
        <BuyIcon className={classes.buyIcon} />
      </Tooltip>
    ) : (
      <Tooltip title="Sell">
        <SellIcon className={classes.sellIcon} />
      </Tooltip>
    ),
    trade.location,
    <NumberFormat
      value={trade.quantity}
      thousandSeparator=","
      displayType="text"
    />,
    trade.good,
    right(
      <NumberFormat
        value={trade.cost}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <>
        {trade.type === TradeType.Buy && (
          <Tooltip title="Estimated">
            <span>*</span>
          </Tooltip>
        )}
        <NumberFormat
          value={trade.profit}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      </>
    ),
    DateTime.fromISO(trade.timestamp).toRelative(),
  ]);

  const rowClassName = (index: number): string =>
    clsx({
      [classes.sell]: trades[index].type === TradeType.Sell,
      [classes.buy]: trades[index].type === TradeType.Buy,
    });

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
        <CustomSelect
          name="Good"
          setValue={setGood}
          value={good}
          values={goods}
        />
      )}
      <DataTable
        title="Locations"
        columns={columns}
        rows={rows}
        rowClassName={rowClassName}
      />
    </>
  );
};
