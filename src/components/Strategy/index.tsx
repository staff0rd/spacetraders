import React from "react";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../../machines/playerMachine";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getPlayerStrategy,
  setPlayerStrategy,
} from "../../data/Strategy/PlayerStrategy";
import { StrategyToggle } from "./StrategyToggle";
import { ChangePayload } from "../../data/Strategy/StrategyPayloads";

const useStyles = makeStyles((theme) => ({
  playerStrategy: {
    marginBottom: theme.spacing(2),
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

  const strategies = useLiveQuery(() => {
    return db.strategies.toArray();
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
      console.log("new strat", newStrategy);
      state!.context.actors.forEach((actor) =>
        db.strategies.put({
          shipId: actor.state.context.id,
          strategy: ShipStrategy.Change,
          data: {
            from: {
              strategy: strategies!.find(
                (p) => p.shipId === actor.state.context.id
              )?.strategy,
            },
            to: { strategy: parseInt(newStrategy) },
          } as ChangePayload,
        })
      );
    }
  };

  const parseStrategy = (shipId: string) => {
    const strat = strategies!.find((s) => s.shipId === shipId)?.strategy;
    if (strat === undefined) return "";
    return ShipStrategy[strat];
  };

  return (
    <>
      <div className={classes.playerStrategy}>
        <StrategyToggle
          strategy={strategy}
          handleStrategy={handlePlayerStrategyChange}
        />
      </div>
      {state.context.actors.map((ship) => (
        <>
          {/* <SingleShipStrategy shipId={ship.id} /> */}
          <pre key={ship.id}>
            {ship.state.value} | {parseStrategy(ship.state.context.id)}
          </pre>
        </>
      ))}
    </>
  );
};
