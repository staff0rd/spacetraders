import LocationIcon from "@material-ui/icons/FiberManualRecord";
import { makeStyles, Popover, Typography } from "@material-ui/core";
import { useState } from "react";
import db from "../../data";
import { Location as LocationSchema } from "../../api/Location";
import { useLiveQuery } from "dexie-react-hooks";
import { IIntel } from "../../data/IIntel";

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

  const intel = useLiveQuery(() => db.intel.toArray());

  const grouped: any = {};
  intel?.reduce(function (res: any, value: IIntel) {
    if (!res[value.destination]) {
      res[value.destination] = {
        docked: 0,
        enroute: 0,
      };
      grouped[value.destination] = res[value.destination];
    }
    if (value.departure) res[value.destination].enroute += 1;
    else res[value.destination].docked += 1;
    return res;
  }, {});

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    console.log("open");
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    console.log("close");
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
        {grouped[location.location.symbol] && (
          <>
            <Typography>
              Docked: {grouped[location.location.symbol].docked}
            </Typography>
            <Typography>
              En-route: {grouped[location.location.symbol].enroute}
            </Typography>
          </>
        )}
      </Popover>
    </>
  );
};
