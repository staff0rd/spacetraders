import LocationIcon from "@material-ui/icons/FiberManualRecord";
import { makeStyles, Popover, Typography } from "@material-ui/core";
import { useState } from "react";
import { Location as LocationSchema } from "../../../api/Location";

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
  popover: {
    pointerEvents: "none",
  },
}));

type Props = {
  location: { x: number; y: number; location: LocationSchema };
  parentWidth?: number;
  parentHeight?: number;
};

export const Location = ({ location, parentWidth, parentHeight }: Props) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  if (!parentWidth || !parentHeight) return <></>;
  const top = location.y;
  const left = location.x;
  const open = Boolean(anchorEl);
  return (
    <>
      <div
        key={`${location.location.symbol}-icon`}
        className={classes.location}
        style={{ top, left }}
        onMouseEnter={(e) => handlePopoverOpen(e)}
        onMouseLeave={(e) => handlePopoverClose()}
      >
        <LocationIcon
          className={classes.icon}
          style={
            {
              //color: top > parentHeight - 48 ? "red" : "green",
            }
          }
        />
      </div>
      <Popover
        key={`${location.location.symbol}-popover`}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
        className={classes.popover}
      >
        <Typography>
          {location.location.name} ({location.location.symbol})
        </Typography>
      </Popover>
    </>
  );
};
