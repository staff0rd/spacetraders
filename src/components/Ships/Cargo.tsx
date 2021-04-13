import { Ship } from "../../api/Ship";
import { CircularProgress } from "@material-ui/core";
import { DataTable } from "../DataTable";
import { GoodIcon } from "components/Trades/GoodIcon";

type Props = {
  ship?: Ship;
};

const CargoComponent = ({ ship }: Props) => {
  if (!ship) return <CircularProgress />;
  const columns = ["Cargo", "Qty", "㎥"];
  const rows = ship.cargo.map((c) => [
    <GoodIcon good={c.good} />,
    c.quantity,
    c.totalVolume,
  ]);
  return <DataTable title="Cargo" rows={rows} columns={columns} />;
};
export default CargoComponent;
