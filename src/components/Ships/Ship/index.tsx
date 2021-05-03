import { CircularProgress, Tab, Tabs, Typography } from "@material-ui/core";
import React from "react";
import FlightProgress from "../FlightProgress";
import { Grid } from "@material-ui/core";
import { Box, makeStyles } from "@material-ui/core";
import Cargo from "../Cargo";
import { ShipActor } from "machines/Ship/tradeMachine";
import { useLiveQuery } from "dexie-react-hooks";
import db from "data";
import { DebugCheckbox } from "components/Settings/DebugCheckbox";
import { getDebug, setDebug } from "data/localStorage/getDebug";
import { SystemContext } from "machines/MarketContext";
import { Strategy } from "../Strategy";
import { StrategyChange } from "components/Strategy/StrategyChange";
import { ShipStrategy } from "data/Strategy/ShipStrategy";
import { Trades } from "./Trades";
import { Requests } from "./Requests";

const useStyles = makeStyles((theme) => ({
  strategy: {
    display: "flex",
  },
  probeLabel: { marginTop: 2, marginLeft: theme.spacing(1) },
}));

type Props = {
  shipId: string;
  actor?: ShipActor;
  systems?: SystemContext;
};

export const ShipComponent = ({ shipId, actor, systems }: Props) => {
  const classes = useStyles();
  const [tab, setTab] = React.useState(0);
  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTab(newValue);
  };

  const ship = useLiveQuery(
    async () => ({
      flightPlan: await db.flightPlans.get(shipId),
      strategy: await db.strategies.get(shipId),
      detail: await db.shipDetail.get(shipId),
      ship: await db.ships.get(shipId),
      probe: await db.probes.where("shipId").equals(shipId).first(),
      tradeRoute: await db.tradeRoutes.where("shipId").equals(shipId).first(),
    }),
    [shipId]
  );

  if (!ship) return <CircularProgress size={48} />;

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box>
            <Typography variant="h6">{ship.detail!.name}</Typography>
            <Typography>{ship.ship?.type}</Typography>
          </Box>
        </Grid>
        <Grid item xs={6}>
          <DebugCheckbox
            title="Focus"
            initialValue={getDebug().focusShip === shipId}
            persist={(value) =>
              value
                ? setDebug({ focusShip: shipId })
                : setDebug({ focusShip: undefined })
            }
          />
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="h6">State</Typography>
            <Box className={classes.strategy}>
              <Strategy strategy={ship?.strategy} />
              {ship &&
                ship.probe &&
                ship.strategy &&
                ship.strategy.strategy === ShipStrategy.Probe && (
                  <div className={classes.probeLabel}>
                    {ship.probe.location}
                  </div>
                )}
              {ship && ship.strategy && (
                <StrategyChange
                  ship={{
                    id: shipId,
                    strategy: ShipStrategy[ship!.strategy!.strategy],
                  }}
                />
              )}
            </Box>
            <FlightProgress
              flightPlan={ship.flightPlan}
              fallback={
                <>
                  {ship.ship?.location || ""} {actor?.state.value}{" "}
                </>
              }
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Cargo ship={ship!.ship} />
        </Grid>
      </Grid>
      <Tabs value={tab} onChange={handleTabChange}>
        <Tab label="Recent trades" />
        <Tab label="Last trade route" />
        <Tab label="Recent Requests" />
      </Tabs>
      {tab === 0 && <Trades shipId={shipId} />}
      {tab === 1 && <pre>{JSON.stringify(ship.tradeRoute, null, 2)}</pre>}
      {tab === 2 && <Requests shipId={shipId} />}
    </>
  );
};

export default ShipComponent;