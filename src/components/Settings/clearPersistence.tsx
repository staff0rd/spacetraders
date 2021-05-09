import { setResetting } from "data/localStorage/getResetting";
import { Keys } from "data/localStorage/Keys";
import { format } from "machines/Ship/formatNumber";
import db from "../../data";

export async function clearPersistence() {
  console.log("Clearing localStorage...");

  for (let item in Keys) {
    if (isNaN(Number(item))) {
      console.log(`Clearing localStorage.${item}`);
      // @ts-ignore
      localStorage.removeItem(Keys[item]);
    }
  }

  setResetting(true);

  console.log("Clearing IndexedDB...");

  const tables = db.tables;
  for (const table of tables) {
    console.log(`Clearing ${table.name}`);
    const count = await table.count();
    console.log(`${table.name} has ${format(count)} records`);
    console.time("Clearing");
    await table.clear();
    console.timeEnd("Clearing");
  }

  console.log("Everything cleared");

  setResetting(false);
}
