import React from "react";
import { getDebug, setDebug } from "../../data/localStorage/IDebug";
import { DebugCheckbox } from "./DebugCheckbox";
import { Typography, makeStyles, Button } from "@material-ui/core";
import { Link } from "react-router-dom";
import { getGraph, getRoute } from "data/localStorage/graph";

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
}));

export const Debug = () => {
  const classes = useStyles();
  const debug = getDebug();
  const doit = () => {
    const { graph, warps } = getGraph();
    const route = getRoute(graph, "OE-KO", "XV-CB-NM", "JW-MK-I", 50, warps);
    console.log(route);
  };

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
        title="Debug Probe Machine"
        persist={(value) => setDebug({ debugProbeMachine: value })}
        initialValue={debug.debugProbeMachine}
      />
      <DebugCheckbox
        title="Debug Trade Machine"
        persist={(value) => setDebug({ debugTradeMachine: value })}
        initialValue={debug.debugTradeMachine}
      />
      <DebugCheckbox
        title="Debug Upgrade Machine"
        persist={(value) => setDebug({ debugUpgradeMachine: value })}
        initialValue={debug.debugUpgradeMachine}
      />
      <DebugCheckbox
        title="Debug Halt Machine"
        persist={(value) => setDebug({ debugHaltMachine: value })}
        initialValue={debug.debugHaltMachine}
      />
      <Button
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
