import React from "react";
import Typography from "@material-ui/core/Typography";
import { FlightPlan as FlightPlanType } from "../api/FlightPlan";
import CircularProgressWithLabel from "./CircularProgressWithLabel";

type Props = {
  shipId: string;
  flightPlans: FlightPlanType[];
};

export const FlightPlan = ({ shipId, flightPlans }: Props) => {
  console.warn("flightPlans", flightPlans, "shipId", shipId);
  const flightPlan = flightPlans.find((fp) => fp.shipId === shipId);
  if (flightPlan)
    return (
      <>
        <Typography>
          {flightPlan.from} {`->`} {flightPlan.to}
        </Typography>
        <CircularProgressWithLabel flightPlan={flightPlan} />
      </>
    );
  else {
    flightPlans.forEach((fp) =>
      console.warn("no match", shipId, fp.shipId, JSON.stringify(fp))
    );
    return <></>;
  }
};
