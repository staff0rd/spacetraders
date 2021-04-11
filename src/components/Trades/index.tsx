import { TabPanel, TabProps } from "../TabPanel";
import { TradeList } from "./TradeList";
import { Markets } from "./Markets";
import { Current } from "./Current";
import { Best } from "./Best";
import { SystemContext } from "machines/MarketContext";

type Props = { systems?: SystemContext };

export const Trades = ({ systems }: Props) => {
  const tabs: TabProps[] = [
    {
      label: "Trades",
      path: "/trades",
      component: <TradeList systems={systems} />,
    },
    {
      label: "Markets",
      path: "/trades/markets",
      component: <Markets systems={systems} />,
    },
    {
      label: "Current",
      path: "/trades/current",
      component: <Current systems={systems} />,
    },
    {
      label: "Best",
      path: "/trades/best",
      component: <Best systems={systems} />,
    },
  ];
  return <TabPanel tabs={tabs} />;
};
