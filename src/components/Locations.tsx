import {
  FormControl,
  InputLabel,
  makeStyles,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@material-ui/core";
import React from "react";
import { Location } from "./Location";

import { MarketContext } from "../machines/MarketContext";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "column",
    //  justifyContent: "space-between",
    width: 450,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  formControl: {
    margin: theme.spacing(1),
    width: 120,
  },
}));

type Props = {
  locations: MarketContext;
};

export const Locations = ({ locations }: Props) => {
  const classes = useStyles();
  const [location, setLocation] = React.useState("OE-PM");

  const handleChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setLocation(event.target.value as string);
  };

  const locationPayload = Object.values(locations).find(
    (p) => p.symbol === location
  );

  return (
    <Paper className={classes.paper}>
      <div className={classes.header}>
        <Typography variant="h5">{locationPayload?.name}</Typography>
        <FormControl className={classes.formControl}>
          <InputLabel id="location-select-label">Location</InputLabel>
          <Select
            labelId="location-select-label"
            id="location-select"
            value={location}
            onChange={handleChange}
          >
            {Object.values(locations).map((lo, ix) => (
              <MenuItem key={ix} value={lo.symbol}>
                {lo.symbol}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>
      {locationPayload && <Location location={locationPayload} />}
    </Paper>
  );
};
