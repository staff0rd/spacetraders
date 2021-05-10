import { TabPanel, TabProps } from "../TabPanel";
import { TradeList } from "./TradeList";
import { Markets } from "./Markets";
import { Current } from "./Current";
import { Best } from "./Best";
import { SystemContext } from "machines/MarketContext";
import { Trades as TradesNew } from "./Trades";
import { AvailableShip } from "api/AvailableShip";

type Props = { systems?: SystemContext; availableShips: AvailableShip[] };

export const Trades = ({ systems, availableShips }: Props) => {
  const tabs: TabProps[] = [
    {
      label: "Trades",
      path: "/trades",
      component: <TradeList />,
    },
    {
      label: "Trades (New)",
      path: "/trades/new",
      component: <TradesNew />,
    },
    {
      label: "Best",
      path: "/trades/best",
      component: <Best availableShips={availableShips} />,
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
  ];
  return <TabPanel tabs={tabs} />;
};
