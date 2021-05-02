import { TabProps, TabPanel } from "components/TabPanel";
import { useLocation } from "react-router-dom";
import { Users } from "./Users";
import { User } from "./User";
import { Leaderboard } from "./Leaderboard";

export const Intel = () => {
  const { pathname } = useLocation() as any;

  const username =
    pathname.startsWith("/intel/") && !pathname.startsWith("/intel/leaderboard")
      ? (pathname as string).substring(7)
      : undefined;

  const tabs: TabProps[] = [
    {
      label: "Users",
      path: "/intel",
      component: <Users />,
    },
    {
      label: "Leaderboard",
      path: "/intel/leaderboard",
      component: <Leaderboard />,
    },
    ...(username
      ? [
          {
            label: username,
            path: pathname,
            route: "/intel/:username",
            component: <User username={username} />,
          },
        ]
      : []),
  ];
  return <TabPanel tabs={tabs} />;
};
