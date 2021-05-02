import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  colors,
  animals,
} from "unique-names-generator";

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
