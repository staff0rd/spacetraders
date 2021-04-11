import { makeStyles, Tooltip } from "@material-ui/core";

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
}));

type Props = {
  good: string;
};

export const GoodIcon = ({ good }: Props) => {
  const classes = useStyles();
  const icon = good.substring(0, 1) + good.substring(1).toLocaleLowerCase();
  return (
    <Tooltip title={good}>
      <img src={`/icons/${icon}.png`} alt={good} className={classes.icon} />
    </Tooltip>
  );
};
