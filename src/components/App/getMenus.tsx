import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../../machines/playerMachine";
import { State } from "xstate";
import TradeIcon from "@material-ui/icons/SwapHoriz";
import { Trades } from "../Trades";
import Badge from "@material-ui/core/Badge";
import { SpaceshipIcon } from "./SpaceshipIcon";
import { Ships } from "../Ships";
import { Markets } from "../Markets";
import { Errors } from "../Errors";
import { Locations } from "../Locations";
import { Settings } from "../Settings";
import { NetWorth } from "../NetWorth";
import { Intel } from "../Intel";
import ErrorIcon from "@material-ui/icons/Error";
import MarketsIcon from "@material-ui/icons/Timeline";
import SettingsIcon from "@material-ui/icons/Settings";
import NetWorthIcon from "@material-ui/icons/AccountBalance";
import LocationsIcon from "@material-ui/icons/Language";
import IntelIcon from "@material-ui/icons/Visibility";

export function getMenus(
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null,
  stop: () => any
) {
  const shipCount = state?.context.user?.ships?.length || 0;
  const menu = [
    {
      icon: (
        <Badge color="primary" badgeContent={shipCount}>
          <SpaceshipIcon />
        </Badge>
      ),
      title: "Ships",
      to: "/ships",
      component: (
        <Ships
          state={state}
          availableShips={state?.context.availableShips || []}
        />
      ),
    },
    {
      icon: <LocationsIcon />,
      title: "Locations",
      to: "/locations",
      component: <Locations systems={state?.context.systems || {}} />,
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
      component: <NetWorth lines={state?.context.netWorth || []} />,
    },
    {
      icon: <IntelIcon />,
      title: "Intel",
      to: "/intel",
      component: <Intel />,
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
      component: (
        <Settings
          resetDetected={state?.context.resetDetected || false}
          stop={stop}
        />
      ),
    },
  ];
  return menu;
}
