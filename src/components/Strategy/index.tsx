import React, { useState } from "react";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../../machines/playerMachine";
import CircularProgress from "@material-ui/core/CircularProgress";
import {
  makeStyles,
  Typography,
  Grid,
  TextField,
  Box,
  FormControl,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { useLiveQuery } from "dexie-react-hooks";
import { Probes } from "./Probes";
import { StrategyChange } from "./StrategyChange";
import { DataTable, right } from "../DataTable";
import FlightProgress from "../Ships/FlightProgress";
import NumberFormat from "react-number-format";
import { Link } from "react-router-dom";

import { ExtendedShip } from "./ExtendedShip";

const useStyles = makeStyles((theme) => ({
  shipState: {
    display: "inline",
    marginLeft: theme.spacing(2),
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  total: {
    marginTop: 22,
  },
  text: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
  probes: {
    textAlign: "end",
  },
  strategy: {
    display: "flex",
  },
  search: {
    display: "flex",
  },
}));

type Props = {
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null;
};

export const Strategy = ({ state }: Props) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));

  const [shipFilter, setShipFilter] = useState("");
  const [shipLimit, setShipLimit] = useState<number | "">("");

  const ships = useLiveQuery(async () => {
    const details = await db.shipDetail.filter((p) => !p.deleted).toArray();
    const strats = await db.strategies.toArray();
    const ships = await db.ships.toArray();
    const flightPlans = await db.flightPlans.toArray();
    return details.map(
      (detail): ExtendedShip => {
        const ship = ships.find((s) => s.id === detail.shipId);
        const strategy =
          ShipStrategy[
            strats.find((s) => detail.shipId === s.shipId)?.strategy ||
              ShipStrategy.Trade
          ];
        const flightPlan = flightPlans.find(
          (fp) => fp.shipId === detail.shipId
        );
        const locationName = ship?.location || "";
        return {
          ...detail,
          ...ship,
          strategy,
          flightPlan,
          locationName,
        } as ExtendedShip;
      }
    );
  });

  const strategies = useLiveQuery(() => db.strategies.toArray());

  if (
    !state ||
    !state.context.actors.length ||
    !strategies ||
    !ships ||
    !state.context.systems
  )
    return <CircularProgress size={48} />;

  const columns = [
    "Strategy",
    ...(isMdDown ? ["Ship"] : ["Name", "Type"]),
    right("Last Profit"),
    "Location",
  ];

  const shipsFiltered = ships.filter(
    (ship) =>
      shipFilter === "" ||
      ship.name.toLowerCase().includes(shipFilter.toLowerCase()) ||
      ship.strategy.toLowerCase().includes(shipFilter.toLowerCase()) ||
      ship.locationName.toLowerCase().includes(shipFilter.toLowerCase()) ||
      ship.type?.toLowerCase().includes(shipFilter.toLowerCase())
  );

  const shipsLimited = shipLimit
    ? shipsFiltered.slice(0, shipLimit)
    : shipsFiltered;

  const rows = shipsLimited.map((ship) => [
    ship.id,
    <div className={classes.strategy}>
      <StrategyChange ship={ship} />
      {ship.strategy}
    </div>,
    ...(isMdDown
      ? [
          <Box>
            <Typography className={classes.text}>
              <Link to={`/ships/owned/${ship.id}`}>{ship.name}</Link>
            </Typography>
            <Typography className={classes.text}>{ship.type}</Typography>
          </Box>,
        ]
      : [
          <Typography className={classes.text}>
            <Link to={`/ships/owned/${ship.id}`}>{ship.name}</Link>
          </Typography>,

          ship.type,
        ]),
    right(
      <NumberFormat
        value={ship.lastProfit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    ship.flightPlan ? (
      <FlightProgress flightPlan={ship.flightPlan} />
    ) : (
      ship.locationName
    ),
  ]);

  const shipWithUndefinedId = ships.find((s) => !s.id);
  if (shipWithUndefinedId) {
    db.shipDetail
      .where("shipId")
      .equals(shipWithUndefinedId.shipId)
      .modify({ deleted: true });
    throw new Error("Found ship with undefinedid");
  }
  return (
    <>
      <Grid container>
        <Grid item xs={6}>
          <div className={classes.search}>
            <FormControl className={classes.formControl}>
              <TextField
                label="Filter"
                value={shipFilter}
                onChange={(e) => setShipFilter(e.target.value)}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <TextField
                type="number"
                label="Limit"
                value={shipLimit}
                onChange={(e) => setShipLimit(Number(e.target.value) || "")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <Typography className={classes.total}>
                {rows.length}
                <StrategyChange ship={shipsLimited} />
              </Typography>
            </FormControl>
          </div>
        </Grid>
        <Grid item xs={6} className={classes.probes}>
          <Probes />
        </Grid>
      </Grid>

      <DataTable
        title="Strategy"
        firstColumnIsRowKey
        columns={columns}
        rows={rows}
      />
    </>
  );
};
