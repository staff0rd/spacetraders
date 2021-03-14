import React, { useEffect, useState } from "react";
import DnsIcon from "@material-ui/icons/Dns";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import CircularProgress from "@material-ui/core/CircularProgress";
import { getStatus } from "./api";
import useInterval from "@use-it/interval";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: "flex",
    flexDirection: "row",
    width: 450,
  },
  icon: {
    marginRight: theme.spacing(1),
  },
}));

export const Status = () => {
  const classes = useStyles();
  const [status, setStatus] = useState("");

  const updateStatus = async () => {
    try {
      setStatus("");
      const response = await getStatus();
      setStatus(response.status);
    } catch (e) {
      setStatus(e);
    }
  };

  useInterval(updateStatus, 5000);

  useEffect(() => {
    updateStatus();
  }, []);

  return (
    <Paper className={classes.paper}>
      {status ? (
        <>
          <DnsIcon className={classes.icon} /> <Typography>{status}</Typography>
        </>
      ) : (
        <CircularProgress size={24} />
      )}
    </Paper>
  );
};
