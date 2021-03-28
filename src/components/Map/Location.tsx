import LocationIcon from "@material-ui/icons/FiberManualRecord";
import { makeStyles, Typography, Tooltip } from "@material-ui/core";

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
    whiteSpace: "nowrap",
  },
}));

type Props = {
  location: { x: number; y: number; symbol: string };
  parentWidth?: number;
  parentHeight?: number;
};

export const Location = ({ location, parentWidth, parentHeight }: Props) => {
  const classes = useStyles();
  if (!parentWidth || !parentHeight) return <></>;
  const top = location.y;
  const left = location.x;
  return (
    <div className={classes.location} style={{ top, left }}>
      <Tooltip title={location.symbol}>
        <LocationIcon
          className={classes.icon}
          style={
            {
              //color: top > parentHeight - 48 ? "red" : "green",
            }
          }
        />
      </Tooltip>
    </div>
  );
};
