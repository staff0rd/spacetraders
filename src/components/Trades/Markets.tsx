import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../../data";
import { DataTable, right } from "../DataTable";
import CircularProgress from "@material-ui/core/CircularProgress";
import { DateTime } from "luxon";
import NumberFormat from "react-number-format";
import { makeStyles, useTheme, useMediaQuery } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { SystemContext } from "machines/MarketContext";
import { getLocationName } from "./getLocations";
import { GoodIcon } from "./GoodIcon";
import { CustomSelect } from "components/CustomSelect";
import { ChartComp as Chart } from "./Chart";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  center: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
}));

type Props = { systems?: SystemContext };

export const Markets = ({ systems }: Props) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [location, setLocation] = useState("");
  const [good, setGood] = useState("");

  const markets = useLiveQuery(() => {
    return db.markets
      .reverse()
      .filter(
        (p) =>
          (location ? p.location === location : true) &&
          (good ? p.good === good : true)
      )
      .limit(50)
      .toArray();
  }, [location, good]);

  const locations = useLiveQuery(() =>
    db.markets.orderBy("location").uniqueKeys()
  );
  const goods = useLiveQuery(() => db.markets.orderBy("good").uniqueKeys());

  if (!markets || !systems)
    return <CircularProgress color="primary" size={24} />;

  const columns = [
    "Location",
    ...(isMdDown ? ["Qty"] : [right("Qty"), "Good"]),
    "㎥",
    right("Buy"),
    right("Sell"),
    right("Spread"),
    "When",
  ];
  const rows = markets.map((market) => [
    getLocationName(systems, market.location),
    ...(isMdDown
      ? [
          <div className={classes.center}>
            <GoodIcon good={market.good} />
            <NumberFormat
              value={market.quantityAvailable}
              thousandSeparator=","
              displayType="text"
            />
          </div>,
        ]
      : [
          right(
            <NumberFormat
              value={market.quantityAvailable}
              thousandSeparator=","
              displayType="text"
            />
          ),
          <GoodIcon good={market.good} />,
        ]),
    market.volumePerUnit,
    right(
      <NumberFormat
        value={market.purchasePricePerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={market.sellPricePerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={market.purchasePricePerUnit - market.sellPricePerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),

    DateTime.fromISO(market.created).toRelative(),
  ]);
  return (
    <>
      {location && <Chart markets={markets} />}
      {locations && (
        <CustomSelect
          name="Location"
          setValue={setLocation}
          value={location}
          values={locations}
          displayMap={(value) => getLocationName(systems, value as string)}
        />
      )}
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
              <MenuItem key={good} value={good}>
                {good}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <DataTable title="Markets" rows={rows} columns={columns} />
    </>
  );
};