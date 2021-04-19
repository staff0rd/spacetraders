import * as api from "../../api";
import { Keys } from "./Keys";

export const setAvailableStructures = (
  response: api.GetAvailableStructuresResponse
) => {
  localStorage.setItem(Keys.AvailableStructures, JSON.stringify(response));
};

export const getAvailableStructures = () => {
  const response = localStorage.getItem(Keys.AvailableStructures);
  if (response) {
    const parsed: api.GetAvailableStructuresResponse = JSON.parse(response);
    return parsed.structures;
  }
};
