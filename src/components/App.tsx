import MainToolbar from "./MainToolbar";
import { playerMachine } from "../machines/playerMachine";
import { useMachine } from "@xstate/react";
import React, { useEffect, useState } from "react";
import {
  createStyles,
  Theme,
  makeStyles,
  createMuiTheme,
  ThemeProvider,
} from "@material-ui/core/styles";
import { Switch, Route, Link, useLocation, Redirect } from "react-router-dom";
import clsx from "clsx";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import CssBaseline from "@material-ui/core/CssBaseline";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import MenuItem from "@material-ui/core/MenuItem";
import Divider from "@material-ui/core/Divider";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import { PaletteType, useMediaQuery } from "@material-ui/core";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import { IconAndValue } from "./IconAndValue";
import { Status } from "./Status";
import WarningIcon from "@material-ui/icons/Warning";
import { getMenus } from "./getMenus";

const drawerWidth = 180;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
    },
    appBar: {
      zIndex: theme.zIndex.drawer + 1,
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarShift: {
      [theme.breakpoints.down("md")]: {
        marginLeft: drawerWidth,
        width: `calc(100% - ${drawerWidth}px)`,
      },
      transition: theme.transitions.create(["width", "margin"], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: 36,
    },
    hide: {
      display: "none",
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    drawerContainer: {
      overflow: "auto",
    },
    drawerOpen: {
      width: drawerWidth,
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    drawerClose: {
      transition: theme.transitions.create("width", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      overflowX: "hidden",
      width: theme.spacing(7) + 1,
      [theme.breakpoints.up("sm")]: {
        width: theme.spacing(9) + 1,
      },
    },
    toolbar: {
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",
      padding: theme.spacing(0, 1),
      // necessary for content to be below app bar
      ...theme.mixins.toolbar,
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
    },
    loading: {
      marginLeft: theme.spacing(1),
    },
    ship: {
      height: "100%",
      alignItems: "stretch",
    },
    warningIcon: {
      color:
        theme.palette.type === "dark"
          ? theme.palette.warning.dark
          : theme.palette.warning.light,
    },
    footer: {
      position: "fixed",
      bottom: 0,
      padding: theme.spacing(2),
      display: "flex",
    },
    footerOpen: {
      flexDirection: "row-reverse",
    },
    footerClosed: {
      flexDirection: "column",
    },
    statusClosed: {
      marginTop: theme.spacing(2),
    },
    statusOpen: {
      marginRight: theme.spacing(2),
    },
  })
);

export function App() {
  const classes = useStyles();
  const [drawerOpen, setDrawerOpen] = React.useState(true);

  const [theme, setTheme] = useState(
    createMuiTheme({
      palette: {
        type: (localStorage.getItem("theme") || "dark") as PaletteType,
      },
    })
  );

  const toggleTheme = () => {
    const newPaletteType = theme.palette.type === "light" ? "dark" : "light";
    localStorage.setItem("theme", newPaletteType);
    setTheme(
      createMuiTheme({
        palette: {
          type: newPaletteType,
        },
      })
    );
  };

  const isSm = useMediaQuery(theme.breakpoints.down("md"));
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));

  useEffect(() => {
    if (isSm) setDrawerOpen(false);
    if (isLg) setDrawerOpen(true);
  }, [isSm, isLg]);

  const handleDrawerOpen = () => {
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
  };

  const [state, send] = useMachine(playerMachine);

  const handleClearPlayer = () => {
    send("CLEAR_PLAYER");
  };

  const credits = state.context.user?.credits || 0;
  const netWorth = state.context.netWorth
    .map((v) => v.value)
    .reduce((a, b) => a + b, 0);

  const { pathname } = useLocation() as any;

  const { menu, bottomMenu } = getMenus(state, handleClearPlayer);

  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueued((window as any).limiter.queued());
    }, 500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <div className={classes.root}>
        <CssBaseline />
        <AppBar
          position="fixed"
          className={clsx(classes.appBar, {
            [classes.appBarShift]: drawerOpen,
          })}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              onClick={handleDrawerOpen}
              edge="start"
              className={clsx(classes.menuButton, {
                [classes.hide]: drawerOpen,
              })}
            >
              <MenuIcon />
            </IconButton>
            <MainToolbar
              userName={state.context.user?.username || ""}
              credits={credits}
              netWorth={netWorth}
              darkMode={theme.palette.type === "dark"}
              toggleTheme={toggleTheme}
            />
          </Toolbar>
        </AppBar>
        <Drawer
          variant="permanent"
          className={clsx(classes.drawer, {
            [classes.drawerOpen]: drawerOpen,
            [classes.drawerClose]: !drawerOpen,
          })}
          classes={{
            paper: clsx({
              [classes.drawerOpen]: drawerOpen,
              [classes.drawerClose]: !drawerOpen,
            }),
          }}
        >
          <div className={classes.toolbar}>
            <IconButton onClick={handleDrawerClose}>
              {theme.direction === "rtl" ? (
                <ChevronRightIcon />
              ) : (
                <ChevronLeftIcon />
              )}
            </IconButton>
          </div>
          <div className={classes.drawerContainer}>
            <List>
              {menu.map((item) => (
                <MenuItem
                  component={Link as any}
                  to={item.to}
                  button
                  key={item.title}
                  selected={item.to === pathname}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.title} />
                </MenuItem>
              ))}
            </List>
            <Divider />
            <List>
              {bottomMenu.map((item) => (
                <MenuItem
                  button
                  key={item.title}
                  component="a"
                  href={item.href}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.title} />
                </MenuItem>
              ))}
            </List>
          </div>
          <div
            className={clsx(classes.footer, {
              [classes.footerOpen]: drawerOpen,
              [classes.footerClosed]: !drawerOpen,
            })}
          >
            {queued > 2 && (
              <IconAndValue
                icon={<WarningIcon className={classes.warningIcon} />}
                tooltip="Number of api requests queued"
                value={queued}
                squished={!drawerOpen}
              />
            )}
            <div
              className={clsx({
                [classes.statusOpen]: drawerOpen,
                [classes.statusClosed]: !drawerOpen,
              })}
            >
              <Status />
            </div>
          </div>
        </Drawer>
        <main className={classes.content}>
          <Toolbar />
          <Switch>
            {menu.map((item) => (
              <Route key={item.title} path={item.to}>
                {item.component}
              </Route>
            ))}
            <Redirect from="/" to="ships" />
          </Switch>
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;
