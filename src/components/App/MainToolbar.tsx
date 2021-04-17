import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { IconButton } from "@material-ui/core";
import { IconAndValue } from "./IconAndValue";
import NumberFormat from "react-number-format";
import CreditsIcon from "@material-ui/icons/AttachMoney";
import NetWorthIcon from "@material-ui/icons/AccountBalance";
import yellow from "@material-ui/core/colors/yellow";
import DarkIcon from "@material-ui/icons/Brightness4";
import LightIcon from "@material-ui/icons/Brightness7";
import GitHubIcon from "@material-ui/icons/GitHub";
import { getCredits } from "data/localStorage/getCredits";
import { User } from "./User";

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
  netWorth: number;
  toggleTheme: () => void;
  darkMode: boolean;
};

export default function ButtonAppBar({
  userName,
  netWorth,
  darkMode,
  toggleTheme,
}: Props) {
  const classes = useStyles();

  return (
    <>
      <div className={classes.title}>
        <IconAndValue
          icon={<CreditsIcon className={classes.creditsIcon} />}
          tooltip="Credits"
          value={
            <NumberFormat
              value={getCredits()}
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

      <IconButton aria-label="delete" onClick={toggleTheme}>
        {darkMode ? <LightIcon /> : <DarkIcon />}
      </IconButton>

      {userName && <User username={userName} />}
      <IconButton
        aria-label="source"
        title="Source"
        href="https://github.com/staff0rd/spacetraders"
      >
        <GitHubIcon />
      </IconButton>
    </>
  );
}
