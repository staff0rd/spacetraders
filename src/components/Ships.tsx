import { makeStyles } from "@material-ui/core/styles";
import React, { useEffect, useState } from "react";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import { AvailableShips } from "./AvailableShips";
import { AvailableShip } from "../api/AvailableShip";
import { Strategy } from "./Strategy";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../machines/playerMachine";
import { Link, Switch, useLocation, Route } from "react-router-dom";
import Ship from "./Ship";
import db from "../data";

const useStyles = makeStyles((theme) => ({
  root: {
    margin: theme.spacing(-3),
    flexGrow: 1,
    backgroundColor: theme.palette.background.default,
    minHeight: "100%",
  },
  appBar: {
    backgroundColor: "inherit",
  },
  tabPanel: {
    margin: theme.spacing(3),
  },
}));

type Props = {
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null;
  availableShips: AvailableShip[];
};

export const Ships = ({ state, availableShips }: Props) => {
  const classes = useStyles();
  const { pathname } = useLocation() as any;
  const [shipName, setShipName] = useState("");

  const shipId = pathname.startsWith("/ships/owned/")
    ? (pathname as string).substring(13)
    : undefined;

  useEffect(() => {
    if (shipId) {
      db.shipDetail
        .get(shipId)
        .then((detail) => detail && setShipName(detail.name));
    } else setShipName("");
  }, [shipId]);

  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Tabs value={pathname}>
          <Tab
            label="Owned"
            value="/ships/owned"
            component={Link}
            to="/ships/owned"
          />
          <Tab
            label="Available"
            value={"/ships/available"}
            component={Link}
            to="/ships/available"
          />
          {shipId && (
            <Tab
              label={shipName}
              value={pathname}
              component={Link}
              to={pathname}
            />
          )}
        </Tabs>
      </AppBar>
      <Switch>
        <Route exact path="/ships/owned">
          <Box className={classes.tabPanel}>
            <Strategy state={state} />
          </Box>
        </Route>
        <Route path="/ships/available">
          <Box className={classes.tabPanel}>
            <AvailableShips availableShips={availableShips} />
          </Box>
        </Route>
        <Route path="/ships/owned/:shipId">
          <Box className={classes.tabPanel}>
            <Ship
              ship={state?.context.actors.find(
                (x) => x.state.context.id === shipId
              )}
            />
          </Box>
        </Route>
      </Switch>
    </div>
  );
};
