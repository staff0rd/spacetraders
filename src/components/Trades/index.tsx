import { TabPanel, TabProps } from "../TabPanel";
import { TradeList } from "./TradeList";
import { Markets } from "./Markets";

export const Trades = () => {
  const tabs: TabProps[] = [
    {
      label: "Trades",
      path: "/trades",
      component: <TradeList />,
    },
    {
      label: "Markets",
      path: "/trades/markets",
      component: <Markets />,
    },
  ];
  return <TabPanel tabs={tabs} />;
};
