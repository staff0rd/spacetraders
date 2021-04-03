import { useLiveQuery } from "dexie-react-hooks";
import { DateTime } from "luxon";
import { useState } from "react";
import db from "../../data";
import { CustomSelect } from "../CustomSelect";
import CircularProgress from "@material-ui/core/CircularProgress";
import { DataTable } from "../DataTable";
import { IIntel } from "../../data/IIntel";
import { Summary } from "./Summary";
import { Link } from "react-router-dom";
import { filterToIntelWindow } from "./filterToIntelWindow";

export const Intel = () => {
  const [username, setUsername] = useState("");

  const intel = useLiveQuery(() => {
    const collection = username
      ? db.intel.where("username").equals("username")
      : db.intel.toCollection();
    return filterToIntelWindow(collection);
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
    <Link to={`intel/${i.username}`}>{i.username}</Link>,
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
