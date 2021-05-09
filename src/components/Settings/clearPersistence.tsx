import { setCredits } from "data/localStorage/getCredits";
import { setDebug } from "data/localStorage/getDebug";
import { Keys } from "data/localStorage/Keys";
import db from "../../data";

export async function clearPersistence() {
  console.log("Clearing localStorage...");

  for (let item in Keys) {
    if (isNaN(Number(item))) {
      console.log(`Clearing localStorage.${item}`);
    }
  }

  setCredits(0);
  setDebug({ focusShip: undefined });

  console.log("Clearing IndexedDB...");
  await Promise.all(db.tables.map((table) => table.clear()));
  console.log("Everything cleared");
}
