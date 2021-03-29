import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  cell: {
    [theme.breakpoints.down("md")]: {
      "&.MuiTableCell-sizeSmall": {
        paddingRight: 0,
      },
    },
  },
}));

export const right = (value: React.ReactNode) => ({
  props: { align: "right" },
  value,
});

export type Props = {
  title: string;
  columns: React.ReactNode[];
  rows: React.ReactNode[][];
  rowClassName?: (index: number) => string;
};

const convertCell = (cell: React.ReactNode, index: number, classes: any) => {
  if (typeof cell === "object" && "value" in cell! && "props" in cell) {
    return (
      <TableCell className={classes.cell} key={index} {...cell["props"]}>
        {cell["value"]}
      </TableCell>
    );
  }

  return (
    <TableCell className={classes.cell} key={index}>
      {cell}
    </TableCell>
  );
};

export const DataTable = ({ title, columns, rows, rowClassName }: Props) => {
  const classes = useStyles();
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label={title}>
        <TableHead>
          <TableRow>
            {columns.map((col, ix) => convertCell(col, ix, classes))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ix) => (
            <TableRow className={rowClassName ? rowClassName(ix) : ""} key={ix}>
              {row.map((cell, ix) => convertCell(cell, ix, classes))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
