import { Location } from "api/Location";
import { Ship } from "api/Ship";
import { User } from "api/User";
import { System } from "api/System";
import { range } from "lodash";

export const createShip = (): Ship => ({
  id: "my-ship-id",
  location: "OE-PM-TR",
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
});

export const createUser = (user: Partial<User> = {}): User => ({
  ...user,
  username: "username",
  credits: 178875,
  ships: [createShip()],
  loans: [
    {
      id: "ckok4q12z144873615s655uy8ch2",
      due: "2021-05-13T14:28:34.424Z",
      repaymentAmount: 280000,
      status: "CURRENT",
      type: "STARTUP",
    },
  ],
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
  ...location,
  name: "Location 1",
  ships: [],
  symbol: "S1-L1",
  type: "MOON",
  x: 10,
  y: 10,
});
