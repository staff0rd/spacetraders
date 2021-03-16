import React, { useState } from "react";
import Typography from "@material-ui/core/Typography";
import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store/rootReducer";
import PersonIcon from "@material-ui/icons/Person";
import RefreshIcon from "@material-ui/icons/Refresh";
import { CircularProgress } from "@material-ui/core";
import { IconButton } from "@material-ui/core";
import { Grid } from "@material-ui/core";
import { ConfirmDialog } from "./ConfirmDialog";
import { getToken } from "../store/gameSlice";
import { newPlayerName } from "../newPlayerName";

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
}));

export const Player = () => {
  const classes = useStyles();
  const player = useSelector((p: RootState) => p.game?.player);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dispatch = useDispatch();

  const handleNew = () => {
    console.log("handle new");
    dispatch(getToken(newPlayerName()));
  };

  return (
    <>
      <Paper className={classes.paper}>
        {player ? (
          <Grid container justify="space-between">
            <Grid item className={classes.item}>
              <PersonIcon className={classes.icon} />
              <Typography>{player.user.username}</Typography>
            </Grid>
            <Grid item>
              <IconButton
                size="small"
                title="New user"
                onClick={() => setConfirmOpen(true)}
              >
                <RefreshIcon />
              </IconButton>
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
    </>
  );
};
