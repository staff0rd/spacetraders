import React, { useEffect, useState } from "react";
import { AvailableShips } from "./AvailableShips";
import { AvailableShip } from "../../api/AvailableShip";
import { Strategy } from "../Strategy";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../../machines/playerMachine";
import { useLocation } from "react-router-dom";
import Ship from "./Ship";
import db from "../../data";
import { TabPanel, TabProps } from "../TabPanel";

type Props = {
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null;
  availableShips: AvailableShip[];
};

export const Ships = ({ state, availableShips }: Props) => {
  const { pathname } = useLocation() as any;
  const [shipName, setShipName] = useState("");

  const shipId = pathname.startsWith("/ships/owned/")
    ? (pathname as string).substring(13)
    : undefined;

  useEffect(() => {
    if (shipId) {
      db.shipDetail
        .get(shipId)
        .then((detail) => detail && setShipName(detail.name));
    } else setShipName("");
  }, [shipId]);

  const tabs: TabProps[] = [
    {
      label: "Owned",
      path: "/ships/owned",
      component: <Strategy state={state} />,
    },
    {
      label: "Available",
      path: "/ships/available",
      component: <AvailableShips availableShips={availableShips} />,
    },
    ...(shipId
      ? [
          {
            label: shipName,
            path: pathname,
            route: "/ships/owned/:shipId",
            component: (
              <Ship
                ship={state?.context.actors.find(
                  (x) => x.state.context.id === shipId
                )}
              />
            ),
          },
        ]
      : []),
  ];
  return <TabPanel tabs={tabs} />;
};
