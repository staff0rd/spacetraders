import { DateTime } from "luxon";

interface IUpgradeShip {
  fromShipId: string;
  toShipType: string;
  started: string;
}

const key = "ship-upgrade";

export const setUpgradingShip = (fromShipId: string, toShipType: string) => {
  const upgrade: IUpgradeShip = {
    started: DateTime.local().toISO(),
    fromShipId,
    toShipType,
  };
  localStorage.setItem(key, JSON.stringify(upgrade));
};

export const getUpgradingShip = () => {
  const upgrade = localStorage.getItem(key);
  if (upgrade) {
    const parsed: IUpgradeShip = JSON.parse(upgrade);
    return parsed;
  }
};

export const clearUpgradingShip = () => {
  const upgrade = getUpgradingShip();
  console.warn(
    `Completing upgrade after starting ${DateTime.fromISO(
      upgrade!.started
    ).toRelative()}`
  );
  localStorage.removeItem(key);
};
