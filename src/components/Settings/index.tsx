import { Typography, makeStyles } from "@material-ui/core";
import { CircularProgress, Button, Box, Grid } from "@material-ui/core";
import useInterval from "@use-it/interval";
import React, { useState, useEffect } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import Alert from "@material-ui/lab/Alert";
import { clearPersistence } from "./clearPersistence";
import { SpaceshipIcon } from "../App/SpaceshipIcon";
import GitHubIcon from "@material-ui/icons/GitHub";
import { Debug } from "./Debug";

const useStyles = makeStyles((theme) => ({
  resetDetected: {
    marginTop: theme.spacing(3),
  },
  resetButton: {
    marginTop: theme.spacing(3),
  },
  box: {
    display: "flex",
  },
  link: {
    color: "white",
  },
  credits: {
    marginTop: theme.spacing(6),
    "& a": {
      color: "white",
    },
  },
  icon: {
    marginRight: theme.spacing(1),
    marginTop: theme.spacing(0.5),
    fontSize: 14,
  },
  img: {
    width: 20,
    height: 20,
    marginRight: theme.spacing(1),
    marginLeft: -3,
  },
}));

type Props = {
  resetDetected: boolean;
  stop: () => any;
};

export const Settings = ({ resetDetected, stop }: Props) => {
  const classes = useStyles();
  const [dbSize, setDbSize] = useState<string | undefined>();
  const [estimate, setEstimate] = useState<StorageEstimate | undefined>();
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const getSize = async () => {
    setDbSize(undefined);
    setEstimate(undefined);
    try {
      const response = await navigator.storage.estimate();
      setEstimate(response);
      setDbSize(bytesToSize((response as any).usageDetails.indexedDB));
    } catch (e) {
      console.error("Couldn't get db size", e);
    }
  };
  useEffect(() => {
    getSize();
  }, []);

  useInterval(async () => {
    getSize();
  }, 60000);

  const [
    confirmClearPlayerDialogOpen,
    setConfirmClearPlayerDialogOpen,
  ] = useState(false);

  const handleClearPlayer = async () => {
    setResetting(true);
    stop();
    await clearPersistence();
    setResetting(false);
    setResetMessage("Reset complete, you should refresh the browser");
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={6}>
        <Typography variant="h6">Storage</Typography>
        {estimate ? (
          <Typography>
            {bytesToSize(estimate.usage || 0)} of{" "}
            {bytesToSize(estimate.quota || 0)} (
            {((estimate.usage! / estimate.quota!) * 100).toFixed(2)}%)
          </Typography>
        ) : (
          <CircularProgress />
        )}
        <Typography variant="h6">IndexedDB size</Typography>
        {dbSize ? <Typography>{dbSize}</Typography> : <CircularProgress />}

        {resetDetected && !resetMessage && (
          <Alert className={classes.resetDetected} severity="warning">
            Server reset detected - you should reset
          </Alert>
        )}
      </Grid>
      <Grid item xs={6}>
        <Debug />
      </Grid>
      <Grid item xs={12}>
        {resetMessage && (
          <Alert className={classes.resetDetected} severity="info">
            {resetMessage}
          </Alert>
        )}

        {resetting || resetMessage ? (
          !resetMessage && (
            <CircularProgress className={classes.resetButton} size={48} />
          )
        ) : (
          <>
            <Button
              className={classes.resetButton}
              variant="contained"
              color="secondary"
              onClick={() => setConfirmClearPlayerDialogOpen(true)}
            >
              Reset everything
            </Button>

            <ConfirmDialog
              header="Reset everything?"
              content="API key will be lost! All data will be wiped!"
              setOpen={setConfirmClearPlayerDialogOpen}
              open={confirmClearPlayerDialogOpen}
              action={handleClearPlayer}
            />
          </>
        )}
      </Grid>

      <Grid item xs={12}>
        <Box className={classes.box}>
          <SpaceshipIcon className={classes.icon} />
          <Typography>
            Spaceship icon by{" "}
            <a
              className={classes.link}
              href="https://dryicons.com/icon/spaceship-icon-5255"
            >
              Dryicons
            </a>
          </Typography>
        </Box>
        <Box className={classes.box}>
          <img
            src="icons/Fusion_reactors.png"
            alt="atom icon"
            className={classes.img}
          />
          <Typography>
            atom icon from{" "}
            <a
              className={classes.link}
              href="https://pngtree.com/so/atom-icons"
            >
              pngtree.com
            </a>
          </Typography>
        </Box>
        <Box className={classes.box}>
          <GitHubIcon className={classes.icon} />
          <Typography>
            This project is{" "}
            <a
              className={classes.link}
              href="https://github.com/staff0rd/spacetraders"
            >
              opensource
            </a>
          </Typography>
        </Box>
      </Grid>
    </Grid>
  );
};

function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
}
