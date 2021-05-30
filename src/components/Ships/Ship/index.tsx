import {
  Button,
  CircularProgress,
  Tab,
  Tabs,
  Typography,
} from "@material-ui/core";
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

import { StrategyChange } from "components/Strategy/StrategyChange";

import { Trades } from "./Trades";
import { Requests } from "./Requests";
import { Orders } from "./Orders";
import Dexie from "dexie";
import * as api from "api";
import { getLocalUser } from "data/localStorage/getLocalUser";
import { getOrderLabel, getShip } from "data/localStorage/shipCache";
import { ShipOrders } from "data/IShipOrder";

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

  const query = useLiveQuery(
    async () => ({
      flightPlan: await db.flightPlans.get(shipId),
      detail: await db.shipDetail.get(shipId),
      ship: getShip(shipId),
      probe: await db.probes.where("shipId").equals(shipId).first(),
      tradeData: await db.tradeData
        .where("[shipId+created+complete]")
        .between(
          [shipId, Dexie.minKey, Dexie.minKey],
          [shipId, Dexie.maxKey, Dexie.maxKey]
        )
        .reverse()
        .first(),
    }),
    [shipId]
  );

  if (!query) return <CircularProgress size={48} />;

  const { token, username } = getLocalUser()!;
  const sellCargo = () => {
    query?.ship?.cargo.map((c) =>
      api.sellOrder(
        token!,
        username,
        query!.ship!.id,
        c!.good,
        c.quantity,
        query.ship.location!.symbol
      )
    );
  };

  const cachedShip = getShip(shipId);

  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box>
            <Typography variant="h6">{query.detail!.name}</Typography>
            <Typography>{query.ship.type}</Typography>
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
          <Button
            variant="contained"
            color="primary"
            onClick={() => sellCargo()}
          >
            Sell cargo
          </Button>
        </Grid>
        <Grid item xs={6}>
          <Box>
            <Typography variant="h6">State</Typography>
            <Box className={classes.strategy}>
              <Typography>{getOrderLabel(query.ship.orders)}</Typography>
              {query &&
                query.probe &&
                cachedShip.orders[0].order === ShipOrders.Probe && (
                  <div className={classes.probeLabel}>
                    {query.probe.location}
                  </div>
                )}

              <StrategyChange ship={cachedShip} />
            </Box>
            <FlightProgress
              flightPlan={query.flightPlan}
              fallback={
                <>
                  {query.ship?.location?.symbol || ""} {actor?.state.value}{" "}
                </>
              }
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Cargo ship={query.ship} />
        </Grid>
      </Grid>
      <Tabs value={tab} onChange={handleTabChange}>
        <Tab label="Trades" />
        <Tab label="Orders" />
        <Tab label="Requests" />
      </Tabs>
      {tab === 0 && <Trades shipId={shipId} />}
      {tab === 1 && <Orders shipId={shipId} />}
      {tab === 2 && <Requests shipId={shipId} />}
    </>
  );
};

export default ShipComponent;
