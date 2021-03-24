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
  flightPlan: FlightPlanType;
};

const symbolOrName = (symbol: string) => getLocation(symbol)?.name || symbol;

export const FlightPlan = ({ flightPlan }: Props) => {
  const classes = useStyles();
  if (flightPlan)
    return (
      <Box className={classes.root}>
        <CircularProgressWithLabel flightPlan={flightPlan} />
        <Typography>
          {symbolOrName(flightPlan.from)}{" "}
          <ForwardIcon className={classes.forwardIcon} />{" "}
          {symbolOrName(flightPlan.to)}
        </Typography>
      </Box>
    );
  else {
    return <></>;
  }
};
