import { TabPanel, TabProps } from "../TabPanel";
import { TradeList } from "./TradeList";
import { Markets } from "./Markets";
import { Current } from "./Current";

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
    {
      label: "Current",
      path: "/trades/current",
      component: <Current />,
    },
  ];
  return <TabPanel tabs={tabs} />;
};
