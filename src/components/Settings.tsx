import { Typography, makeStyles } from "@material-ui/core";
import { CircularProgress, Button } from "@material-ui/core";
import useInterval from "@use-it/interval";
import React, { useState, useEffect } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import db from "../data";

const useStyles = makeStyles((theme) => ({
  resetButton: {
    marginTop: theme.spacing(6),
  },
}));

export const Settings = () => {
  const classes = useStyles();
  const [dbSize, setDbSize] = useState<string | undefined>();
  const [estimate, setEstimate] = useState<StorageEstimate | undefined>();

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
    console.log("Clearing localStorage...");
    localStorage.removeItem("player");
    console.log("Clearing IndexedDB...");
    await Promise.all(db.tables.map((table) => table.clear()));
    console.log("Everything cleared");
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
  );
};

function bytesToSize(bytes: number) {
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes === 0) return "0 Byte";
  var i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
}
