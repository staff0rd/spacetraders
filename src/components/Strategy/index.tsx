import React from "react";
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
  Tooltip,
  Box,
  useTheme,
  useMediaQuery,
} from "@material-ui/core";
import { DateTime } from "luxon";
import { ShipStrategy } from "../../data/Strategy/ShipStrategy";
import db from "../../data";
import { useLiveQuery } from "dexie-react-hooks";
import {
  getPlayerStrategy,
  setPlayerStrategy,
} from "../../data/localStorage/PlayerStrategy";
import { StrategyToggle } from "./StrategyToggle";
import { Probes } from "./Probes";
import { persistStrategy } from "./persistStrategy";
import { DataTable, right } from "../DataTable";
import FlightProgress from "../Ships/FlightProgress";
import NumberFormat from "react-number-format";
import { Link } from "react-router-dom";
import { CustomSelect } from "../CustomSelect";

const useStyles = makeStyles((theme) => ({
  playerStrategy: {
    marginBottom: theme.spacing(2),
  },
  shipState: {
    display: "inline",
    marginLeft: theme.spacing(2),
  },
  flightPlanText: {
    fontSize: 14,
  },
  link: {
    fontSize: 14,
    "& a": {
      color: "white",
    },
  },
  probes: {
    textAlign: "end",
  },
}));

type Props = {
  state: State<PlayerContext, PlayerEvent, any, PlayerSchema> | null;
};

export const Strategy = ({ state }: Props) => {
  const classes = useStyles();
  const theme = useTheme();
  const isMdDown = useMediaQuery(theme.breakpoints.down("md"));
  const [strategy, setStrategy] = React.useState<ShipStrategy>(
    getPlayerStrategy().strategy
  );

  const shipDetail = useLiveQuery(() => db.shipDetail.toArray());

  const strategies = useLiveQuery(() => db.strategies.toArray());

  const flightPlans = useLiveQuery(() => db.flightPlans.toArray());

  if (!state || !state.context.actors.length || !strategies)
    return <CircularProgress size={48} />;

  const handlePlayerStrategyChange = (
    event: React.MouseEvent<HTMLElement>,
    newStrategy: string
  ) => {
    if (newStrategy != null) {
      setStrategy(parseInt(newStrategy));
      setPlayerStrategy(parseInt(newStrategy));
      state!.context.actors.forEach((actor) =>
        persistStrategy(
          actor.state.context.id,
          getStrategy(actor.state.context.id)!,
          parseInt(newStrategy)
        )
      );
    }
  };
  const handleShipStrategyChange = (
    shipId: string,
    newStrategy: string,
    oldStrategy: ShipStrategy
  ) => {
    if (newStrategy != null) {
      persistStrategy(shipId, oldStrategy, parseInt(newStrategy));
    }
  };

  const getStrategy = (shipId: string) => {
    const result = strategies!.find((s) => s.shipId === shipId)?.strategy;
    return result;
  };

  const flightPlanToRelative = (shipId: string) => {
    const flightPlan = flightPlans?.find((fp) => fp.shipId === shipId);
    if (
      flightPlan &&
      DateTime.fromISO(flightPlan.arrivesAt) > DateTime.local()
    ) {
      return (
        <>
          <Typography className={classes.flightPlanText}>
            {flightPlan.destination}{" "}
            {DateTime.fromISO(flightPlan.arrivesAt).toRelative()}
          </Typography>
          <FlightProgress flightPlan={flightPlan} />
        </>
      );
    }
  };

  const getLastProfitCreated = (shipId: string) => {
    const created = shipDetail?.find((sd) => sd.shipId === shipId)
      ?.lastProfitCreated;
    if (created) return DateTime.fromISO(created).toRelative()!;
    return "";
  };

  const columns = [
    "Strategy",
    ...(isMdDown ? ["Ship"] : ["Name", "Type"]),
    right("Last Profit"),
    "Location",
  ];

  const strats = Object.keys(ShipStrategy).filter((p) => isNaN(+p));
  console.log("strats", strats);
  const rows = state.context.actors
    .sort((a, b) =>
      (
        shipDetail?.find((sd) => sd.shipId === b.state.context.id)
          ?.lastProfitCreated || ""
      ).localeCompare(
        shipDetail?.find((sd) => sd.shipId === a.state.context.id)
          ?.lastProfitCreated || ""
      )
    )
    .map((actor) => [
      `${
        ShipStrategy[
          (getStrategy(actor.state.context.id)! as unknown) as number
        ]
      }: ${actor.state.value}`,
      // <CustomSelect
      //   key={actor.state.context.id}
      //   name="Strategy"
      //   values={strats}
      //   value={
      //     ShipStrategy[
      //       (getStrategy(actor.state.context.id)! as unknown) as number
      //     ]
      //   }
      //   setValue={(s) => {}}
      // />,
      // <StrategyToggle
      //   disabled={getStrategy(actor.state.context.id) === ShipStrategy.Change}
      //   strategy={getStrategy(actor.state.context.id)}
      //   handleStrategy={(_, value) =>
      //     handleShipStrategyChange(
      //       actor.state.context.id,
      //       value,
      //       getStrategy(actor.state.context.id)!
      //     )
      //   }
      //   size="small"
      // />,
      ...(isMdDown
        ? [
            <Box>
              <Typography className={classes.link}>
                <Link to={`/ships/owned/${actor.state.context.id}`}>
                  {
                    shipDetail?.find(
                      (sd) => sd.shipId === actor.state.context.id
                    )?.name
                  }
                </Link>
              </Typography>
              <Typography>{actor.state.context.ship?.type}</Typography>
            </Box>,
          ]
        : [
            <Typography className={classes.link}>
              <Link to={`/ships/owned/${actor.state.context.id}`}>
                {
                  shipDetail?.find((sd) => sd.shipId === actor.state.context.id)
                    ?.name
                }
              </Link>
            </Typography>,
            actor.state.context.ship?.type,
          ]),
      right(
        <Tooltip title={getLastProfitCreated(actor.state.context.id)}>
          <NumberFormat
            value={
              shipDetail?.find((sd) => sd.shipId === actor.state.context.id)
                ?.lastProfit
            }
            thousandSeparator=","
            displayType="text"
            prefix="$"
          />
        </Tooltip>
      ),

      flightPlanToRelative(actor.state.context.id) ||
        actor.state.context.ship?.location,

      actor.state.context.id,
    ]);

  return (
    <>
      <Grid container className={classes.playerStrategy}>
        <Grid item xs={6}>
          <StrategyToggle
            strategy={strategy}
            handleStrategy={handlePlayerStrategyChange}
            disabled={
              strategies.filter((p) => p.strategy === ShipStrategy.Change)
                .length > 0
            }
          />
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
