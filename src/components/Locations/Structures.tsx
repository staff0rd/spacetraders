import { CircularProgress } from "@material-ui/core";
import { AvailableStructure } from "api/AvailableStructure";
import { DataTable, right } from "components/DataTable";
import { GoodIcon } from "components/Trades/GoodIcon";
import { useInterval } from "components/useInterval";
import { getAvailableStructures } from "data/localStorage/getAvailableStructures";
import React, { useState } from "react";
import NumberFormat from "react-number-format";

export const Structures = () => {
  const [structures, setStructures] = useState<AvailableStructure[]>([]);
  useInterval(() => {
    if (!structures.length) {
      const result = getAvailableStructures();
      if (result) setStructures(result);
    }
  }, 1000);

  if (!structures.length) return <CircularProgress color="primary" size={48} />;

  const columns = [
    "Name",
    "Type",
    right("Price"),
    "Where",
    "Consumes",
    "Produces",
  ];
  const rows = structures.map((s) => [
    s.name,
    s.type,
    right(
      <NumberFormat
        value={s.price}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    s.allowedLocationTypes.join(", "),
    <>
      {s.consumes.map((g) => (
        <GoodIcon good={g} />
      ))}
    </>,
    <>
      {s.produces.map((g) => (
        <GoodIcon good={g} />
      ))}
    </>,
  ]);

  return <DataTable title={"Structures"} rows={rows} columns={columns} />;
};
