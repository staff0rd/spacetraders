import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";
import db from "./";

export const newPlayerName: () => string = () => {
  const nameConfig: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: "-",
    length: 3,
  };

  return `${uniqueNamesGenerator(nameConfig)}-§`;
};

export const newShipName: () => string = () => {
  const nameConfig: Config = {
    dictionaries: [[adjectives, colors][Math.round(Math.random())], animals],
    separator: " ",
    style: "capital",
    length: 2,
  };
  return `${uniqueNamesGenerator(nameConfig)}`;
};

export const getShipName = async (shipId: string): Promise<string> => {
  const name = await db.shipNames.get(shipId);
  if (!name) {
    const newName = newShipName();
    db.shipNames.put({ shipId, name: newName });
    return newName;
  }
  return name.name;
};
