import { useState, useEffect } from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Tooltip } from "@material-ui/core";
import RefreshIcon from "@material-ui/icons/Refresh";
import { ConfirmDialog } from "./ConfirmDialog";
import { States } from "../machines/playerMachine";
import { IconButton } from "@material-ui/core";
import { StateValue } from "xstate";
import PersonIcon from "@material-ui/icons/Person";
import { IconAndValue } from "./IconAndValue";
import NumberFormat from "react-number-format";

import CreditsIcon from "@material-ui/icons/AttachMoney";
import NetWorthIcon from "@material-ui/icons/TrendingUp";
import yellow from "@material-ui/core/colors/yellow";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
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
    <>
      <div className={classes.title}>
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
      </div>
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

      <ConfirmDialog
        header="Create new user?"
        content="API key will be lost!"
        setOpen={setConfirmClearPlayerDialogOpen}
        open={confirmClearPlayerDialogOpen}
        action={handleClearPlayer}
      />
    </>
  );
}
