import Bottleneck from "bottleneck";
import db from "../";

const limiter = new Bottleneck({ maxConcurrent: 1 });
export const getProbeAssignment = async (system: string, shipId: string) => {
  return limiter.schedule(() => getAssignment(system, shipId));
};
const getAssignment = async (system: string, shipId: string) => {
  const assignments = await db.probes.toArray();
  const assignment = assignments.find((p) => p.shipId === shipId);
  if (assignment) return assignment;

  const newAssignment = assignments.find(
    (p) => p.location.startsWith(system) && p.shipId === undefined
  );

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
