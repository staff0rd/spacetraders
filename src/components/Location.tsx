import React from "react";
import {
  Box,
  makeStyles,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
} from "@material-ui/core";
import { Location as LocationSchema } from "../api/Location";
import NumberFormat from "react-number-format";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
  },
}));

type Props = {
  location: LocationSchema;
};
export const Location = ({ location }: Props) => {
  const classes = useStyles();
  return (
    <>
      {location.marketplace && (
        <TableContainer component={Paper}>
          <Table size="small" aria-label="market place">
            <TableHead>
              <TableRow>
                <TableCell>Good</TableCell>
                <TableCell align="right">㎥</TableCell>
                <TableCell align="right">#</TableCell>
                <TableCell align="right"></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {location.marketplace.map((row) => (
                <TableRow key={row.symbol}>
                  <TableCell component="th" scope="row">
                    {row.symbol}
                  </TableCell>
                  <TableCell align="right">{row.volumePerUnit}</TableCell>
                  <TableCell align="right">
                    <NumberFormat
                      value={row.quantityAvailable}
                      thousandSeparator=","
                      displayType="text"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <NumberFormat
                      value={row.pricePerUnit}
                      thousandSeparator=","
                      displayType="text"
                      prefix="$"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </>
  );
};
