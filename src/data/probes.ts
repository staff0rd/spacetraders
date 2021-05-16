import db from "./";
import { Location } from "api/Location";

export const init = async (location: Location) => {
  if (
    (await db.probes.where("location").equals(location.symbol).count()) === 0
  ) {
    db.probes.put({
      location: location.symbol,
      x: location.x,
      y: location.y,
      type: location.type,
    });
  }
};
