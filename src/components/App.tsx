import React from "react";

import MainToolbar from "./MainToolbar";

import { playerMachine } from "../machines/playerMachine";
import { useMachine } from "@xstate/react";
import Ship from "./Ship";
import { Grid, makeStyles, CircularProgress } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  root: {
    backgroundColor: "#282c34",
    minHeight: "100vh",
  },
  grid: {
    marginTop: theme.spacing(1),
  },
  loading: {
    marginLeft: theme.spacing(1),
  },
  ship: {
    height: "100%",
    alignItems: "stretch",
  },
}));

function App() {
  const classes = useStyles();
  const [state, send, service] = useMachine(playerMachine);

  const handleClearPlayer = () => {
    send("CLEAR_PLAYER");
  };

  const shipCount = state.context.user?.ships?.length || 0;
  const credits = state.context.user?.credits || 0;
  const netWorth = state.context.netWorth
    .map((v) => v.value)
    .reduce((a, b) => a + b, 0);

  return (
    <div className={classes.root}>
      <MainToolbar
        handleClearPlayer={handleClearPlayer}
        rootState={state.value}
        shipCount={shipCount}
        userName={state.context.user?.username || ""}
        credits={credits}
        netWorth={netWorth}
      />

      <Grid className={classes.grid} container spacing={1}>
        {state.context.ships.length ? (
          state.context.ships.map((ship, ix) => (
            <Grid item xs={12} sm={6} md={3} className={classes.ship}>
              <Ship key={ix} ship={ship} />
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <CircularProgress
              className={classes.loading}
              color="secondary"
              size={48}
            />
          </Grid>
        )}
      </Grid>
    </div>
  );
}

export default App;
