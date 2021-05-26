import { Typography } from "@material-ui/core";
import { getSystemFromLocationSymbol } from "data/localStorage/getSystemFromLocationSymbol";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../../data";

type SystemProbes = { symbol: string; probes: number; locations: number };

export const Probes = () => {
  const probes = useLiveQuery(() => db.probes.toArray());

  const systems: SystemProbes[] = [];

  if (!probes) return <></>;

  probes.forEach((p) => {
    const system = getSystemFromLocationSymbol(p.location);
    if (!systems.find((s) => s.symbol === system)) {
      const locations = probes.filter(
        (p) => getSystemFromLocationSymbol(p.location) === system
      );
      const probeCount = locations.filter((p) => !!p.shipId).length;
      systems.push({
        symbol: system,
        probes: probeCount,
        locations: locations.length,
      });
    }
  });

  return (
    <>
      <Typography>Probes</Typography>
      {systems.map((s) => (
        <Typography key={s.symbol}>
          {s.symbol}: {s.probes}/{s.locations}
        </Typography>
      ))}
    </>
  );
};
