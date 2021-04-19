import { setCredits } from "data/localStorage/getCredits";
import { setDebug } from "data/localStorage/IDebug";
import db from "../../data";
import { setPlayerStrategy } from "../../data/localStorage/PlayerStrategy";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";

export async function clearPersistence() {
  console.log("Clearing localStorage...");
  localStorage.removeItem("player");
  localStorage.removeItem("locations");

  setCredits(0);
  setPlayerStrategy(ShipStrategy.Trade);
  setDebug({ focusShip: undefined });

  console.log("Clearing IndexedDB...");
  await Promise.all(db.tables.map((table) => table.clear()));
  console.log("Everything cleared");
}
