import { makeStyles, Paper, Typography } from "@material-ui/core";
import React from "react";
import { Ship } from "../api/Ship";
import { FlightPlan as FlightPlanSchema } from "../api/FlightPlan";
import { FlightPlan } from "./FlightPlan";
import { Grid } from "@material-ui/core";
import Cargo from "./Cargo";
import FlightIcon from "@material-ui/icons/Flight";

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
}));

type Props = {
  ship: Ship;
  flightPlans: FlightPlanSchema[];
};

export const ShipComponent = ({ ship, flightPlans }: Props) => {
  const classes = useStyles();
  return (
    <Paper className={classes.paper}>
      <Grid container>
        <Grid item xs={1}>
          <FlightIcon className={classes.flightIcon} />
        </Grid>
        <Grid item xs={6}>
          <Typography>{ship.type}</Typography>
          <Cargo ship={ship} />
        </Grid>
        <Grid item xs={5}>
          <FlightPlan shipId={ship.id} flightPlans={flightPlans} />
        </Grid>
        <Grid item xs={1}></Grid>
      </Grid>
    </Paper>
  );
};

export default ShipComponent;
