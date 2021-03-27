import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../machines/playerMachine";
import { State } from "xstate";
import TradeIcon from "@material-ui/icons/SwapHoriz";
import React from "react";
import Badge from "@material-ui/core/Badge";
import { SpaceshipIcon } from "./SpaceshipIcon";
import GitHubIcon from "@material-ui/icons/GitHub";
import { Ships } from "./Ships";
import { AvailableShips } from "./AvailableShips";
import { Trades } from "./Trades";
import { Markets } from "./Markets";
import { Errors } from "./Errors";
import { Locations } from "./Locations";
import { Settings } from "./Settings";
import { NetWorth } from "./NetWorth";
import ErrorIcon from "@material-ui/icons/Error";
import MarketsIcon from "@material-ui/icons/Timeline";
import SettingsIcon from "@material-ui/icons/Settings";
import NetWorthIcon from "@material-ui/icons/AccountBalance";
import LocationsIcon from "@material-ui/icons/Language";

export function getMenus(
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema>,
  handleClearPlayer: () => void
) {
  const shipCount = state.context.user?.ships?.length || 0;
  const menu = [
    {
      icon: (
        <Badge color="primary" badgeContent={shipCount}>
          <SpaceshipIcon />
        </Badge>
      ),
      title: "Ships",
      to: "/ships",
      component: <Ships ships={state.context.ships} />,
    },
    {
      icon: (
        <Badge
          color="primary"
          badgeContent={state.context.availableShips.length}
        >
          <SpaceshipIcon />
        </Badge>
      ),
      title: "Available",
      to: "/available-ships",
      component: (
        <AvailableShips availableShips={state.context.availableShips} />
      ),
    },
    {
      icon: <LocationsIcon />,
      title: "Locations",
      to: "/locations",
      component: <Locations locations={state.context.locations} />,
    },
    {
      icon: <TradeIcon />,
      title: "Trades",
      to: "/trades",
      component: <Trades />,
    },
    {
      icon: <MarketsIcon />,
      title: "Markets",
      to: "/markets",
      component: <Markets />,
    },
    {
      icon: <NetWorthIcon />,
      title: "Net Worth",
      to: "/net-worth",
      component: <NetWorth lines={state.context.netWorth} />,
    },
    {
      icon: <ErrorIcon />,
      title: "Errors",
      to: "/errors",
      component: <Errors />,
    },
    {
      icon: <SettingsIcon />,
      title: "Settings",
      to: "/settings",
      component: <Settings handleClearPlayer={handleClearPlayer} />,
    },
  ];

  const bottomMenu = [
    {
      icon: <GitHubIcon />,
      title: "Source",
      href: "https://github.com/staff0rd/spacetraders",
    },
  ];
  return { menu, bottomMenu };
}
