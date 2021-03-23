import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@material-ui/core";
import { Location as LocationSchema } from "../api/Location";
import NumberFormat from "react-number-format";

type Props = {
  location: LocationSchema;
};
export const Location = ({ location }: Props) => {
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
