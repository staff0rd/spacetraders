import { Typography } from "@material-ui/core";
import { Structure as apiStructure } from "api/Structure";
import { GoodIcon } from "components/Trades/GoodIcon";
import NumberFormat from "react-number-format";
import { DataTable, right } from "../DataTable";

type Props = {
  structure: apiStructure;
};
export const Structure = ({ structure }: Props) => {
  const columns = [right("Need"), "", right("Have"), right("Diff")];
  const rows = (structure.materials || []).map((row) => [
    right(
      <NumberFormat
        value={row.targetQuantity}
        thousandSeparator=","
        displayType="text"
      />
    ),
    <GoodIcon good={row.good} />,
    right(
      <NumberFormat
        value={row.quantity}
        thousandSeparator=","
        displayType="text"
      />
    ),
    right(
      <NumberFormat
        value={row.targetQuantity - row.quantity}
        thousandSeparator=","
        displayType="text"
      />
    ),
  ]);

  return (
    <>
      <Typography>
        {structure.name} - {structure.stability}
      </Typography>
      <DataTable title="Structures" rows={rows} columns={columns} />
    </>
  );
};
