import React from "react";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import { CustomSelect } from "components/CustomSelect";

type Props = {
  handleStrategy: (value: string) => void;
  strategy: ShipStrategy | undefined;
  size?: "small" | "medium";
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
    <CustomSelect
      disabled={strategy === ShipStrategy.Change}
      size={size}
      name="Strategy"
      setValue={handleStrategy}
      value={strategy?.toString() || ShipStrategy.Trade.toString()}
      values={strats}
      hideAll
      displayMap={(v) => ShipStrategy[Number(v)]}
      disableMap={(v) => v === String(ShipStrategy.Change)}
    />
  );
};
