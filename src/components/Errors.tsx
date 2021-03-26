import { useLiveQuery } from "dexie-react-hooks";
import db from "../data";
import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Paper from "@material-ui/core/Paper";
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

  if (!errors) return <CircularProgress color="primary" size={24} />;

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
            {codes!.map((code: any) => (
              <MenuItem value={code}>{code}</MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      <TableContainer component={Paper}>
        <Table size="small" aria-label="Trades">
          <TableHead>
            <TableRow>
              <TableCell>Code</TableCell>
              <TableCell>Message / Path</TableCell>
              <TableCell>Data</TableCell>
              <TableCell className={classes.when}>When</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errors.map((error) => (
              <TableRow key={error.id}>
                <TableCell component="th" scope="row">
                  {error.code}
                </TableCell>
                <TableCell>
                  {error.message}
                  <br />
                  {error.path}
                </TableCell>
                <TableCell>
                  {error.data && (
                    <pre className={classes.data}>
                      {JSON.stringify(error.data, null, 2)}
                    </pre>
                  )}
                </TableCell>

                <TableCell className={classes.when} align="right">
                  {DateTime.fromISO(error.created).toRelative()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
