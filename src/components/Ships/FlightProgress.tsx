import React from "react";
import { FlightPlan } from "../../api/FlightPlan";
import { DateTime } from "luxon";
import { LinearProgress, makeStyles, Typography } from "@material-ui/core";
import { getLocation } from "data/localStorage/locationCache";

const useStyles = makeStyles((theme) => ({
  flightPlanText: {
    fontSize: 14,
  },
}));

type Props = {
  flightPlan: FlightPlan;
};

export default function LinearStatic({ flightPlan }: Props) {
  const classes = useStyles();
  const [progress, setProgress] = React.useState(getProgress(flightPlan));

  React.useEffect(() => {
    const timer = setInterval(() => {
      const value = getProgress(flightPlan);
      setProgress(value);
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [flightPlan]);

  if (DateTime.fromISO(flightPlan.arrivesAt) > DateTime.local())
    return (
      <>
        <Typography className={classes.flightPlanText}>
          {flightPlan.destination}{" "}
          {DateTime.fromISO(flightPlan.arrivesAt).toRelative()}
        </Typography>
        <LinearProgress variant="determinate" value={progress} />
      </>
    );
  else
    return (
      <Typography className={classes.flightPlanText}>
        {getLocation(flightPlan.destination).name}
      </Typography>
    );
}

function getProgress(flightPlan: FlightPlan) {
  const createdAt = DateTime.fromISO(flightPlan.createdAt);
  const arrivesAt = DateTime.fromISO(flightPlan.arrivesAt);
  const diff = createdAt.diff(arrivesAt, "seconds");
  const total = Math.abs(diff.toObject().seconds!);
  const secondsLeft = DateTime.fromISO(flightPlan.arrivesAt).diffNow("seconds")
    .seconds;
  const value = 100 - (secondsLeft / total) * 100;
  return value;
}
