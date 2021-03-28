import LocationIcon from "@material-ui/icons/FiberManualRecord";
import { makeStyles, Typography } from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
  location: {
    display: "inline",
    position: "absolute",
  },
  icon: {
    cusor: "pointer",
  },
  label: {
    transform: "translateX(-25%)",
  },
}));
type Props = {
  location: { x: number; y: number; symbol: string };
};
export const Location = ({ location: l }: Props) => {
  const classes = useStyles();
  return (
    <div className={classes.location} style={{ top: l.y, left: l.x }}>
      <LocationIcon className={classes.icon} />
      <Typography className={classes.label}>{l.symbol}</Typography>
    </div>
  );
};
