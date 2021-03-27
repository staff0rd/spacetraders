import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Paper from "@material-ui/core/Paper";
import CircularProgress from "@material-ui/core/CircularProgress";
import NumberFormat from "react-number-format";
import { AvailableShip } from "../api/AvailableShip";

type Props = {
  availableShips: AvailableShip[];
};

export const AvailableShips = ({ availableShips }: Props) => {
  if (!availableShips || !availableShips.length)
    return <CircularProgress size={48} />;

  const ships = availableShips
    .map((av) =>
      av.purchaseLocations.map((loc) => ({
        ...av,
        purchaseLocations: undefined,
        ...loc,
      }))
    )
    .flat()
    .sort((a, b) => a.price - b.price);

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="Trades">
          <TableHead>
            <TableRow>
              <TableCell>Manufacturer</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>S/W/P</TableCell>
              <TableCell align="right">Max Cargo</TableCell>
              <TableCell align="right">Price</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ships.map((line, ix) => (
              <TableRow key={ix}>
                <TableCell component="th" scope="row">
                  {line.manufacturer}
                </TableCell>
                <TableCell>{line.class}</TableCell>
                <TableCell>{line.type}</TableCell>
                <TableCell>{line.location}</TableCell>
                <TableCell>
                  {line.speed} / {line.weapons} / {line.plating}
                </TableCell>
                <TableCell align="right">
                  <NumberFormat
                    value={line.maxCargo}
                    thousandSeparator=","
                    displayType="text"
                  />
                </TableCell>
                <TableCell align="right">
                  <NumberFormat
                    value={line.price}
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
    </>
  );
};
