import { Typography, makeStyles } from "@material-ui/core";
import { CircularProgress, Button } from "@material-ui/core";
import useInterval from "@use-it/interval";
import React, { useState, useEffect } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import Alert from "@material-ui/lab/Alert";
import { clearPersistence } from "./clearPersistence";

const useStyles = makeStyles((theme) => ({
  resetDetected: {
    marginTop: theme.spacing(3),
  },
  resetButton: {
    marginTop: theme.spacing(3),
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
    const response = await navigator.storage.estimate();
    setEstimate(response);
    setDbSize(bytesToSize((response as any).usageDetails.indexedDB));
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
    <>
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
    </>
  );
};

function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
}
