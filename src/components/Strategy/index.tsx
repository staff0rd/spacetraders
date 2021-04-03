import React from "react";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../../machines/playerMachine";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core";
import { Grid, Typography } from "@material-ui/core";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getPlayerStrategy,
  setPlayerStrategy,
} from "../../data/Strategy/PlayerStrategy";
import { StrategyToggle } from "./StrategyToggle";
import { ChangePayload } from "../../data/Strategy/StrategyPayloads";
import { getShipName } from "../../data/names";

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
    const names = await db.ships.toArray();
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

  const persistStrategy = (shipId: string, newStrategy: ShipStrategy) => {
    console.log("setting strategy", JSON.stringify(newStrategy));
    db.strategies.put({
      shipId,
      strategy: ShipStrategy.Change,
      data: {
        from: {
          strategy: getStrategy(shipId),
        },
        to: { strategy: newStrategy },
      } as ChangePayload,
    });
  };

  const handlePlayerStrategyChange = (
    event: React.MouseEvent<HTMLElement>,
    newStrategy: string
  ) => {
    if (newStrategy != null) {
      setStrategy(parseInt(newStrategy));
      setPlayerStrategy(parseInt(newStrategy));
      console.log("new strat", JSON.stringify(newStrategy));
      state!.context.actors.forEach((actor) =>
        persistStrategy(actor.state.context.id, parseInt(newStrategy))
      );
    }
  };
  const handleShipStrategyChange = (shipId: string, newStrategy: string) => {
    if (newStrategy != null) {
      persistStrategy(shipId, parseInt(newStrategy));
    }
  };

  const getShip = (shipId: string) =>
    strategies!.find((s) => s.shipId === shipId);

  const getStrategy = (shipId: string) => {
    const result = getShip(shipId)?.strategy;
    return result;
  };

  const getStrategyLabel = (shipId: string) => {
    const strat = getStrategy(shipId);
    if (strat === undefined) return "";
    return ShipStrategy[strat];
  };

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
      </div>
      <Grid container spacing={1}>
        {state.context.actors
          .sort(
            (a, b) =>
              a?.state?.context?.ship?.id.localeCompare(
                b?.state?.context?.ship?.id || ""
              ) || 0
          )
          .map((actor) => (
            <Grid item key={actor.id} xs={12}>
              <StrategyToggle
                disabled={
                  getStrategy(actor.state.context.id) === ShipStrategy.Change
                }
                strategy={getStrategy(actor.state.context.id)}
                handleStrategy={(_, value) =>
                  handleShipStrategyChange(actor.state.context.id, value)
                }
                size="small"
              />

              <Typography className={classes.shipState}>
                {getShip(actor.state.context.id)!.name} |{" "}
                {actor.state.context.ship?.type} | {actor.state.value}
              </Typography>
            </Grid>
          ))}
      </Grid>
    </>
  );
};
