import { DateTime } from "luxon";
import { IIntel } from "../../data/IIntel";
import { Collection } from "dexie";

export function filterToIntelWindow(collection: Collection<IIntel, string>) {
  const window = DateTime.now().minus({ hours: 1 }).toISO();
  return collection.filter((p) => p.lastSeen > window).toArray();
}
