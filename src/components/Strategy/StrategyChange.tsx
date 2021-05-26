import { useState } from "react";
import MenuIcon from "@material-ui/icons/MoreVert";
import { makeStyles, IconButton, Menu, MenuItem } from "@material-ui/core";
import { SelectLocationDialog } from "./SelectLocationDialog";
import { newOrder } from "data/localStorage/shipCache";
import { CachedShip } from "data/localStorage/CachedShip";
import { ShipOrders } from "data/IShipOrder";

const useStyles = makeStyles(() => ({
  menuButton: {
    marginTop: -2,
  },
}));

type Props = {
  ship: CachedShip | CachedShip[];
};

export const StrategyChange = ({ ship }: Props) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedShip, setSelectedShip] = useState<
    null | CachedShip | CachedShip[]
  >(null);
  const [selectLocationDialogOpen, setSelectLocationDialogOpen] = useState(
    false
  );

  const handleClose = (newStrategy?: string, data?: any) => {
    if (newStrategy && selectedShip) {
      if (Array.isArray(selectedShip)) {
        selectedShip.forEach((ship) =>
          newOrder(
            ship.id,
            ShipOrders[newStrategy as keyof typeof ShipOrders],
            "Player updated",
            data
          )
        );
      } else {
        newOrder(
          selectedShip.id,
          ShipOrders[newStrategy as keyof typeof ShipOrders],
          "Player updated",
          data
        );
      }
    }
    cancel();
  };

  const cancel = () => {
    setAnchorEl(null);
    setSelectedShip(null);
  };

  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    ship?: CachedShip | CachedShip[]
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedShip(ship || null);
  };

  return (
    <>
      <IconButton
        size="small"
        className={classes.menuButton}
        onClick={(e) => handleClick(e, ship)}
      >
        <MenuIcon fontSize="inherit" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => handleClose()}
      >
        {Object.keys(ShipOrders)
          .filter((p) => isNaN(+p))
          .map((s) => (
            <MenuItem
              key={s}
              onClick={
                s === "GoTo"
                  ? () => setSelectLocationDialogOpen(true)
                  : () => handleClose(s)
              }
            >
              {s}
            </MenuItem>
          ))}
      </Menu>
      {selectLocationDialogOpen && (
        <SelectLocationDialog
          open={selectLocationDialogOpen}
          setOpen={setSelectLocationDialogOpen}
          action={(location) =>
            handleClose(ShipOrders[ShipOrders.GoTo], { location })
          }
          cancel={cancel}
        />
      )}
    </>
  );
};
