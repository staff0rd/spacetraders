import React from "react";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { FlightPlan as FlightPlanType } from "../../api/FlightPlan";
import FlightProgress from "./FlightProgress";
import { getLocation } from "../../machines/locationCache";
import ForwardIcon from "@material-ui/icons/Forward";
import { makeStyles } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {},
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
        <FlightProgress flightPlan={flightPlan} />
        <Typography>
          {symbolOrName(flightPlan.departure)}{" "}
          <ForwardIcon className={classes.forwardIcon} />{" "}
          {symbolOrName(flightPlan.destination)}
        </Typography>
      </Box>
    );
  else {
    return <></>;
  }
};
