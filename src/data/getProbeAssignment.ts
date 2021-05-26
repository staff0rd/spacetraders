import Bottleneck from "bottleneck";
import { getGraph, getRoute } from "data/localStorage/graph";
import db from ".";
import { IProbe } from "./IProbe";

const limiter = new Bottleneck({ maxConcurrent: 1 });
export const getProbeAssignment = async (shipId: string) => {
  return limiter.schedule(() => getAssignment(shipId));
};
const getAssignment = async (shipId: string) => {
  const probes = await db.probes.toArray();
  const assignment = probes.find((p) => p.shipId === shipId);
  if (assignment) return assignment;

  const ship = await db.ships.get(shipId);
  if (!ship?.location) {
    const message = "Unexpected: No location on ship";
    console.warn(message);
    throw new Error(message);
  }

  const { graph, warps } = getGraph();

  const from: IProbe = probes.find((p) => p.location === ship?.location)!;
  const unassigned = probes
    .filter((p) => p.shipId === undefined)
    .map((p) => ({
      ...p,
      totalFuel: getRoute(graph, from.location, p.location, ship, warps)
        .map((r) => r.fuelNeeded)
        .reduce((a, b) => a + b, 0),
    }))
    .sort((a, b) => a.totalFuel - b.totalFuel);

  const newAssignment = unassigned[0];

  if (newAssignment) {
    db.probes.put({
      shipId,
      location: newAssignment.location,
      x: newAssignment.x,
      y: newAssignment.y,
      type: newAssignment.type,
    });
    return newAssignment;
  }
};
