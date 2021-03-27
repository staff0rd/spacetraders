import { CircularProgress } from "@material-ui/core";
import React from "react";

import { MarketContext } from "../machines/MarketContext";
import { DataTable } from "./DataTable";

type Props = {
  locations?: MarketContext;
};

export const Locations = ({ locations }: Props) => {
  if (!locations || !Object.keys(locations).length)
    return <CircularProgress size={48} />;

  const columns = ["System", "Name", "Symbol", "Type", "Position"];
  const rows = Object.keys(locations).map((key) => {
    const location = locations[key];
    const system = location.symbol.substr(0, 2);
    return [
      system,
      location.name,
      location.symbol,
      location.type,
      `${location.x},${location.y}`,
    ];
  });

  return <DataTable title="Locations" columns={columns} rows={rows} />;
};
