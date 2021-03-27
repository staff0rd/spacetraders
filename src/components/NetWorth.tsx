import CircularProgress from "@material-ui/core/CircularProgress";
import NumberFormat from "react-number-format";
import { NetWorthLineItem } from "../machines/NetWorthLineItem";
import { DataTable } from "./DataTable";

type Props = {
  lines: NetWorthLineItem[];
};

export const NetWorth = ({ lines }: Props) => {
  if (!lines || !lines.length) return <CircularProgress size={48} />;
  const grouped: NetWorthLineItem[] = [];
  lines.reduce(function (res: any, value: NetWorthLineItem) {
    if (!res[value.description]) {
      res[value.description] = {
        description: value.description,
        value: 0,
        quantity: 0,
      };
      grouped.push(res[value.description]);
    }
    res[value.description].value += value.value;
    res[value.description].category = value.category;
    res[value.description].quantity += value.quantity;
    return res;
  }, {});

  const right = (value: React.ReactNode) => ({
    props: { align: "right" },
    value,
  });

  const columns = [
    "Category",
    "Description",
    right("Quantity"),
    right("Value"),
  ];
  const rows: React.ReactNode[][] = grouped.map((row) => [
    row.category,
    row.description,
    right(
      <NumberFormat
        value={row.quantity}
        thousandSeparator=","
        displayType="text"
      />
    ),
    right(
      <NumberFormat
        value={row.value}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
  ]);

  return <DataTable title="Net Worth" columns={columns} rows={rows} />;
};
