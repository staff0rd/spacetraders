import { Grid } from "@material-ui/core";
import { AvailableShip } from "../../../api/AvailableShip";
import { AutoBuy } from "./AutoBuy";
import { AutoUpgrade } from "./AutoUpgrade";
import { CircularProgress } from "@material-ui/core";
import { useEffect, useState } from "react";
import {
  getAutomation,
  IAutoUpgrade,
  setAutomation,
} from "../../../data/localStorage/IAutomation";

type Props = {
  availableShips: AvailableShip[];
};

export const Automation = ({ availableShips }: Props) => {
  const { autoUpgrades } = getAutomation();
  const [upgrades, setUpgrades] = useState(autoUpgrades);

  useEffect(() => {
    setAutomation({
      ...getAutomation(),
      autoUpgrades: upgrades,
    });
  }, [upgrades]);

  const addUpgrade = (
    role: string,
    fromShipType: string,
    toShipType: string,
    credits: number,
    maxShips: number
  ) => {
    setUpgrades([
      ...upgrades,
      {
        role,
        fromShipType,
        toShipType,
        credits,
        maxShips,
        on: false,
      },
    ]);
  };

  const removeUpgrade = (index: number) => {
    setUpgrades([
      ...upgrades.filter((_, ix) => ix < index),
      ...upgrades.filter((_, ix) => ix > index),
    ]);
  };

  const updateUpgrade = (upgrade: IAutoUpgrade, index: number) => {
    setUpgrades([
      ...upgrades.filter((_, ix) => ix < index),
      { ...upgrade },
      ...upgrades.filter((_, ix) => ix > index),
    ]);
  };

  if (!availableShips.length)
    return <CircularProgress color="primary" size={24} />;

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <AutoBuy availableShips={availableShips} />
        </Grid>
        {upgrades.map((upgrade, index) => (
          <Grid item xs={12} md={6}>
            <AutoUpgrade
              availableShips={availableShips}
              upgrade={upgrade}
              updateUpgrade={(u) => updateUpgrade(u, index)}
              addUpgrade={addUpgrade}
              removeUpgrade={() => removeUpgrade(index)}
              canDelete={upgrades.length > 1}
              canAdd={index === upgrades.length - 1}
            />
          </Grid>
        ))}
      </Grid>
    </>
  );
};
