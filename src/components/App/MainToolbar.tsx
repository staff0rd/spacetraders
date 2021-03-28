import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import { Tooltip, IconButton } from "@material-ui/core";
import PersonIcon from "@material-ui/icons/Person";
import { IconAndValue } from "./IconAndValue";
import NumberFormat from "react-number-format";
import CreditsIcon from "@material-ui/icons/AttachMoney";
import NetWorthIcon from "@material-ui/icons/AccountBalance";
import yellow from "@material-ui/core/colors/yellow";
import DarkIcon from "@material-ui/icons/Brightness4";
import LightIcon from "@material-ui/icons/Brightness7";

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
  toggleTheme: () => void;
  darkMode: boolean;
};

export default function ButtonAppBar({
  userName,
  credits,
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

      <IconButton aria-label="delete" onClick={toggleTheme}>
        {darkMode ? <LightIcon /> : <DarkIcon />}
      </IconButton>

      {userName && (
        <Tooltip title={userName}>
          <PersonIcon />
        </Tooltip>
      )}
    </>
  );
}
