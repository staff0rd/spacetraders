import React from "react";
import DnsIcon from "@material-ui/icons/Dns";
import Badge from "@material-ui/core/Badge";
import CircularProgress from "@material-ui/core/CircularProgress";
import { makeStyles } from "@material-ui/core/styles";
import { useMachine } from "@xstate/react";
import { apiPollMachine } from "../machines/apiPollMachine";
import { getStatus } from "../api";
import green from "@material-ui/core/colors/green";
import { Tooltip } from "@material-ui/core";

const statusMachine = apiPollMachine(getStatus);

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "row",
    width: 450,
  },
  connected: {
    backgroundColor: green[500],
  },
  icon: {
    fill: "rgba(0, 0, 0, 0.54)",
  },
}));

const goodStatus = "spacetraders is currently online and available to play";

export const Status = () => {
  const classes = useStyles();

  const [state] = useMachine(statusMachine);
  const connected = state.context?.result?.status === goodStatus;

  if (state.matches("success"))
    return (
      <Tooltip title={state.context.result.status}>
        <Badge
          classes={{ colorPrimary: classes.connected }}
          color={connected ? "primary" : "error"}
          variant="dot"
          overlap="circle"
        >
          <DnsIcon className={classes.icon} />
        </Badge>
      </Tooltip>
    );
  return <CircularProgress color="primary" size={24} />;
};
