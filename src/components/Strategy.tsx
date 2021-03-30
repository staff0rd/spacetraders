import React from "react";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../machines/playerMachine";
import CircularProgress from "@material-ui/core/CircularProgress";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { ShipStrategy } from "../data/Strategy/ShipStrategy";
import db from "../data";
import { useLiveQuery } from "dexie-react-hooks";
import { ChangePayload } from "../data/Strategy/StrategyPayloads";
import {
  getPlayerStrategy,
  setPlayerStrategy,
} from "../data/Strategy/PlayerStrategy";

type Props = {
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null;
};

export const Strategy = ({ state }: Props) => {
  const [strategy, setStrategy] = React.useState<string>(
    getPlayerStrategy().strategy.toString()
  );

  const strategies = useLiveQuery(() => {
    return db.strategies.toArray();
  });

  if (!state || !state.context.actors.length || !strategies)
    return <CircularProgress size={48} />;
  const handleStrategy = (
    event: React.MouseEvent<HTMLElement>,
    newStrategy: string | null
  ) => {
    if (newStrategy != null) {
      setStrategy(newStrategy);
      setPlayerStrategy(parseInt(newStrategy));
      state.context.actors.forEach((actor) =>
        db.strategies.put({
          shipId: actor.state.context.ship.id,
          strategy: ShipStrategy.Change,
          data: {
            from: strategies.find(
              (p) => p.shipId === actor.state.context.ship.id
            )?.strategy,
            to: parseInt(newStrategy),
          } as ChangePayload,
        })
      );
    }
  };

  const parseStrategy = (shipId: string) => {
    const strat = strategies.find((s) => s.shipId === shipId)?.strategy;
    if (strat === undefined) return "";
    return ShipStrategy[strat];
  };

  return (
    <>
      <ToggleButtonGroup
        value={strategy}
        exclusive
        onChange={handleStrategy}
        aria-label="strategy"
      >
        <ToggleButton value={ShipStrategy.Halt.toString()} aria-label="halt">
          Halt
        </ToggleButton>
        <ToggleButton value={ShipStrategy.Trade.toString()} aria-label="trade">
          Trade
        </ToggleButton>
      </ToggleButtonGroup>
      {state.context.actors.map((ship) => (
        <pre key={ship.id}>
          {ship.state.value} | {parseStrategy(ship.state.context.ship.id)}
        </pre>
      ))}
    </>
  );
};
