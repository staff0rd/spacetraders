import createGraph, { Graph } from "ngraph.graph";
import { getLocations, getWarp } from "./locationCache";
import { Location } from "api/Location";
import { aStar } from "ngraph.path";
import { getFromToSystems, getLocationFuelNeeded } from "data/getFuelNeeded";
import { distancePoint } from "components/Locations/Map/geometry";

const getSystems = (locations: Location[]): string[] => {
  const set = new Set(
    locations.map((location) => {
      if (!location.symbol) console.warn(location);
      return location.symbol.substring(0, 2);
    })
  );
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
  const aNode = graph.getNode(a.symbol);
  const bNode = graph.getNode(b.symbol);
  if (!existingLink && aNode && bNode) graph.addLink(a.symbol, b.symbol);
};

//const debug = ["OE-XV-91-2", "OE-CR", "OE-PM", "XV-OE-2-91", "XV-CB-NM"];
//const debug = ["OE-XV-91-2", "XV-OE-2-91", "XV-CB-NM"];

export const getGraph = (skipWarps = true) => {
  const locations = getLocations();
  const systems = getSystems(locations);
  const graph = createGraph();
  locations.forEach((location) => {
    //if (debug.includes(location.symbol))
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

  const warps: Location[] = [];
  systems.forEach((a) => {
    systems.forEach((b) => {
      const warp = findWarp(a, b, locations);
      if (warp.length) {
        if (warp.length !== 2) throw new Error("Unexpected warp count");
        warps.push(warp[0], warp[1]);
        addLink(warp[0], warp[1], graph);
      }
    });
  });

  if (skipWarps) {
    const notWormholes = locations.filter((p) => p.type !== "WORMHOLE");

    notWormholes.forEach((a) => {
      notWormholes.forEach((b) => {
        addLink(a, b, graph);
      });
    });
  }

  return { graph, warps };
};

type Route = {
  from: Location;
  to: Location;
  fuelNeeded: number;
  fuelAvailable: number;
};

export const getRoute = (
  graph: Graph,
  from: string,
  to: string,
  shipType: string,
  maxCargo: number,
  warps: Location[]
) => {
  const pathFinder = aStar<Location, Location>(graph, {
    distance(fromNode, toNode) {
      const distance = getDistance(fromNode.data, toNode.data, warps);
      const fuel = getLocationFuelNeeded(fromNode.data, toNode.data, shipType);
      // console.warn(
      //   `${fromNode.id}>>${toNode.id} - distance: ${distance}, fuel: ${fuel}`
      // );
      if (fuel > maxCargo) return Infinity;
      //if (hasGood(toNode.data, "FUEL") === 0) return distance + 100; // no fuel penalty
      return distance;
    },
    heuristic(fromNode, toNode) {
      let dx = fromNode.data.x - toNode.data.x;
      let dy = fromNode.data.y - toNode.data.y;

      return Math.sqrt(dx * dx + dy * dy);
    },
  });
  const path = pathFinder.find(from, to).reverse();

  const route: Route[] = [];

  path.forEach((p, ix) => {
    if (ix) {
      const from = path[ix - 1].data;
      const to = p.data;
      const fuelNeeded = getLocationFuelNeeded(from, to, shipType);
      const fuelAvailable =
        from.marketplace?.find((p) => p.symbol === "FUEL")?.quantityAvailable ||
        0;
      route.push({
        from,
        to,
        fuelNeeded,
        fuelAvailable,
      });
    }
  });
  return insertWarps(route);
};

const insertWarps = (routes: Route[]) => {
  const result: Route[] = [];
  routes.forEach((r) => {
    const { fromSystem, toSystem } = getFromToSystems(r.from, r.to);
    if (fromSystem === toSystem) {
      result.push(r);
    } else {
      const { enter, exit } = getWarp(fromSystem, toSystem);
      if (
        ![enter.symbol, exit.symbol].includes(r.from.symbol) &&
        ![enter.symbol, exit.symbol].includes(r.to.symbol)
      ) {
        result.push(
          {
            ...r,
            to: enter,
          },
          {
            from: enter,
            to: exit,
            fuelNeeded: 0,
            fuelAvailable: 0,
          },
          {
            from: exit,
            to: r.to,
            fuelNeeded: 0,
            fuelAvailable: 0,
          }
        );
      } else {
        result.push(r);
      }
    }
  });
  return result;
};

const isWarp = (from: Location, to: Location) => {
  return from.symbol.substring(0, 2) !== to.symbol.substring(0, 2);
};

function getDistance(from: Location, to: Location, warps: Location[]) {
  if (isWarp(from, to)) {
    const warpFrom = warps.find((p) =>
      p.symbol.startsWith(from.symbol.substring(0, 2))
    );
    if (!warpFrom) throw new Error("Could not find warpFrom");
    const warpTo = warps.find((p) =>
      p.symbol.startsWith(to.symbol.substring(0, 2))
    );
    if (!warpTo) throw new Error("Could not find warpTo");

    if (
      (from.symbol === warpFrom.symbol && to.symbol === warpTo.symbol) ||
      (from.symbol === warpTo.symbol && to.symbol === warpFrom.symbol)
    ) {
      // is WORMHOLE
      //console.log("wormhole!");
      return 0;
    } else {
      // console.log(
      //   `not wormhole: ${from.symbol}>>${to.symbol} (${warpFrom.symbol}>>${warpTo.symbol})`
      // );
    }

    const fromDistance = distancePoint(warpFrom, from);
    const toDistance = distancePoint(warpTo, to);

    return fromDistance + toDistance;
  } else {
    //console.log(`not warp: ${from.symbol}>>${to.symbol}`);
  }
  return distancePoint(from, to);
}
