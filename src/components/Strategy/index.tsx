import React, { useState } from "react";
import { State } from "xstate";
import {
  Context as PlayerContext,
  Schema as PlayerSchema,
  Event as PlayerEvent,
} from "../../machines/playerMachine";
import CircularProgress from "@material-ui/core/CircularProgress";
import {
  makeStyles,
  Typography,
  Grid,
  TextField,
  Box,
  FormControl,
  useTheme,
  useMediaQuery,
  IconButton,
  Menu,
  MenuItem,
} from "@material-ui/core";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { useLiveQuery } from "dexie-react-hooks";
import { Probes } from "./Probes";
import { persistStrategy } from "./persistStrategy";
import { DataTable, right } from "../DataTable";
import FlightProgress from "../Ships/FlightProgress";
import NumberFormat from "react-number-format";
import { Link } from "react-router-dom";
import MenuIcon from "@material-ui/icons/MoreVert";
import { IShipDetail } from "data/IShipDetail";
import { FlightPlan } from "api/FlightPlan";
import { Ship } from "api/Ship";

type ExtendedShip = Ship &
  IShipDetail & {
    strategy: string;
    flightPlan: FlightPlan | undefined;
    locationName: string;
  };

const useStyles = makeStyles((theme) => ({
  shipState: {
    display: "inline",
    marginLeft: theme.spacing(2),
  },
  menuButton: {
    marginTop: -2,
  },
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
  total: {
    marginTop: 22,
  },
  text: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
  probes: {
    textAlign: "end",
  },
  strategy: {
    display: "flex",
  },
  search: {
    display: "flex",
  },
}));

type Props = {
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null;
};

export const Strategy = ({ state }: Props) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [selectedShip, setSelectedShip] = useState<
    null | ExtendedShip | ExtendedShip[]
  >(null);
  const handleClick = (
    event: React.MouseEvent<HTMLButtonElement>,
    ship?: ExtendedShip | ExtendedShip[]
  ) => {
    setAnchorEl(event.currentTarget);
    setSelectedShip(ship || null);
  };

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

  const [shipFilter, setShipFilter] = useState("");
  const [shipLimit, setShipLimit] = useState<number | "">("");

  const ships = useLiveQuery(async () => {
    const details = await db.shipDetail.filter((p) => !p.deleted).toArray();
    const strats = await db.strategies.toArray();
    const ships = await db.ships.toArray();
    const flightPlans = await db.flightPlans.toArray();
    return details.map(
      (detail): ExtendedShip => {
        const ship = ships.find((s) => s.id === detail.shipId);
        const strategy =
          ShipStrategy[
            strats.find((s) => detail.shipId === s.shipId)?.strategy ||
              ShipStrategy.Trade
          ];
        const flightPlan = flightPlans.find(
          (fp) => fp.shipId === detail.shipId
        );
        const locationName = ship?.location || "";
        return {
          ...detail,
          ...ship,
          strategy,
          flightPlan,
          locationName,
        } as ExtendedShip;
      }
    );
  });

  const strategies = useLiveQuery(() => db.strategies.toArray());

  if (
    !state ||
    !state.context.actors.length ||
    !strategies ||
    !ships ||
    !state.context.systems
  )
    return <CircularProgress size={48} />;

  const columns = [
    "Strategy",
    ...(isMdDown ? ["Ship"] : ["Name", "Type"]),
    right("Last Profit"),
    "Location",
  ];

  const shipsFiltered = ships.filter(
    (ship) =>
      shipFilter === "" ||
      ship.name.toLowerCase().includes(shipFilter.toLowerCase()) ||
      ship.strategy.toLowerCase().includes(shipFilter.toLowerCase()) ||
      ship.locationName.toLowerCase().includes(shipFilter.toLowerCase()) ||
      ship.type?.toLowerCase().includes(shipFilter.toLowerCase())
  );

  const shipsLimited = shipLimit
    ? shipsFiltered.slice(0, shipLimit)
    : shipsFiltered;

  const rows = shipsLimited.map((ship) => [
    <div className={classes.strategy}>
      <IconButton
        aria-label="delete"
        size="small"
        className={classes.menuButton}
        onClick={(e) => handleClick(e, ship)}
      >
        <MenuIcon fontSize="inherit" />
      </IconButton>
      {ship.strategy}
    </div>,
    ...(isMdDown
      ? [
          <Box>
            <Typography className={classes.text}>
              <Link to={`/ships/owned/${ship.id}`}>{ship.name}</Link>
            </Typography>
            <Typography className={classes.text}>{ship.type}</Typography>
          </Box>,
        ]
      : [
          <Typography className={classes.text}>
            <Link to={`/ships/owned/${ship.id}`}>{ship.name}</Link>
          </Typography>,

          ship.type,
        ]),
    right(
      <NumberFormat
        value={ship.lastProfit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    ship.flightPlan ? (
      <FlightProgress flightPlan={ship.flightPlan} />
    ) : (
      ship.locationName
    ),

    ship.id,
  ]);

  const shipWithUndefinedId = ships.find((s) => !s.id);
  if (shipWithUndefinedId) {
    db.shipDetail
      .where("shipId")
      .equals(shipWithUndefinedId.shipId)
      .modify({ deleted: true });
    throw new Error("Found ship with undefinedid");
  }
  return (
    <>
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
      <Grid container>
        <Grid item xs={6}>
          <div className={classes.search}>
            <FormControl className={classes.formControl}>
              <TextField
                label="Filter"
                value={shipFilter}
                onChange={(e) => setShipFilter(e.target.value)}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <TextField
                type="number"
                label="Limit"
                value={shipLimit}
                onChange={(e) => setShipLimit(Number(e.target.value) || "")}
              />
            </FormControl>
            <FormControl className={classes.formControl}>
              <Typography className={classes.total}>
                {rows.length}
                <IconButton
                  aria-label="delete"
                  size="small"
                  className={classes.menuButton}
                  onClick={(e) => handleClick(e, shipsLimited)}
                >
                  <MenuIcon fontSize="inherit" />
                </IconButton>
              </Typography>
            </FormControl>
          </div>
        </Grid>
        <Grid item xs={6} className={classes.probes}>
          <Probes />
        </Grid>
      </Grid>

      <DataTable
        title="Strategy"
        lastColumnIsRowKey
        columns={columns}
        rows={rows}
      />
    </>
  );
};
