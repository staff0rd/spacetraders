import { useState } from "react";
import { persistStrategy } from "./persistStrategy";
import MenuIcon from "@material-ui/icons/MoreVert";
import { makeStyles, IconButton, Menu, MenuItem } from "@material-ui/core";
import { ShipStrategy } from "data/Strategy/ShipStrategy";

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

  const handleClose = (newStrategy?: string) => {
    if (newStrategy && selectedShip) {
      if (Array.isArray(selectedShip)) {
        selectedShip.forEach((ship) =>
          persistStrategy(
            ship.id,
            ShipStrategy[ship.strategy as keyof typeof ShipStrategy],
            ShipStrategy[newStrategy as keyof typeof ShipStrategy]
          )
        );
      } else {
        persistStrategy(
          selectedShip.id,
          ShipStrategy[selectedShip.strategy as keyof typeof ShipStrategy],
          ShipStrategy[newStrategy as keyof typeof ShipStrategy]
        );
      }
    }
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
            <MenuItem key={s} onClick={() => handleClose(s)}>
              {s}
            </MenuItem>
          ))}
      </Menu>
    </>
  );
};
