import { TabProps, TabPanel } from "components/TabPanel";
import { useLocation } from "react-router-dom";
import { Users } from "./Users";
import { User } from "./User";

export const Intel = () => {
  const { pathname } = useLocation() as any;

  const username = pathname.startsWith("/intel/")
    ? (pathname as string).substring(7)
    : undefined;

  const tabs: TabProps[] = [
    {
      label: "Users",
      path: "/intel",
      component: <Users />,
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
