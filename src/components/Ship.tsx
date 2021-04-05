import { CircularProgress, makeStyles, Typography } from "@material-ui/core";
import React from "react";
import { FlightPlan } from "./FlightPlan";
import { Grid } from "@material-ui/core";
import { Box } from "@material-ui/core";
import Cargo from "./Cargo";
import { ShipActor } from "../machines/Ship/tradeMachine";
import { useLiveQuery } from "dexie-react-hooks";
import db from "../data";
import { TradesDataTable } from "./Trades/TradesDataTable";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: {
    display: "flex",
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  state: {},
}));

type Props = {
  ship?: ShipActor;
};

export const ShipComponent = ({ ship: actor }: Props) => {
  const classes = useStyles();
  const shipId = actor?.state.context.id;

  const trades = useLiveQuery(
    () =>
      db.trades
        .where("shipId")
        .equals(shipId || "")
        .reverse()
        .limit(20)
        .toArray(),
    [shipId]
  );

  if (!actor) return <CircularProgress size={48} />;

  return (
    <>
      {actor.state ? (
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Box>
              <Typography variant="h6">Name</Typography>
              <Typography>{actor.state.context.shipName}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="h6">Type</Typography>
              <Typography>{actor.state.context.ship?.type}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            <Box>
              <Typography variant="h6">State</Typography>
              {actor.state.context.flightPlan ? (
                <FlightPlan flightPlan={actor.state.context.flightPlan!} />
              ) : (
                <Typography className={classes.state}>
                  {actor.state.value}
                </Typography>
              )}
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
