import { useEffect } from "react";
import db from ".";
import { DateTime } from "luxon";

export const useTableCap = (
  table: Dexie.Table<any, any>,
  timestampColumn: string,
  hours: number
) => {
  useEffect(() => {
    const deleteOld = async () => {
      const old = await table
        .where(timestampColumn)
        .below(DateTime.now().minus({ hours }).toISO())
        .delete();
      const total = await db.trades.count();
      console.log(`Deleted ${old} from ${table.name}, left: ${total}`);
    };
    deleteOld();
    const interval = setInterval(deleteOld, 300 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
