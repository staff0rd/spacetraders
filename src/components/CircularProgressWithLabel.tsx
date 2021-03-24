import React from "react";
import { FlightPlan } from "../api/FlightPlan";
import { DateTime } from "luxon";
import { LinearProgress } from "@material-ui/core";

type Props = {
  flightPlan: FlightPlan;
};

export default function LinearStatic({ flightPlan }: Props) {
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

  return <LinearProgress variant="determinate" value={progress} />;
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
