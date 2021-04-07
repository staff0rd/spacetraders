import React from "react";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../../machines/playerMachine";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles, Typography, Grid, Tooltip } from "@material-ui/core";
import { DateTime } from "luxon";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getPlayerStrategy,
  setPlayerStrategy,
} from "../../data/Strategy/PlayerStrategy";
import { StrategyToggle } from "./StrategyToggle";
import { Probes } from "./Probes";
import { persistStrategy } from "./persistStrategy";
import { DataTable, right } from "../DataTable";
import { FlightPlan } from "../../api/FlightPlan";
import FlightProgress from "../Ships/FlightProgress";
import NumberFormat from "react-number-format";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  playerStrategy: {
    marginBottom: theme.spacing(2),
  },
  shipState: {
    display: "inline",
    marginLeft: theme.spacing(2),
  },
  flightPlanText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
}));

type Props = {
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null;
};

export const Strategy = ({ state }: Props) => {
  const classes = useStyles();
  const [strategy, setStrategy] = React.useState<ShipStrategy>(
    getPlayerStrategy().strategy
  );

  const shipDetail = useLiveQuery(() => db.shipDetail.toArray());

  const strategies = useLiveQuery(() => db.strategies.toArray());

  if (!state || !state.context.actors.length || !strategies)
    return <CircularProgress size={48} />;

  const handlePlayerStrategyChange = (
    event: React.MouseEvent<HTMLElement>,
    newStrategy: string
  ) => {
    if (newStrategy != null) {
      setStrategy(parseInt(newStrategy));
      setPlayerStrategy(parseInt(newStrategy));
      state!.context.actors.forEach((actor) =>
        persistStrategy(
          actor.state.context.id,
          getStrategy(actor.state.context.id)!,
          parseInt(newStrategy)
        )
      );
    }
  };
  const handleShipStrategyChange = (
    shipId: string,
    newStrategy: string,
    oldStrategy: ShipStrategy
  ) => {
    if (newStrategy != null) {
      persistStrategy(shipId, oldStrategy, parseInt(newStrategy));
    }
  };

  const getStrategy = (shipId: string) => {
    const result = strategies!.find((s) => s.shipId === shipId)?.strategy;
    return result;
  };

  const flightPlanToRelative = (flightPlan?: FlightPlan) => {
    if (flightPlan)
      return (
        <>
          <Typography className={classes.flightPlanText}>
            {flightPlan.destination}{" "}
            {DateTime.fromISO(flightPlan.arrivesAt).toRelative()}
          </Typography>
          <FlightProgress flightPlan={flightPlan} />
        </>
      );
  };

  const getLastProfitCreated = (shipId: string) => {
    const created = shipDetail?.find((sd) => sd.shipId === shipId)
      ?.lastProfitCreated;
    if (created) return DateTime.fromISO(created).toRelative()!;
    return "";
  };

  const columns = [
    "Strategy",
    "Name",
    "Type",
    "State",
    right("Last Profit"),
    "Location",
  ];

  const rows = state.context.actors
    .sort((a, b) =>
      (
        shipDetail?.find((sd) => sd.shipId === b.state.context.id)
          ?.lastProfitCreated || ""
      ).localeCompare(
        shipDetail?.find((sd) => sd.shipId === a.state.context.id)
          ?.lastProfitCreated || ""
      )
    )
    .map((actor) => [
      <StrategyToggle
        disabled={getStrategy(actor.state.context.id) === ShipStrategy.Change}
        strategy={getStrategy(actor.state.context.id)}
        handleStrategy={(_, value) =>
          handleShipStrategyChange(
            actor.state.context.id,
            value,
            getStrategy(actor.state.context.id)!
          )
        }
        size="small"
      />,
      <Typography className={classes.link}>
        <Link to={`/ships/owned/${actor.state.context.id}`}>
          {shipDetail?.find((sd) => sd.shipId === actor.state.context.id)?.name}
        </Link>
      </Typography>,
      actor.state.context.ship?.type,
      actor.state.value,
      right(
        <Tooltip title={getLastProfitCreated(actor.state.context.id)}>
          <NumberFormat
            value={
              shipDetail?.find((sd) => sd.shipId === actor.state.context.id)
                ?.lastProfit
            }
            thousandSeparator=","
            displayType="text"
            prefix="$"
          />
        </Tooltip>
      ),
      actor.state.context.flightPlan
        ? flightPlanToRelative(actor.state.context.flightPlan)
        : actor.state.context.ship?.location,
      actor.state.context.id,
    ]);

  return (
    <>
      <Grid container className={classes.playerStrategy}>
        <Grid item xs={6}>
          <StrategyToggle
            strategy={strategy}
            handleStrategy={handlePlayerStrategyChange}
            disabled={
              strategies.filter((p) => p.strategy === ShipStrategy.Change)
                .length > 0
            }
          />
        </Grid>
        <Grid item xs={6}>
          <Probes />
        </Grid>
      </Grid>

      <DataTable
        title="Strategy"
        lastColumnIsRowKey
        columns={columns}
        rows={rows}
      />
    </>
  );
};
