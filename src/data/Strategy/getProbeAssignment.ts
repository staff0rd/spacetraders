import Bottleneck from "bottleneck";
import db from "../";
import { getDistance } from "../../machines/getDistance";
import { IProbe } from "../IProbe";

const limiter = new Bottleneck({ maxConcurrent: 1 });
export const getProbeAssignment = async (system: string, shipId: string) => {
  return limiter.schedule(() => getAssignment(system, shipId));
};
const getAssignment = async (system: string, shipId: string) => {
  const probes = await db.probes.toArray();
  const assignment = probes.find((p) => p.shipId === shipId);
  if (assignment) return assignment;

  const ship = await db.ships.get(shipId);
  if (!ship?.location) {
    const message = "Unexpected: No location on ship";
    console.warn(message);
    throw new Error(message);
  }
  const from: IProbe = probes.find((p) => p.location === ship?.location)!;
  const unassigned = probes
    .filter((p) => p.location.startsWith(system) && p.shipId === undefined)
    .map((p) => ({ ...p, distance: getDistance(from.x, from.y, p.x, p.y) }))
    .sort((a, b) => a.distance - b.distance);

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
