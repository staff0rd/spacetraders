import React from "react";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import { useSelector } from "react-redux";
import { RootState } from "./store/rootReducer";
import PersonIcon from "@material-ui/icons/Person";
import { CircularProgress } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(1),
    display: "flex",
    flexDirection: "row",
    width: 450,
  },
  icon: {
    marginRight: theme.spacing(1),
  },
}));

export const Player = () => {
  const classes = useStyles();
  const player = useSelector((p: RootState) => p.game?.player);

  return (
    <Paper className={classes.paper}>
      {player ? (
        <>
          <PersonIcon className={classes.icon} />
          <Typography>{player.user.username}</Typography>
        </>
      ) : (
        <CircularProgress size={24} />
      )}
    </Paper>
  );
};
