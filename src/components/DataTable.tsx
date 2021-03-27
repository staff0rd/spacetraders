import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Paper from "@material-ui/core/Paper";

export type Props = {
  title: string;
  columns: React.ReactNode[];
  rows: React.ReactNode[][];
};

const convertCell = (cell: React.ReactNode, index: number) => {
  if (typeof cell === "object" && "value" in cell! && "props" in cell) {
    return (
      <TableCell key={index} {...cell["props"]}>
        {cell["value"]}
      </TableCell>
    );
  }

  return <TableCell key={index}>{cell}</TableCell>;
};

export const DataTable = ({ title, columns, rows }: Props) => {
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label={title}>
        <TableHead>
          <TableRow>{columns.map((col, ix) => convertCell(col, ix))}</TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, ix) => (
            <TableRow key={ix}>
              {row.map((cell, ix) => convertCell(cell, ix))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
