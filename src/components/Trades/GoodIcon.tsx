import { Avatar, makeStyles, Tooltip } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  link: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
  icon: {
    width: 32,
  },
  avatar: {
    width: 24,
    height: 24,
    fontSize: 14,
  },
}));

type Props = {
  good: string;
};

const GoodAvatar = ({ good, text }: { good: string; text: string }) => {
  const classes = useStyles();
  return (
    <Tooltip title={good}>
      <Avatar className={classes.avatar}>{text}</Avatar>
    </Tooltip>
  );
};

export const GoodIcon = ({ good }: Props) => {
  const classes = useStyles();
  const icon = good.substring(0, 1) + good.substring(1).toLocaleLowerCase();
  if (icon === "Precision_instruments")
    return <GoodAvatar good={good} text="PI" />;
  if (icon === "Explosives") return <GoodAvatar good={good} text="EX" />;
  return (
    <Tooltip title={good}>
      <img src={`/icons/${icon}.png`} alt={good} className={classes.icon} />
    </Tooltip>
  );
};
