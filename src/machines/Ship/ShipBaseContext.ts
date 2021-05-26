import { CachedShip } from "data/localStorage/CachedShip";

export type UserContext = {
  token: string;
  username: string;
};

export type ShipOrdersContext = {
  id: string;
  shouldCheckOrders?: boolean;
};

export type ShipBaseContext = UserContext &
  ShipContext &
  ShipOrdersContext & {
    ship: CachedShip;
  };

export type ShipContext = {
  id: string;
};
