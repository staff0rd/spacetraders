import {
  CircularProgress,
  makeStyles,
  Paper,
  Typography,
} from "@material-ui/core";
import React from "react";
import { FlightPlan } from "./FlightPlan";
import { Grid } from "@material-ui/core";
import { Box } from "@material-ui/core";
import Cargo from "./Cargo";
import { SpaceshipIcon } from "./App/SpaceshipIcon";
import { ShipActor } from "../machines/Ship/tradeMachine";

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
          <Grid item xs={6}>
            <Box className={classes.name}>
              <SpaceshipIcon className={classes.icon} fontSize="small" />
              <Typography>{actor.state.context.ship!.type}</Typography>
            </Box>
          </Grid>
          <Grid item xs={6}>
            {actor.state.value === "inFlight" ? (
              <FlightPlan flightPlan={actor.state.context.flightPlan!} />
            ) : (
              <Typography className={classes.state}>
                {actor.state.value}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12}>
            <Cargo ship={actor.state.context.ship} />
          </Grid>
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
