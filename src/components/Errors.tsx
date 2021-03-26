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
import { makeStyles } from "@material-ui/core";
import CircularProgress from "@material-ui/core/CircularProgress";

const useStyles = makeStyles((theme) => ({
  data: {
    margin: 0,
  },
  when: {
    width: 100,
  },
}));

export const Errors = () => {
  const classes = useStyles();
  const errors = useLiveQuery(() => db.apiErrors.reverse().limit(50).toArray());

  if (!errors) return <CircularProgress color="primary" size={24} />;

  return (
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
  );
};
