import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../data";
import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Paper from "@material-ui/core/Paper";
import CircularProgress from "@material-ui/core/CircularProgress";
import { DateTime } from "luxon";
import NumberFormat from "react-number-format";
import { makeStyles } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

export const Markets = () => {
  const classes = useStyles();
  const [location, setLocation] = useState("");
  const [good, setGood] = useState("");

  const markets = useLiveQuery(() => {
    return db.markets
      .reverse()
      .filter(
        (p) =>
          (location ? p.location === location : true) &&
          (good ? p.good === good : true)
      )
      .limit(50)
      .toArray();
  }, [location, good]);

  const locations = useLiveQuery(() =>
    db.trades.orderBy("location").uniqueKeys()
  );
  const goods = useLiveQuery(() => db.trades.orderBy("good").uniqueKeys());

  if (!markets) return <CircularProgress color="primary" size={24} />;

  return (
    <>
      {locations && (
        <FormControl className={classes.formControl}>
          <InputLabel id="select-type-label">Location</InputLabel>
          <Select
            labelId="select-type-label"
            id="select-type"
            value={location}
            onChange={(e) => setLocation(e.target.value as string)}
          >
            <MenuItem value={""}>All</MenuItem>
            {locations.map((location) => (
              <MenuItem key={location as string} value={location as string}>
                {location}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
      {goods && (
        <FormControl className={classes.formControl}>
          <InputLabel id="select-good-label">Good</InputLabel>
          <Select
            labelId="select-good-label"
            id="select-good"
            value={good}
            placeholder="All"
            onChange={(e) => setGood(e.target.value as string)}
          >
            <MenuItem value={""}>All</MenuItem>
            {goods!.map((good: any) => (
              <MenuItem key={good} value={good}>
                {good}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      <TableContainer component={Paper}>
        <Table size="small" aria-label="Trades">
          <TableHead>
            <TableRow>
              <TableCell align="right">Location</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right">Good</TableCell>
              <TableCell align="right">㎥</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">When</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {markets.map((market) => (
              <TableRow key={market.id}>
                <TableCell component="th" scope="row">
                  {market.location}
                </TableCell>
                <TableCell align="right">{market.quantityAvailable}</TableCell>
                <TableCell align="right">{market.good}</TableCell>
                <TableCell align="right">{market.volumePerUnit}</TableCell>
                <TableCell align="right">
                  <NumberFormat
                    value={market.pricePerUnit}
                    thousandSeparator=","
                    displayType="text"
                    prefix="$"
                  />
                </TableCell>
                <TableCell align="right">
                  {DateTime.fromISO(market.created).toRelative()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
