import React from "react";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";

type Props = {
  handleStrategy: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    value: any
  ) => void;
  strategy: ShipStrategy;
};
export const StrategyToggle = ({ strategy, handleStrategy }: Props) => {
  const strats = Object.keys(ShipStrategy)
    .filter((p) => !isNaN(+p))
    .filter((p) => ShipStrategy[(p as unknown) as number] !== "Change");

  console.log(
    strats.map((s) => ({ a: ShipStrategy[(s as unknown) as number], b: s }))
  );
  return (
    <ToggleButtonGroup
      value={strategy}
      exclusive
      onChange={handleStrategy}
      aria-label="strategy"
    >
      {strats.map((strat) => (
        <ToggleButton value={parseInt(strat)} aria-label="halt">
          {ShipStrategy[(strat as unknown) as number]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
