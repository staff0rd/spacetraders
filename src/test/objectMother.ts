import { Location } from "api/Location";
import { User } from "api/User";
import { System } from "api/System";
import { range } from "lodash";
import { CachedShip } from "data/localStorage/CachedShip";
import { DateTime } from "luxon";
import { IShipOrder, ShipOrders, ShipOrderStatus } from "data/IShipOrder";
import { TradeRoute } from "machines/Ship/TradeRoute";

export const createOrder = (
  shipOrder: Partial<IShipOrder> = {}
): IShipOrder => ({
  createdAt: DateTime.local().toISO(),
  createdReason: "test reason",
  status: ShipOrderStatus.Pending,
  shipId: "my-ship-id",
  order: ShipOrders.Trade,
  ...shipOrder,
});

export const createTradeRoute = (
  tradeRoute: Partial<TradeRoute> = {}
): TradeRoute => ({
  buyLocation: "A",
  sellLocation: "B",
  costVolumeDistance: 1,
  distance: 10,
  fuelCost: 10,
  fuelNeeded: 10,
  good: "GOOD",
  profitPerUnit: 10,
  purchasePricePerUnit: 1,
  sellPricePerUnit: 11,
  quantityAvailable: 1000,
  quantityToBuy: 40,
  totalProfit: 400,
  volume: 40,
  rank: 1,
  ...tradeRoute,
});

export const createShip = (ship: Partial<CachedShip> = {}): CachedShip => ({
  id: "my-ship-id",
  location: createLocation(),
  x: 21,
  y: -24,
  cargo: [],
  spaceAvailable: 50,
  type: "JW-MK-I",
  class: "MK-I",
  maxCargo: 50,
  speed: 1,
  manufacturer: "Jackshaw",
  plating: 5,
  weapons: 5,
  name: "My ship name",
  orders: [createOrder()],
  ...ship,
});

const cachedShipToShip = (ship: CachedShip) => {
  return {
    ...ship,
    location: ship.location?.symbol,
  };
};

export const createUser = (user: Partial<User> = {}): User => ({
  username: "username",
  credits: 178875,
  ships: [cachedShipToShip(createShip())],
  loans: [
    {
      id: "ckok4q12z144873615s655uy8ch2",
      due: "2021-05-13T14:28:34.424Z",
      repaymentAmount: 280000,
      status: "CURRENT",
      type: "STARTUP",
    },
  ],
  ...user,
});

export const createSystem = (system: Partial<System> = {}): System => ({
  name: "System 1",
  symbol: "S1",
  locations: range(1, 3).map((ix) =>
    createLocation({
      name: `Location ${ix}`,
      x: ix * 10,
      y: ix * 10,
      symbol: `S1-L${ix}`,
    })
  ),
});

export const createLocation = (location: Partial<Location> = {}): Location => ({
  name: "Location 1",
  ships: [],
  symbol: "S1-L1",
  type: "MOON",
  x: 10,
  y: 10,
  marketplace: [
    {
      symbol: "A",
      quantityAvailable: 100,
      sellPricePerUnit: 20,
      purchasePricePerUnit: 25,
      volumePerUnit: 1,
    },
  ],
  ...location,
});
