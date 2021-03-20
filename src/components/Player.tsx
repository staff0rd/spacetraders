import React, { useEffect, useState } from "react";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import PersonIcon from "@material-ui/icons/Person";
import RefreshIcon from "@material-ui/icons/Refresh";
import { CircularProgress } from "@material-ui/core";
import { IconButton } from "@material-ui/core";
import { Grid } from "@material-ui/core";
import { ConfirmDialog } from "./ConfirmDialog";
import { playerMachine } from "../machines/playerMachine";
import { useMachine } from "@xstate/react";
import NumberFormat from "react-number-format";
import Ship from "./Ship";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "row",
    width: 450,
  },
  item: {
    display: "flex",
    paddingTop: theme.spacing(0.5),
  },
  icon: {
    marginRight: theme.spacing(1),
  },
  money: {
    marginLeft: theme.spacing(1),
  },
}));

export const Player = () => {
  const classes = useStyles();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [state, send, service] = useMachine(playerMachine);

  const user = state.context.user;

  const handleNew = () => {
    send("CLEAR_PLAYER");
  };

  useEffect(() => {
    const subscription = service.subscribe((state) => {
      // simple state logging
      console.log(state);
    });

    return subscription.unsubscribe;
  }, [service]); // note: service should never change

  return (
    <>
      <Paper className={classes.paper}>
        {state.matches("initialising") || state.matches("ready") ? (
          <Grid container justify="space-between">
            <Grid item className={classes.item}>
              <PersonIcon className={classes.icon} />
              <Typography>{user!.username}</Typography>
              <Typography>
                <NumberFormat
                  className={classes.money}
                  value={user!.credits}
                  thousandSeparator=","
                  displayType="text"
                  prefix="$"
                />
              </Typography>
            </Grid>
            <Grid item>
              {state.matches("ready") && (
                <IconButton
                  size="small"
                  title="New user"
                  onClick={() => setConfirmOpen(true)}
                >
                  <RefreshIcon />
                </IconButton>
              )}
            </Grid>
          </Grid>
        ) : (
          <CircularProgress size={24} />
        )}
      </Paper>
      <ConfirmDialog
        header="Create new user?"
        content="API key will be lost!"
        setOpen={setConfirmOpen}
        open={confirmOpen}
        action={handleNew}
      />
      {(state.context.user?.ships || []).map((ship, ix) => (
        <Ship
          key={ix}
          ship={ship}
          flightPlans={state.context.flightPlans || []}
        />
      ))}
    </>
  );
};
