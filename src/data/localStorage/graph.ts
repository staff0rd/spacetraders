import createGraph, { Graph } from "ngraph.graph";
import { getLocations } from "./locationCache";
import { Location } from "api/Location";
import { aStar } from "ngraph.path";
import { getFuelNeeded } from "data/getFuelNeeded";
import { distancePoint } from "components/Locations/Map/geometry";

const getSystems = (location: Location[]): string[] => {
  const set = new Set(location.map((l) => l.symbol.substring(0, 2)));
  return [...set];
};

const getLocationsBySystem = (system: string, locations: Location[]) => {
  return locations.filter((p) => p.symbol.startsWith(system));
};

const findWarp = (a: string, b: string, locations: Location[]) => {
  return locations.filter(
    (x) =>
      x.symbol.startsWith(`${a}-${b}-`) || x.symbol.startsWith(`${b}-${a}-`)
  );
};

const addLink = (a: Location, b: Location, graph: Graph) => {
  const existingLink = graph.getLink(a.symbol, b.symbol);
  if (!existingLink) graph.addLink(a.symbol, b.symbol);
};

export const getGraph = () => {
  const locations = getLocations();
  const systems = getSystems(locations);
  const graph = createGraph();
  locations.forEach((location) => {
    graph.addNode(location.symbol, location);
  });

  systems.forEach((system) => {
    const systemLocations = getLocationsBySystem(system, locations);
    systemLocations.forEach((a) => {
      systemLocations.forEach((b) => {
        addLink(a, b, graph);
      });
    });
  });

  systems.forEach((a) => {
    systems.forEach((b) => {
      const warp = findWarp(a, b, locations);
      if (warp.length) {
        if (warp.length !== 2) throw new Error("Unexpected warp count");
        addLink(warp[0], warp[1], graph);
      }
    });
  });

  console.log(graph.getLinkCount());

  const maxCargo = 50;
  const shipType = "JW-MK-I";

  const pathFinder = aStar<Location, Location>(graph, {
    distance(fromNode, toNode) {
      const distance = distancePoint(fromNode.data, toNode.data);
      const fuel = getFuelNeeded(
        distance,
        fromNode.data.type,
        toNode.data.type,
        shipType
      );
      if (fuel > maxCargo) return Infinity;
      return distance;
    },
    heuristic(fromNode, toNode) {
      let dx = fromNode.data.x - toNode.data.x;
      let dy = fromNode.data.y - toNode.data.y;

      return Math.sqrt(dx * dx + dy * dy);
    },
  });
  const path = pathFinder.find("OE-BO", "XV-TLF").reverse();

  const route: { from: Location; to: Location; fuelNeeded: number }[] = [];
  path.forEach((p, ix) => {
    if (ix) {
      const from = path[ix - 1].data;
      const to = p.data;
      route.push({
        from,
        to,
        fuelNeeded: getFuelNeeded(
          distancePoint(from, to),
          from.type,
          to.type,
          "A"
        ),
      });
    }
  });
  console.log(route);
};
