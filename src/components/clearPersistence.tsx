import db from "../data";
import { setPlayerStrategy } from "../data/localStorage/PlayerStrategy";
import { ShipStrategy } from "../data/Strategy/ShipStrategy";

export async function clearPersistence() {
  console.log("Clearing localStorage...");
  localStorage.removeItem("player");
  localStorage.removeItem("locations");
  setPlayerStrategy(ShipStrategy.Trade);
  console.log("Clearing IndexedDB...");
  await Promise.all(db.tables.map((table) => table.clear()));
  console.log("Everything cleared");
}
