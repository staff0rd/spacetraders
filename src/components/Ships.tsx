import CircularProgress from "@material-ui/core/CircularProgress";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import { ShipActor } from "../machines/Ship/tradeMachine";
import Ship from "./Ship";

const useStyles = makeStyles((theme) => ({
  loading: {
    marginLeft: theme.spacing(1),
  },
  ship: {
    height: "100%",
    alignItems: "stretch",
  },
}));

type Props = {
  ships: ShipActor[];
};

export const Ships = ({ ships }: Props) => {
  const classes = useStyles();
  return (
    <Grid container spacing={1}>
      {ships.length ? (
        ships.map((ship, ix) => (
          <Grid key={ix} item xs={12} sm={6} md={3} className={classes.ship}>
            <Ship ship={ship} />
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <CircularProgress
            className={classes.loading}
            color="primary"
            size={48}
          />
        </Grid>
      )}
    </Grid>
  );
};
