import { makeStyles, Paper, Typography } from "@material-ui/core";
import React from "react";
import { Ship } from "../api/Ship";
import { FlightPlan as FlightPlanSchema } from "../api/FlightPlan";
import { FlightPlan } from "./FlightPlan";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: 450,
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
      <Typography>{ship.type}</Typography>
      <FlightPlan shipId={ship.id} flightPlans={flightPlans} />
    </Paper>
  );
};

export default ShipComponent;
