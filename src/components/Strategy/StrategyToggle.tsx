import React from "react";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";

type Props = {
  handleStrategy: (
    event: React.MouseEvent<HTMLElement, MouseEvent>,
    value: any
  ) => void;
  strategy: ShipStrategy | undefined;
  size?: "small" | "medium" | "large";
  disabled?: boolean;
};
export const StrategyToggle = ({
  strategy,
  disabled,
  handleStrategy,
  size,
}: Props) => {
  const strats = Object.keys(ShipStrategy).filter((p) => !isNaN(+p));

  return (
    <ToggleButtonGroup
      size={size}
      value={strategy}
      exclusive
      onChange={handleStrategy}
      aria-label="strategy"
    >
      {strats.map((strat, ix) => (
        <ToggleButton
          key={ix}
          value={parseInt(strat)}
          aria-label="halt"
          disabled={disabled || strat === "Change"}
        >
          {ShipStrategy[(strat as unknown) as number]}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
};
