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
import { makeStyles, Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  link: {
    "& a": {
      color: "white",
    },
  },
}));

export const Users = () => {
  const classes = useStyles();
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
        inTransit: 0,
        docked: 0,
      };
      grouped.push(res[value.username]);
    }
    res[value.username].quantity += 1;
    if (value.departure) res[value.username].inTransit += 1;
    else res[value.username].docked += 1;
    return res;
  }, {});

  const columns = ["Username", "ShipType", "From", "To", "Last seen"];

  const rows = intel.map((i) => [
    <Typography className={classes.link}>
      <Link to={`intel/${i.username}`}>{i.username}</Link>
    </Typography>,
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
