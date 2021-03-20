import React from "react";
import CircularProgress, {
  CircularProgressProps,
} from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import { FlightPlan } from "../api/FlightPlan";
import { DateTime } from "luxon";

function CircularProgressWithLabel(
  props: CircularProgressProps & { value: number }
) {
  return (
    <Box position="relative" display="inline-flex">
      <CircularProgress variant="determinate" {...props} />
      <Box
        top={0}
        left={0}
        bottom={0}
        right={0}
        position="absolute"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Typography
          variant="caption"
          component="div"
          color="textSecondary"
        >{`${Math.round(props.value)}%`}</Typography>
      </Box>
    </Box>
  );
}

type Props = {
  flightPlan: FlightPlan;
};

export default function CircularStatic({ flightPlan }: Props) {
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

  return <CircularProgressWithLabel value={progress} />;
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
