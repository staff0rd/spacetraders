import { TabPanel, TabProps } from "../TabPanel";
import { Markets } from "./Markets";
import { Best } from "./Best";
import { SystemContext } from "machines/MarketContext";
import { TradeRoutes } from "./TradeRoutes";
import { AvailableShip } from "api/AvailableShip";

type Props = { systems?: SystemContext; availableShips: AvailableShip[] };

export const Trades = ({ systems, availableShips }: Props) => {
  const tabs: TabProps[] = [
    {
      label: "Trades",
      path: "/trades",
      component: <TradeRoutes />,
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
  ];
  return <TabPanel tabs={tabs} />;
};
