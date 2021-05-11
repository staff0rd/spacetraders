import TableContainer from "@material-ui/core/TableContainer";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import TableBody from "@material-ui/core/TableBody";
import Paper from "@material-ui/core/Paper";
import { IconButton, makeStyles } from "@material-ui/core";
import { useState } from "react";
import ExpandLessIcon from "@material-ui/icons/ExpandLess";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";

const useStyles = makeStyles((theme) => ({
  cell: {
    [theme.breakpoints.down("md")]: {
      "&.MuiTableCell-sizeSmall": {
        paddingRight: 0,
      },
      "&:last-child": {
        paddingRight: theme.spacing(2),
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
  columns?: React.ReactNode[];
  rows: React.ReactNode[][];
  rowClassName?: (index: number) => string;
  detailRowClassName?: string;
  firstColumnIsRowKey?: boolean;
  details?: boolean;
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

export const DataTable = ({
  title,
  columns,
  rows,
  rowClassName,
  firstColumnIsRowKey,
  details,
  detailRowClassName,
}: Props) => {
  const classes = useStyles();
  const [showDetails, setShowDetails] = useState<{ [index: string]: boolean }>(
    {}
  );
  return (
    <TableContainer component={Paper}>
      <Table size="small" aria-label={title}>
        {columns && (
          <TableHead>
            <TableRow>
              {columns.map((col, ix) => convertCell(col, ix, classes))}
              {details && <TableCell></TableCell>}
            </TableRow>
          </TableHead>
        )}
        <TableBody>
          {rows.map((row, ix) => (
            <>
              <TableRow
                className={rowClassName ? rowClassName(ix) : ""}
                key={firstColumnIsRowKey ? String(row[0]) : ix}
              >
                {row
                  .filter((cell, ix) => (firstColumnIsRowKey ? ix !== 0 : true))
                  .filter((cell, ix) => (details ? ix < row.length - 2 : true))
                  .map((cell, ix) => convertCell(cell, ix, classes))}
                {details && (
                  <TableCell>
                    <IconButton
                      onClick={() =>
                        setShowDetails({
                          ...showDetails,
                          [row[0] as string]: !showDetails[row[0] as string],
                        })
                      }
                    >
                      {showDetails[row[0] as string] ? (
                        <ExpandLessIcon />
                      ) : (
                        <ExpandMoreIcon />
                      )}
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
              {details && showDetails[row[0] as string] && (
                <TableRow className={detailRowClassName}>
                  <TableCell colSpan={row.length - 1}>
                    {row[row.length - 1]}
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
