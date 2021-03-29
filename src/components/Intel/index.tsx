import { useLiveQuery } from "dexie-react-hooks";
import { DateTime } from "luxon";
import { useState } from "react";
import db from "../../data";
import { CustomSelect } from "../CustomSelect";
import CircularProgress from "@material-ui/core/CircularProgress";
import { DataTable } from "../DataTable";
import { IIntel } from "../../data/IIntel";
import { Summary } from "./Summary";

export const Intel = () => {
  const [username, setUsername] = useState("");

  const intel = useLiveQuery(() => {
    return db.intel
      .filter((p) => (username !== "" ? username === p.username : true))
      .toArray();
  }, [username]);

  const usernames = useLiveQuery(() =>
    db.intel.orderBy("username").uniqueKeys()
  );

  if (!intel) return <CircularProgress color="primary" size={24} />;

  const grouped: any[] = [];
  intel.reduce(function (res: any, value: IIntel) {
    if (!res[value.username]) {
      res[value.username] = {
        quantity: 0,
        username: value.username,
      };
      grouped.push(res[value.username]);
    }
    res[value.username].quantity += 1;
    return res;
  }, {});

  const columns = ["Username", "ShipType", "From", "To", "Last seen"];

  const rows = intel.map((i) => [
    i.username,
    i.shipType,
    i.departure ?? "-",
    i.destination,
    DateTime.fromISO(i.lastSeen).toRelative(),
  ]);

  return (
    <>
      <Summary items={Object.values(grouped) as any} />
      {usernames && (
        <CustomSelect
          name="Username"
          setValue={setUsername}
          value={username}
          values={(usernames as any[]).sort()}
        />
      )}
      <DataTable title="Intel" columns={columns} rows={rows} />
    </>
  );
};
