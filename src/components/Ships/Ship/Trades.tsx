import React from "react";
import { TradeRoutes } from "components/Trades/TradeRoutes";

type Props = {
  shipId: string;
};

export const Trades = ({ shipId }: Props) => {
  return <TradeRoutes shipId={shipId} />;
};
