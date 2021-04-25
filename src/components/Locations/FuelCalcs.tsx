import { useLocalStorage } from "components/useLocalStorage";
import { Keys } from "data/localStorage/Keys";
import { getLocations } from "data/localStorage/locationCache";
import { CustomSelect } from "components/CustomSelect";
import { DataTable, right } from "components/DataTable";
import { getGraph, getRoute } from "data/localStorage/graph";
import NumberFormat from "react-number-format";
import { Typography } from "@material-ui/core";

export const FuelCalcs = () => {
  const locations = getLocations()
    .map((p) => p.symbol)
    .sort();
  const [from, setFrom] = useLocalStorage<string>(
    Keys.FuelCalc_From,
    locations[0]
  );
  const [to, setTo] = useLocalStorage<string>(Keys.FuelCalc_To, locations[1]);
  const { graph, warps } = getGraph();
  const route = getRoute(graph, from, to, "JW-MK-I", 50, warps);
  const columns = [
    "From",
    "To",
    right("Fuel Needed"),
    right("Fuel Available"),
    "Warp",
  ];
  const rows = route.map((row) => [
    row.from.symbol,
    row.to.symbol,
    right(row.fuelNeeded),
    right(
      <NumberFormat
        value={row.fuelAvailable}
        thousandSeparator=","
        displayType="text"
      />
    ),
    row.isWarp ? "YES" : "",
  ]);
  return (
    <>
      <CustomSelect
        name="From"
        setValue={setFrom}
        value={from}
        values={locations}
        hideAll
      />
      <CustomSelect
        name="To"
        setValue={setTo}
        value={to}
        values={locations}
        hideAll
      />
      <Typography>JW-MK-I</Typography>
      <DataTable title="Fuel calcs" rows={rows} columns={columns} />
    </>
  );
};
