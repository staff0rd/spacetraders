import { Typography } from "@material-ui/core";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../../data";

type SystemProbes = { symbol: string; probes: number; locations: number };

export const Probes = () => {
  const probes = useLiveQuery(() => db.probes.toArray());

  const systems: SystemProbes[] = [];

  if (!probes) return <></>;

  probes.forEach((p) => {
    const system = p.location.substring(0, 2);
    if (!systems.find((s) => s.symbol === system)) {
      const locations = probes.filter(
        (p) => p.location.substring(0, 2) === system
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
