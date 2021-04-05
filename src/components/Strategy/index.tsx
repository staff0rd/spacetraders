import React from "react";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../../machines/playerMachine";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles, Typography } from "@material-ui/core";
import { DateTime } from "luxon";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getPlayerStrategy,
  setPlayerStrategy,
} from "../../data/Strategy/PlayerStrategy";
import { StrategyToggle } from "./StrategyToggle";
import { getShipName } from "../../data/names";
import { Probes } from "./Probes";
import { persistStrategy } from "./persistStrategy";
import { DataTable } from "../DataTable";
import { FlightPlan } from "../../api/FlightPlan";
import FlightProgress from "../FlightProgress";

const useStyles = makeStyles((theme) => ({
  playerStrategy: {
    marginBottom: theme.spacing(2),
  },
  shipState: {
    display: "inline",
    marginLeft: theme.spacing(2),
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

  const strategies = useLiveQuery(async () => {
    const strats = await db.strategies.toArray();
    const names = await db.shipNames.toArray();
    const shipsWithoutNames = strats.filter(
      (p) => !names.map((n) => n.shipId).includes(p.shipId)
    );
    for (const nameless of shipsWithoutNames) {
      names.push({
        shipId: nameless.shipId,
        name: await getShipName(nameless.shipId),
      });
    }
    return strats.map((s) => ({
      ...s,
      name: names.find((p) => p.shipId === s.shipId)!.name,
    }));
  });

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
          parseInt(newStrategy),
          getStrategy(actor.state.context.id)!
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
      persistStrategy(shipId, parseInt(newStrategy), oldStrategy);
    }
  };

  const getShip = (shipId: string) =>
    strategies!.find((s) => s.shipId === shipId);

  const getStrategy = (shipId: string) => {
    const result = getShip(shipId)?.strategy;
    return result;
  };

  const columns = ["Strategy", "Name", "Type", "State", "Location"];

  const flightPlanToRelative = (flightPlan?: FlightPlan) => {
    if (flightPlan)
      return (
        <>
          <Typography>
            {flightPlan.destination}{" "}
            {DateTime.fromISO(flightPlan.arrivesAt).toRelative()}
          </Typography>
          <FlightProgress flightPlan={flightPlan} />
        </>
      );
  };

  const rows = state.context.actors.map((actor) => [
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
    getShip(actor.state.context.id)!.name,
    actor.state.context.ship?.type,
    actor.state.value,
    actor.state.context.flightPlan
      ? flightPlanToRelative(actor.state.context.flightPlan)
      : actor.state.context.ship?.location,
  ]);

  return (
    <>
      <div className={classes.playerStrategy}>
        <StrategyToggle
          strategy={strategy}
          handleStrategy={handlePlayerStrategyChange}
          disabled={
            strategies.filter((p) => p.strategy === ShipStrategy.Change)
              .length > 0
          }
        />
        <Probes />
      </div>
      <DataTable title="Strategy" columns={columns} rows={rows} />
    </>
  );
};
