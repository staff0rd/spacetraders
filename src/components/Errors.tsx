import { useLiveQuery } from "dexie-react-hooks";
import db from "../data";
import { DataTable } from "./DataTable";
import { DateTime } from "luxon";
import {
  makeStyles,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useState } from "react";

const useStyles = makeStyles((theme) => ({
  data: {
    margin: 0,
  },
  when: {
    width: 100,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

export const Errors = () => {
  const classes = useStyles();
  const [code, setCode] = useState(0);
  const errors = useLiveQuery(
    () =>
      db.apiErrors
        .reverse()
        .filter((e) => (code ? code === e.code : true))
        .limit(50)
        .toArray(),
    [code]
  );
  const codes = useLiveQuery(() => db.apiErrors.orderBy("code").uniqueKeys());

  if (!errors) return <CircularProgress color="primary" size={48} />;
  const columns = ["Code", "Message / Path", "Data", "When"];
  const rows = errors.map((error) => [
    error.code,
    <>
      {error.message}
      <br />
      {error.path}
    </>,
    error.data && (
      <pre className={classes.data}>{JSON.stringify(error.data, null, 2)}</pre>
    ),
    DateTime.fromISO(error.created).toRelative(),
  ]);
  return (
    <>
      {codes && (
        <FormControl className={classes.formControl}>
          <InputLabel id="select-code-label">Code</InputLabel>
          <Select
            labelId="select-code-label"
            id="select-code"
            value={code}
            placeholder="All"
            onChange={(e) => setCode(e.target.value as number)}
          >
            <MenuItem value={0}>All</MenuItem>
            {codes!.map((code: any, ix) => (
              <MenuItem key={ix} value={code}>
                {code}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <DataTable rows={rows} columns={columns} title="Errors" />
    </>
  );
};
