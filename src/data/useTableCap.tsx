import { useEffect } from "react";
import { DateTime } from "luxon";

export const useTableCap = (
  table: Dexie.Table<any, any>,
  timestampColumn: string,
  hours: number
) => {
  useEffect(() => {
    const deleteOld = async () => {
      await table
        .where(timestampColumn)
        .below(DateTime.now().minus({ hours }).toISO())
        .delete();
    };
    deleteOld();
    const interval = setInterval(deleteOld, 300 * 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
