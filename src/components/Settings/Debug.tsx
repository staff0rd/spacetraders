import React from "react";
import { getDebug, setDebug } from "../../data/localStorage/getDebug";
import { DebugCheckbox } from "./DebugCheckbox";
import { Typography, makeStyles, Button } from "@material-ui/core";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    display: "flex",
    flexDirection: "column",
  },
  text: {
    "& a": {
      color: "white",
    },
  },
  button: {
    width: 170,
  },
}));

export const Debug = () => {
  const classes = useStyles();
  const debug = getDebug();
  const doit = async () => {};

  return (
    <div className={classes.root}>
      <DebugCheckbox
        hideWhenOff
        title={
          <Typography className={classes.text}>
            <Link to={`/ships/owned/${debug.focusShip}`}>Ship focused</Link>
          </Typography>
        }
        initialValue={!!debug.focusShip}
        persist={(value) =>
          !value ? setDebug({ focusShip: undefined }) : () => {}
        }
      />
      <DebugCheckbox
        title="Debug Player Machine"
        persist={(value) => setDebug({ debugPlayerMachine: value })}
        initialValue={debug.debugPlayerMachine}
      />
      <DebugCheckbox
        title="Debug Upgrade Machine"
        persist={(value) => setDebug({ debugUpgradeMachine: value })}
        initialValue={debug.debugUpgradeMachine}
      />
      <DebugCheckbox
        title="Debug Buy &amp; Upgrade Machine"
        persist={(value) => setDebug({ debugBuyAndUpgradeShipMachine: value })}
        initialValue={debug.debugBuyAndUpgradeShipMachine}
      />
      <DebugCheckbox
        title="Debug System Monitor Machine"
        persist={(value) => setDebug({ debugSystemMonitorMachine: value })}
        initialValue={debug.debugSystemMonitorMachine}
      />
      <Button
        className={classes.button}
        variant="contained"
        color="primary"
        onClick={doit}
        title="Fires the attached debug code"
      >
        Debug function
      </Button>
    </div>
  );
};
