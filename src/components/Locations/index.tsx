import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { TabPanel, TabProps } from "../TabPanel";
import { SystemContext } from "../../machines/MarketContext";
import { CircularProgress } from "@material-ui/core";
import { LocationList } from "./LocationList";
import { Map } from "./Map";
import { Location } from "./Location";
import { Structures } from "./Structures";
import { FuelCalcs } from "./FuelCalcs";

type Props = {
  systems?: SystemContext;
};

export const Locations = ({ systems }: Props) => {
  const { pathname } = useLocation() as any;
  const [locationName, setLocationName] = useState("");

  const symbol =
    pathname.startsWith("/locations/") &&
    !pathname.includes("map") &&
    pathname !== "/locations/fuel" &&
    !pathname.includes("structures")
      ? (pathname as string).substring(11)
      : undefined;

  useEffect(() => {
    if (systems && symbol) {
      const locations = Object.keys(systems)
        .map((systemSymbol) =>
          Object.keys(systems[systemSymbol]).map((key) => {
            const location = systems[systemSymbol][key];
            return location;
          })
        )
        .flat();
      const location = locations.find((p) => p.symbol === symbol);
      if (location) setLocationName(location.name);
    } else setLocationName("");
  }, [systems, symbol]);

  if (!systems || !Object.keys(systems).length)
    return <CircularProgress size={48} />;

  const tabs: TabProps[] = [
    {
      label: "Locations",
      path: "/locations",
      component: <LocationList systems={systems} />,
    },
    {
      label: "Map",
      path: "/locations/map",
      component: <Map systems={systems} />,
    },
    {
      label: "Fuel Calcs",
      path: "/locations/fuel",
      component: <FuelCalcs />,
    },
    {
      label: "Structures",
      path: "/locations/structures",
      component: <Structures />,
    },

    ...(symbol
      ? [
          {
            label: locationName,
            path: pathname,
            route: `/locations/:symbol`,
            component: <Location symbol={symbol} />,
          },
        ]
      : []),
  ];
  return <TabPanel tabs={tabs} />;
};
