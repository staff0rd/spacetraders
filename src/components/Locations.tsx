import { CircularProgress } from "@material-ui/core";
import React from "react";

import { SystemContext } from "../machines/MarketContext";
import { DataTable } from "./DataTable";

type Props = {
  systems?: SystemContext;
};

export const Locations = ({ systems }: Props) => {
  if (!systems || !Object.keys(systems).length)
    return <CircularProgress size={48} />;

  const columns = ["System", "Name", "Symbol", "Type", "Position"];
  console.log("keys1", Object.keys(systems));
  const rows = Object.keys(systems)
    .map((systemSymbol) =>
      Object.keys(systems[systemSymbol]).map((key) => {
        const location = systems[systemSymbol][key];
        console.log("sys", systemSymbol);
        console.log("key", key);
        console.log("result", systems[systemSymbol]);
        return [
          systemSymbol,
          location.name,
          location.symbol,
          location.type,
          `${location.x},${location.y}`,
        ];
      })
    )
    .flat();

  return <DataTable title="Locations" columns={columns} rows={rows} />;
};
