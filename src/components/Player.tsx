import React, { useState } from "react";
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
import { Locations } from "./Locations";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "row",
    width: 450,
  },
  item: {
    // display: "flex",
    // paddingTop: theme.spacing(0.5),
  },
  icon: {
    //marginRight: theme.spacing(1),
  },
  money: {
    //marginLeft: theme.spacing(1),
  },
}));

export const Player = () => {
  const classes = useStyles();
  const [confirmOpen, setConfirmOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [state, send, service] = useMachine(playerMachine);

  const user = state.context.user;
  const netWorth = state.context.netWorth
    .map((v) => v.value)
    .reduce((a, b) => a + b, 0);

  const handleNew = () => {
    send("CLEAR_PLAYER");
  };

  return (
    <>
      <Paper className={classes.paper}>
        {state.matches("initialising") || state.matches("ready") ? (
          <Grid container>
            <Grid item xs={1}>
              <PersonIcon className={classes.icon} />
            </Grid>
            <Grid item xs={10} className={classes.item}>
              <Typography>{user!.username}</Typography>
              <Typography></Typography>
            </Grid>
            <Grid item xs={1}>
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
            <Grid item xs={1}></Grid>
            <Grid item xs={3}>
              <Typography>Credits</Typography>
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
            <Grid item xs={3}>
              <Typography>Net Worth</Typography>
              <Typography>
                <NumberFormat
                  className={classes.money}
                  value={netWorth}
                  thousandSeparator=","
                  displayType="text"
                  prefix="$"
                />
              </Typography>
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
      {state.context.ships.map((ship, ix) => (
        <Ship key={ix} ship={ship} />
      ))}
      {false && <Locations locations={state.context.locations || {}} />}
    </>
  );
};
