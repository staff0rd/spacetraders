import { CircularProgress, Typography } from "@material-ui/core";
import React from "react";
import FlightProgress from "./FlightProgress";
import { Grid } from "@material-ui/core";
import { Box } from "@material-ui/core";
import Cargo from "./Cargo";
import { ShipActor } from "../../machines/Ship/tradeMachine";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../../data";
import { TradesDataTable } from "../Trades/TradesDataTable";
import { DebugCheckbox } from "../Settings/DebugCheckbox";
import { getDebug, setDebug } from "../../data/localStorage/IDebug";
import { SystemContext } from "machines/MarketContext";
import { Strategy } from "./Strategy";

type Props = {
  ship?: ShipActor;
  systems?: SystemContext;
};

export const ShipComponent = ({ ship: actor, systems }: Props) => {
  const shipId = actor?.state.context.id;

  const ship = useLiveQuery(
    async () => ({
      flightPlan: shipId ? await db.flightPlans.get(shipId) : undefined,
      strategy: await db.strategies.get(shipId || ""),
    }),
    [shipId]
  );

  const trades = useLiveQuery(
    () =>
      db.trades
        .where("shipId")
        .equals(shipId || "")
        .reverse()
        .limit(50)
        .toArray(),
    [shipId]
  );

  if (!actor || !actor.state.context.id) return <CircularProgress size={48} />;

  return (
    <>
      {actor.state ? (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box>
              <Typography variant="h6">
                {actor.state.context.shipName}
              </Typography>
              <Typography>{actor.state.context.ship?.type}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <DebugCheckbox
              title="Focus"
              initialValue={getDebug().focusShip === actor.state.context.id}
              persist={(value) =>
                value
                  ? setDebug({ focusShip: actor.state.context.id })
                  : setDebug({ focusShip: undefined })
              }
            />
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="h6">State</Typography>
              <Strategy strategy={ship?.strategy} />

              <FlightProgress
                flightPlan={ship?.flightPlan}
                fallback={actor.state.value}
              />
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Cargo ship={actor.state.context.ship} />
          </Grid>
          <Grid item xs={12}>
            <Box>
              <Typography variant="h6">Recent trades</Typography>
              <TradesDataTable
                trades={trades}
                getShipName={(_) => actor.state.context.shipName}
                systems={systems}
              />
            </Box>
          </Grid>
        </Grid>
      ) : (
        <div>
          <CircularProgress size={48} />
        </div>
      )}
    </>
  );
};

export default ShipComponent;
