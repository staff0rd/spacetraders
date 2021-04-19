import { DateTime } from "luxon";
import { Keys } from "./Keys";
import { IUpgradeShip } from "./IUpgradeShip";

export const getUpgradingShip = () => {
  const upgrade = localStorage.getItem(Keys.ShipUpgrade);
  if (upgrade) {
    const parsed: IUpgradeShip = JSON.parse(upgrade);
    return parsed;
  }
};

export const setUpgradingShip = (fromShipId: string, toShipType: string) => {
  const upgrade: IUpgradeShip = {
    started: DateTime.local().toISO(),
    fromShipId,
    toShipType,
  };
  localStorage.setItem(Keys.ShipUpgrade, JSON.stringify(upgrade));
};

export const clearUpgradingShip = () => {
  const upgrade = getUpgradingShip();
  console.warn(
    `Completing upgrade after starting ${DateTime.fromISO(
      upgrade!.started
    ).toRelative()}`
  );
  localStorage.removeItem(Keys.ShipUpgrade);
};
