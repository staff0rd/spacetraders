export type UserContext = {
  token: string;
  username: string;
};

export type ShipOrdersContext = {
  id: string;
  shouldCheckOrders?: boolean;
};

export type ShipBaseContext = UserContext & ShipContext & ShipOrdersContext;

export type ShipContext = {
  id: string;
};
