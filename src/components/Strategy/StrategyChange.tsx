import { useState } from "react";
import MenuIcon from "@material-ui/icons/MoreVert";
import { makeStyles, IconButton, Menu, MenuItem } from "@material-ui/core";
import { ShipStrategy } from "data/Strategy/ShipStrategy";
import { SelectLocationDialog } from "./SelectLocationDialog";
import { newOrder } from "data/localStorage/shipCache";
import { ShipOrders } from "data/IShipOrder";

const useStyles = makeStyles(() => ({
  menuButton: {
    marginTop: -2,
  },
}));

interface IShip {
  id: string;
  strategy: string;
}

type Props = {
  ship: IShip | IShip[];
};

export const StrategyChange = ({ ship }: Props) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedShip, setSelectedShip] = useState<null | IShip | IShip[]>(
    null
  );
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
    ship?: IShip | IShip[]
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
        {Object.keys(ShipStrategy)
          .filter((p) => isNaN(+p))
          .filter((p) => p !== "Change")
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
            handleClose(ShipStrategy[ShipStrategy.GoTo], { location })
          }
          cancel={cancel}
        />
      )}
    </>
  );
};
