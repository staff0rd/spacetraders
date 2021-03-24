import { useState, useEffect } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Box from "@material-ui/core/Box";
import Toolbar from "@material-ui/core/Toolbar";
import { Tooltip } from "@material-ui/core";
import RefreshIcon from "@material-ui/icons/Refresh";
import { Status } from "./Status";
import { ConfirmDialog } from "./ConfirmDialog";
import { States } from "../machines/playerMachine";
import { IconButton } from "@material-ui/core";
import { StateValue } from "xstate";
import PersonIcon from "@material-ui/icons/Person";
import { IconAndValue } from "./IconAndValue";
import { SpaceshipIcon } from "./SpaceshipIcon";
import NumberFormat from "react-number-format";
import GitHubIcon from "@material-ui/icons/GitHub";
import CreditsIcon from "@material-ui/icons/AttachMoney";
import NetWorthIcon from "@material-ui/icons/TrendingUp";
import WarningIcon from "@material-ui/icons/Warning";
import yellow from "@material-ui/core/colors/yellow";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
      "& .MuiSvgIcon-root": {
        fill: "white",
      },
    },
    status: {},
    title: {
      marginLeft: theme.spacing(2),
      flexGrow: 1,
    },
    creditsIcon: {
      marginRight: theme.spacing(-1),
    },
    warningIcon: {
      fill: `${yellow[500]} !important`,
    },
  })
);

type Props = {
  rootState: StateValue;
  handleClearPlayer: () => void;
  shipCount: number;
  userName: string;
  credits: number;
  netWorth: number;
};

export default function ButtonAppBar({
  rootState,
  handleClearPlayer,
  shipCount,
  userName,
  credits,
  netWorth,
}: Props) {
  const classes = useStyles();
  const [
    confirmClearPlayerDialogOpen,
    setConfirmClearPlayerDialogOpen,
  ] = useState(false);
  const [queued, setQueued] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueued((window as any).limiter.queued());
    }, 500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={classes.root}>
      <AppBar position="static">
        <Toolbar>
          <Status />
          <Box className={classes.title}>
            {queued > 2 && (
              <IconAndValue
                icon={<WarningIcon className={classes.warningIcon} />}
                tooltip="Number of api requests queued"
                value={queued}
              />
            )}
          </Box>

          <IconAndValue
            icon={<CreditsIcon className={classes.creditsIcon} />}
            tooltip="Credits"
            value={
              <NumberFormat
                value={credits}
                thousandSeparator=","
                displayType="text"
              />
            }
          />

          <IconAndValue
            icon={<NetWorthIcon />}
            tooltip="Net Worth"
            value={
              <NumberFormat
                value={netWorth}
                thousandSeparator=","
                displayType="text"
              />
            }
          />

          <IconAndValue
            icon={<SpaceshipIcon fontSize="small" />}
            value={
              <NumberFormat
                value={shipCount}
                thousandSeparator=","
                displayType="text"
              />
            }
            tooltip="Number of ships"
          />
          {userName && (
            <Tooltip title={userName}>
              <PersonIcon />
            </Tooltip>
          )}
          {rootState === States.Ready && (
            <IconButton
              size="small"
              title="New user"
              onClick={() => setConfirmClearPlayerDialogOpen(true)}
            >
              <RefreshIcon />
            </IconButton>
          )}
          <Tooltip title="Source on GitHub">
            <IconButton href="https://github.com/staff0rd/spacetraders">
              <GitHubIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <ConfirmDialog
        header="Create new user?"
        content="API key will be lost!"
        setOpen={setConfirmClearPlayerDialogOpen}
        open={confirmClearPlayerDialogOpen}
        action={handleClearPlayer}
      />
    </div>
  );
}
