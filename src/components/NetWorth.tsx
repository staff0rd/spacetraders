import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Paper from "@material-ui/core/Paper";
import CircularProgress from "@material-ui/core/CircularProgress";
import NumberFormat from "react-number-format";
import { makeStyles } from "@material-ui/core";
import { NetWorthLineItem } from "../machines/NetWorthLineItem";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

type Props = {
  lines: NetWorthLineItem[];
};

export const NetWorth = ({ lines }: Props) => {
  if (!lines || !lines.length) return <CircularProgress size={48} />;
  const grouped: NetWorthLineItem[] = [];
  lines.reduce(function (res: any, value: NetWorthLineItem) {
    if (!res[value.description]) {
      res[value.description] = { description: value.description, value: 0 };
      grouped.push(res[value.description]);
    }
    res[value.description].value += value.value;
    res[value.description].category = value.category;
    return res;
  }, {});

  return (
    <>
      <TableContainer component={Paper}>
        <Table size="small" aria-label="Trades">
          <TableHead>
            <TableRow>
              <TableCell>Category</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grouped.map((line, ix) => (
              <TableRow key={ix}>
                <TableCell component="th" scope="row">
                  {line.category}
                </TableCell>
                <TableCell>{line.description}</TableCell>
                <TableCell align="right">
                  <NumberFormat
                    value={line.value}
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
