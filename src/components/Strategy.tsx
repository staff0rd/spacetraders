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
import { ShipStrategy } from "../data/ShipStrategy";
import db from "../data";

type Props = {
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null;
};

export const Strategy = ({ state }: Props) => {
  const [strategy, setStrategy] = React.useState<string>("0");

  if (!state || !state.context.ships.length)
    return <CircularProgress size={48} />;
  const handleStrategy = (
    event: React.MouseEvent<HTMLElement>,
    newStrategy: string | null
  ) => {
    if (newStrategy != null) {
      setStrategy(newStrategy);
      state.context.ships.forEach((actor) =>
        db.strategies.put({
          shipId: actor.state.context.ship.id,
          strategy: parseInt(newStrategy),
        })
      );
    }
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
      {state.context.ships.map((ship) => (
        <pre>{ship.state.value}</pre>
      ))}
    </>
  );
};
