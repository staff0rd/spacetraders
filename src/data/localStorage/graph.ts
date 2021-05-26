import createGraph, { Graph } from "ngraph.graph";
import { fuelCache, getLocations, getWarp } from "./locationCache";
import { Location } from "api/Location";
import { aStar } from "ngraph.path";
import { getFromToSystems, getLocationFuelNeeded } from "data/getFuelNeeded";
import { distancePoint } from "components/Locations/Map/geometry";
import { Route } from "./Route";
import { ITradeShip } from "machines/Ship/ITradeShip";
import { getSystemFromLocationSymbol } from "./getSystemFromLocationSymbol";

export const getSystems = (locations: Location[]): string[] => {
  const set = new Set(
    locations.map((location) => {
      if (!location.symbol) console.warn(location);
      return getSystemFromLocationSymbol(location.symbol);
    })
  );
  return [...set];
};

const getLocationsBySystem = (system: string, locations: Location[]) => {
  return locations.filter((p) => p.symbol.startsWith(system));
};

const findConnectedWormholes = (
  fromSystem: string,
  toSystem: string,
  locations: Location[]
) => {
  return locations.filter(
    (x) =>
      x.symbol === `${fromSystem}-W-${toSystem}` ||
      x.symbol === `${toSystem}-W-${fromSystem}`
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

export const getGraph = () => {
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

  const warps: Location[] = getWormholes(systems, locations, (a, b) =>
    addLink(a, b, graph)
  );

  const notWormholes = locations.filter((p) => p.type !== "WORMHOLE");

  notWormholes.forEach((a) => {
    notWormholes.forEach((b) => {
      addLink(a, b, graph);
    });
  });

  return { graph, warps };
};

export const getRoute = (
  graph: Graph,
  from: string,
  to: string,
  ship: ITradeShip,
  warps: Location[]
) => {
  const pathFinder = aStar<Location, Location>(graph, {
    distance(fromNode, toNode) {
      const distance = getDistance(fromNode.data, toNode.data, warps);
      const fuel = getLocationFuelNeeded(fromNode.data, toNode.data, ship.type);
      // console.warn(
      //   `${fromNode.id}>>${toNode.id} - distance: ${distance}, fuel: ${fuel}`
      // );
      if (fuel > ship.maxCargo) return Infinity;
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
      const fuelNeeded = getLocationFuelNeeded(from, to, ship.type);
      const fuelAvailable = fuelCache[from.symbol]?.available ?? 0;
      route.push({
        from,
        to,
        fuelNeeded,
        fuelAvailable,
        isWarp: false,
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
            isWarp: true,
          },
          {
            from: exit,
            to: r.to,
            fuelNeeded: 0,
            fuelAvailable: 0,
            isWarp: false,
          }
        );
      } else {
        result.push(r);
      }
    }
  });
  return result;
};

const isWarp = (from: Location, to: Location) =>
  getSystemFromLocationSymbol(from.symbol) !==
  getSystemFromLocationSymbol(to.symbol);

export const getWormholes = (
  systems: string[],
  locations: Location[],
  connectedWormholeCallback?: (a: Location, b: Location) => void
) => {
  const warps: Location[] = [];
  systems.forEach((systemA) => {
    systems.forEach((systemB) => {
      const warp = findConnectedWormholes(systemA, systemB, locations);
      if (warp.length) {
        if (warp.length !== 2) throw new Error("Unexpected warp count");
        if (!warps.includes(warp[0])) {
          warps.push(warp[0], warp[1]);
          connectedWormholeCallback &&
            connectedWormholeCallback(warp[0], warp[1]);
        }
      }
    });
  });
  return warps;
};

function getDistance(from: Location, to: Location, warps: Location[]) {
  if (isWarp(from, to)) {
    const warpFromSystem = warps.find((p) =>
      p.symbol.startsWith(getSystemFromLocationSymbol(from.symbol))
    );
    if (!warpFromSystem) throw new Error("Could not find warpFromSystem");
    const warpTo = warps.find((p) =>
      p.symbol.startsWith(getSystemFromLocationSymbol(to.symbol))
    );
    if (!warpTo) throw new Error("Could not find warpToSystem");

    if (
      (from.symbol === warpFromSystem.symbol && to.symbol === warpTo.symbol) ||
      (from.symbol === warpTo.symbol && to.symbol === warpFromSystem.symbol)
    ) {
      // is WORMHOLE
      //console.log("wormhole!");
      return 0;
    } else {
      // console.log(
      //   `not wormhole: ${from.symbol}>>${to.symbol} (${warpFrom.symbol}>>${warpTo.symbol})`
      // );
    }

    const fromDistance = distancePoint(warpFromSystem, from);
    const toDistance = distancePoint(warpTo, to);

    return fromDistance + toDistance;
  } else {
    //console.log(`not warp: ${from.symbol}>>${to.symbol}`);
  }
  return distancePoint(from, to);
}
