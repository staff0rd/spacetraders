import { setCredits } from "data/localStorage/getCredits";
import { setDebug } from "data/localStorage/getDebug";
import db from "../../data";

export async function clearPersistence() {
  console.log("Clearing localStorage...");
  // TODO: Enumerate localStorage/Keys
  localStorage.removeItem("player");
  localStorage.removeItem("locations");

  setCredits(0);
  setDebug({ focusShip: undefined });

  console.log("Clearing IndexedDB...");
  await Promise.all(db.tables.map((table) => table.clear()));
  console.log("Everything cleared");
}
