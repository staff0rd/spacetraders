import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Tooltip } from "@material-ui/core";
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
  userName: string;
  credits: number;
  netWorth: number;
};

export default function ButtonAppBar({ userName, credits, netWorth }: Props) {
  const classes = useStyles();

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
    </>
  );
}
