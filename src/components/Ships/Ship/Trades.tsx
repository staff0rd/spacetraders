import React from "react";
import { useLiveQuery } from "dexie-react-hooks";
import db from "data";
import { TradesDataTable } from "components/Trades/TradesDataTable";

type Props = {
  shipId: string;
};

export const Trades = ({ shipId }: Props) => {
  const trades = useLiveQuery(
    () =>
      db.trades.where("shipId").equals(shipId).reverse().limit(50).toArray(),
    [shipId]
  );

  return <TradesDataTable trades={trades} />;
};
