import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../../data";
import { DataTable, right } from "../DataTable";
import CircularProgress from "@material-ui/core/CircularProgress";
import { DateTime } from "luxon";
import NumberFormat from "react-number-format";
import { makeStyles, useTheme, useMediaQuery } from "@material-ui/core";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { SystemContext } from "machines/MarketContext";
import { GoodIcon } from "./GoodIcon";
import { CustomSelect } from "components/CustomSelect";
import { ChartComp as Chart } from "./Chart";
import { useLocalStorage } from "components/useLocalStorage";
import { Keys } from "data/localStorage/Keys";
import { getLocation } from "data/localStorage/locationCache";

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
  duration: {
    marginTop: 18,
    marginLeft: theme.spacing(1),
  },
}));

type Props = { systems?: SystemContext };

export const Markets = ({ systems }: Props) => {
  const [duration, setDuration] = useState<number>(30);
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [location, setLocation] = useLocalStorage(Keys.Markets_Location, "");
  const [good, setGood] = useLocalStorage(Keys.Markets_Good, "");

  const markets = useLiveQuery(() => {
    if (location && good)
      return db.markets
        .where("[location+good+created]")
        .between(
          [
            location,
            good,
            DateTime.local().minus({ minutes: duration }).toISO(),
          ],
          [location, good, DateTime.local().toISO()]
        )
        .reverse()
        .limit(200)
        .toArray();
    else if (location) {
      return db.markets
        .where("[location+created]")
        .between(
          [location, DateTime.local().minus({ minutes: duration }).toISO()],
          [location, DateTime.local().toISO()]
        )
        .reverse()
        .limit(200)
        .toArray();
    } else if (good) {
      console.log("you chose good");
      return db.markets
        .where("[good+created]")
        .between(
          [good, DateTime.local().minus({ minutes: duration }).toISO()],
          [good, DateTime.local().toISO()]
        )
        .reverse()
        .limit(200)
        .toArray();
    } else return db.markets.reverse().limit(200).toArray();
  }, [location, good, duration]);

  const locations = useLiveQuery(() =>
    db.markets.orderBy("location").uniqueKeys()
  );
  const goods = useLiveQuery(() => db.markets.orderBy("good").uniqueKeys());

  if (!markets) return <CircularProgress color="primary" size={48} />;

  const columns = [
    "Location",
    ...(isMdDown ? ["Qty"] : [right("Qty"), "Good"]),
    "㎥",
    right("Buy"),
    right("Sell"),
    right("Spread"),
    "When",
  ];
  const rows = markets.slice(0, 50).map((market) => [
    getLocation(market.location)?.name,
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
      {(location || good) && (
        <Chart markets={markets} good={good} location={location} />
      )}
      {locations && (
        <CustomSelect
          name="Location"
          setValue={setLocation}
          value={location}
          values={locations}
          displayMap={(value) => getLocation(value as string)?.name}
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

      <ToggleButtonGroup
        value={duration}
        exclusive
        className={classes.duration}
        onChange={(_: any, v: number | null) => setDuration(v || 30)}
        size="small"
      >
        <ToggleButton value={30}>30m</ToggleButton>
        <ToggleButton value={60}>1h</ToggleButton>
        <ToggleButton value={120}>2h</ToggleButton>
        <ToggleButton value={240}>4h</ToggleButton>
        <ToggleButton value={346}>6h</ToggleButton>
      </ToggleButtonGroup>

      <DataTable title="Markets" rows={rows} columns={columns} />
    </>
  );
};
