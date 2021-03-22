import React from "react";
import DnsIcon from "@material-ui/icons/Dns";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import Grid from "@material-ui/core/Grid";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";
import { useMachine } from "@xstate/react";
import { apiPollMachine } from "../machines/apiPollMachine";
import { getStatus } from "../api";

const statusMachine = apiPollMachine(getStatus);

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "row",
    width: 450,
  },
}));

export const Status = () => {
  const classes = useStyles();

  const [state] = useMachine(statusMachine);

  return (
    <Paper className={classes.paper}>
      {state.matches("success") ? (
        <Grid container>
          <Grid item xs={1}>
            <DnsIcon />
          </Grid>
          <Grid item xs={11}>
            <Typography>{state.context.result.status}</Typography>
          </Grid>
        </Grid>
      ) : (
        <CircularProgress size={24} />
      )}
    </Paper>
  );
};
