import Typography from "@material-ui/core/Typography";
import Tooltip from "@material-ui/core/Tooltip";
import { DataTable, right } from "./DataTable";
import CircularProgress from "@material-ui/core/CircularProgress";
import NumberFormat from "react-number-format";
import { AvailableShip } from "../api/AvailableShip";
import { useMediaQuery, useTheme } from "@material-ui/core";

type Props = {
  availableShips: AvailableShip[];
};

export const AvailableShips = ({ availableShips }: Props) => {
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  console.warn("msdown", isMdDown);
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

  const columns = [
    ...(isMdDown ? [] : ["Manufacturer", "Class"]),
    "Type",
    "Location",
    <>
      <Tooltip title="Speed">
        <Typography component="span">S</Typography>
      </Tooltip>{" "}
      /{" "}
      <Tooltip title="Weapons">
        <Typography component="span">W</Typography>
      </Tooltip>{" "}
      /{" "}
      <Tooltip title="Plating">
        <Typography component="span">P</Typography>
      </Tooltip>
    </>,
    right("Cargo"),
    right("Price"),
  ];
  const rows = ships.map((line) => [
    ...(isMdDown ? [] : [line.manufacturer, line.class]),
    line.type,
    line.location,

    `${line.speed} / ${line.weapons} / ${line.plating}`,

    right(
      <NumberFormat
        value={line.maxCargo}
        thousandSeparator=","
        displayType="text"
      />
    ),
    right(
      <NumberFormat
        value={line.price}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
  ]);
  return <DataTable title="Available ships" columns={columns} rows={rows} />;
};
