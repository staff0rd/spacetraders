import { useState, useEffect } from "react";
import db from "../../data";

import CircularProgress from "@material-ui/core/CircularProgress";
import { DateTime } from "luxon";
import { ITrade, TradeType } from "../../data/ITrade";
import NumberFormat from "react-number-format";

import { makeStyles, Typography } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { CustomSelect } from "../CustomSelect";

import { useLiveQuery } from "dexie-react-hooks";
import { TradesDataTable } from "./TradesDataTable";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 60,
  },
}));

export const TradeList = () => {
  const classes = useStyles();
  const [type, setType] = useState<string | number>("");
  const [good, setGood] = useState("");
  const [shipId, setShipId] = useState("");
  const [trades, setTrades] = useState<ITrade[] | null>(null);

  const ships = useLiveQuery(() => db.shipDetail.orderBy("name").toArray());
  const goods = useLiveQuery(() => db.trades.orderBy("good").uniqueKeys());

  const getIndex = () => {
    if (shipId)
      return db.trades
        .where("shipId")
        .equals(shipId)
        .filter(
          (p) =>
            (good ? p.good === good : p.good !== "FUEL") &&
            (type !== "" ? type === p.type : true)
        );
    else if (good)
      return db.trades
        .where("good")
        .equals(good)
        .filter(
          (p) =>
            (type !== "" ? type === p.type : true) &&
            (shipId !== "" ? shipId === p.shipId : true)
        );
    else if (type)
      return db.trades
        .where("type")
        .equals(type)
        .filter(
          (p) =>
            (good ? p.good === good : p.good !== "FUEL") &&
            (shipId !== "" ? shipId === p.shipId : true)
        );
    else return db.trades;
  };

  useEffect(() => {
    const doWork = async () => {
      const tradeResult = await getIndex().reverse().limit(100).toArray();
      setTrades(tradeResult);
    };
    doWork();
    const interval = setInterval(doWork, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, good, shipId]);

  if (!trades) return <CircularProgress color="primary" size={24} />;

  const profit = trades
    .filter((t) => t.type === TradeType.Sell)
    .map((t) => t.profit || 0)
    .reduce((a, b) => a + b, 0);

  const profitPerMinute = trades.length
    ? Math.round(
        profit /
          -DateTime.fromISO(trades[trades.length - 1].timestamp).diffNow(
            "minutes"
          ).minutes
      )
    : 0;

  return (
    <>
      <FormControl className={classes.formControl}>
        <InputLabel id="select-type-label">Type</InputLabel>
        <Select
          labelId="select-type-label"
          id="select-type"
          value={type}
          onChange={(e) => {
            setTrades(null);
            setType(e.target.value as string | number);
          }}
        >
          <MenuItem value={""}>All</MenuItem>
          <MenuItem value={0}>Buy</MenuItem>
          <MenuItem value={1}>Sell</MenuItem>
        </Select>
      </FormControl>
      {goods && (
        <CustomSelect
          name="Good"
          setValue={(v) => {
            setTrades(null);
            setGood(v);
          }}
          value={good}
          values={goods}
        />
      )}
      {ships && (
        <CustomSelect
          name="Ship"
          setValue={(v) => {
            setTrades(null);
            setShipId(v);
          }}
          value={shipId}
          values={ships}
          displayMap={(s) => s.name}
          valueMap={(s) => s.shipId}
        />
      )}
      <FormControl className={classes.formControl}>
        <Typography className="MuiInputLabel-shrink">Cost</Typography>
        <NumberFormat
          value={trades
            .filter((t) => t.type === TradeType.Sell)
            .map((t) => t.cost)
            .reduce((a, b) => (a || 0) + (b || 0), 0)}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <Typography className="MuiInputLabel-shrink">Profit</Typography>
        <NumberFormat
          value={profit}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <Typography className="MuiInputLabel-shrink">per minute</Typography>
        <NumberFormat
          value={profitPerMinute}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      </FormControl>
      <TradesDataTable
        trades={trades}
        getShipName={(shipId) => ships?.find((s) => s.shipId === shipId)?.name}
      />
    </>
  );
};
