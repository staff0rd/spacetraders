import Badge from "@material-ui/core/Badge";
import ErrorIcon from "@material-ui/icons/Error";
import { useState } from "react";
import { useInterval } from "components/useInterval";
import db from "data";
import { DateTime } from "luxon";

export const ErrorComponent = () => {
  const [errorCount, setErrorCount] = useState<number>(0);

  useInterval(async () => {
    const count = await db.apiErrors
      .where("created")
      .above(DateTime.local().minus({ minutes: 15 }).toISO())
      .count();
    setErrorCount(count);
  }, 10000);

  return (
    <Badge color="secondary" badgeContent={errorCount}>
      <ErrorIcon />
    </Badge>
  );
};
