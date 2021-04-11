import { useState, useEffect } from "react";
import db from "../../data";

import CircularProgress from "@material-ui/core/CircularProgress";
import { ITrade } from "../../data/ITrade";

import { makeStyles } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Grid from "@material-ui/core/Grid";
import { CustomSelect } from "../CustomSelect";
import { useLiveQuery } from "dexie-react-hooks";
import { TradesDataTable } from "./TradesDataTable";
import { SystemContext } from "machines/MarketContext";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 60,
  },
}));

type Props = { systems?: SystemContext };

export const TradeList = ({ systems }: Props) => {
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

  return (
    <>
      <Grid container>
        <Grid item xs={12} md={6}>
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
        </Grid>
      </Grid>

      <TradesDataTable
        trades={trades}
        systems={systems}
        getShipName={(shipId) => ships?.find((s) => s.shipId === shipId)?.name}
      />
    </>
  );
};
