import { LocationWithDistance } from "./Ship/tradeMachine";
import * as api from "../api";
import { FlightPlan } from "../api/FlightPlan";
import { DateTime } from "luxon";

export const testGood = (
  symbol: string,
  pricePerUnit = 1,
  quantityAvailable = 400,
  volumePerUnit = 1
) => ({
  symbol,
  pricePerUnit,
  quantityAvailable,
  volumePerUnit,
});

export const testShip = {
  id: "shipId",
  location: "FROM",
  x: 0,
  y: 0,
  type: "type",
  class: "class",
  maxCargo: 10,
  speed: 1,
  manufacturer: "manufacturer",
  plating: 1,
  weapons: 1,
  spaceAvailable: 10,
  cargo: [],
};
export const testFlightPlan: { flightPlan: api.NewFlightPlan } = {
  flightPlan: {
    arrivesAt: DateTime.now().plus({ seconds: 2 }).toISO(),
    departure: "FROM",
    destination: "TO",
    id: "id",
    ship: "shipId",
    terminatedAt: null,
    fuelConsumed: 2,
    fuelRemaining: 8,
    distance: 4,
    timeRemainingInSeconds: 2,
  },
};
export const fromLocation: LocationWithDistance = {
  symbol: "FROM",
  distance: 0,
  x: 0,
  y: 0,
  type: "type",
  name: "name",
  ships: [],
  anomaly: "AB",
  marketplace: [
    {
      symbol: "GOOD_A",
      pricePerUnit: 10,
      quantityAvailable: 100,
      volumePerUnit: 1,
    },
  ],
};
export const toLocation = {
  ...fromLocation,
  symbol: "TO",
  x: 1,
  marketplace: [],
};
export const testMarketResponse = {
  location: {
    x: 0,
    y: 0,
    symbol: "FROM",
    marketplace: [
      {
        pricePerUnit: 1,
        quantityAvailable: 500,
        symbol: "FUEL",
        volumePerUnit: 1,
      },
    ],
  },
} as api.GetMarketResponse;
