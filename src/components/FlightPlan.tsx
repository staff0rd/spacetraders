import React from "react";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { FlightPlan as FlightPlanType } from "../api/FlightPlan";
import CircularProgressWithLabel from "./CircularProgressWithLabel";
import { getLocation } from "../machines/locationCache";
import ForwardIcon from "@material-ui/icons/Forward";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    textAlign: "right",
  },
  forwardIcon: {
    verticalAlign: "bottom",
  },
}));

type Props = {
  shipId: string;
  flightPlans: FlightPlanType[];
};

const symbolOrName = (symbol: string) => getLocation(symbol)?.name || symbol;

export const FlightPlan = ({ shipId, flightPlans }: Props) => {
  const classes = useStyles();
  const flightPlan = flightPlans.find((fp) => fp.shipId === shipId);
  if (flightPlan)
    return (
      <Box className={classes.root}>
        <Typography>
          {symbolOrName(flightPlan.from)}{" "}
          <ForwardIcon className={classes.forwardIcon} />{" "}
          {symbolOrName(flightPlan.to)}
        </Typography>
        <CircularProgressWithLabel flightPlan={flightPlan} />
      </Box>
    );
  else {
    flightPlans.forEach((fp) =>
      console.warn("no match", shipId, fp.shipId, JSON.stringify(fp))
    );
    return <></>;
  }
};
