import {
  CircularProgress,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core";
import React from "react";
import { FlightPlan } from "./FlightPlan";
import { Grid } from "@material-ui/core";
import Cargo from "./Cargo";
import FlightIcon from "@material-ui/icons/Flight";
import { ShipActor } from "../machines/shipMachine";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: 450,
  },
  flightIcon: {
    rotation: "90deg",
  },
  state: {
    textAlign: "right",
  },
}));

type Props = {
  ship: ShipActor;
};

export const ShipComponent = ({ ship: actor }: Props) => {
  const classes = useStyles();

  return (
    <Paper className={classes.paper}>
      {actor.state ? (
        <Grid container>
          <Grid item xs={1}>
            <FlightIcon className={classes.flightIcon} />
          </Grid>
          <Grid item xs={6}>
            <Typography>
              {actor.state.context.ship.type} (
              {actor.state.context.ship.maxCargo -
                actor.state.context.ship.spaceAvailable}
              /{actor.state.context.ship.maxCargo})
            </Typography>
            <Cargo ship={actor.state.context.ship} />
          </Grid>
          <Grid item xs={5}>
            {actor.state.value === "inFlight" ? (
              <FlightPlan flightPlan={actor.state.context.flightPlan!} />
            ) : (
              <Typography className={classes.state}>
                {actor.state.value}
              </Typography>
            )}
          </Grid>
          <Grid item xs={1}></Grid>
        </Grid>
      ) : (
        <div>
          {actor.id}
          <CircularProgress size={24} />
        </div>
      )}
    </Paper>
  );
};

export default ShipComponent;
