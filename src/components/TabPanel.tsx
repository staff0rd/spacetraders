import { makeStyles } from "@material-ui/core/styles";
import React from "react";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import {
  Link,
  Switch,
  useLocation,
  Route,
  Redirect,
  useRouteMatch,
} from "react-router-dom";

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

export type TabProps = {
  label: string;
  path: string;
  component: React.ReactNode;
  route?: string;
};

type Props = {
  tabs: TabProps[];
};

export const TabPanel = ({ tabs }: Props) => {
  const { pathname } = useLocation() as any;
  const classes = useStyles();
  const match = useRouteMatch();
  console.warn("pathname", pathname, "match", match);
  return (
    <div className={classes.root}>
      <AppBar className={classes.appBar} position="static">
        <Tabs value={pathname}>
          {tabs.map((tab) => (
            <Tab
              key={tab.path}
              label={tab.label}
              value={tab.path}
              component={Link}
              to={tab.path}
            />
          ))}
        </Tabs>
      </AppBar>
      <Switch>
        {tabs.map((tab) => (
          <Route key={tab.path} exact path={tab.path}>
            <Box className={classes.tabPanel}>{tab.component}</Box>
          </Route>
        ))}
        <Redirect from="/ships" to="/ships/owned" />
      </Switch>
    </div>
  );
};
