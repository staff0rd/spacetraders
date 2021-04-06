import {
  Grid,
  Typography,
  Paper,
  Divider,
  makeStyles,
  Box,
  CircularProgress,
  Switch,
} from "@material-ui/core";
import { useEffect, useState } from "react";
import { AvailableShip } from "../../../api/AvailableShip";
import {
  getAutomation,
  IUpgrade,
  setAutomation,
} from "../../../data/IAutomation";
import { Upgrade } from "./Upgrade";

const useStyles = makeStyles((theme) => ({
  header: {
    display: "flex",
    justifyContent: "space-between",
  },
  paper: {
    padding: theme.spacing(2),
  },
  switchGrid: {
    flexWrap: "nowrap",
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
}));

type Props = {
  availableShips: AvailableShip[];
};

export const AutoUpgrade = ({ availableShips }: Props) => {
  const { autoUpgrade } = getAutomation();
  const classes = useStyles();
  const [on, setOn] = useState(autoUpgrade.on);
  const [upgrades, setUpgrades] = useState(autoUpgrade.upgrades);

  useEffect(() => {
    setAutomation({
      ...getAutomation(),
      autoUpgrade: {
        on,
        upgrades,
      },
    });
  }, [on, upgrades]);

  const addUpgrade = (
    role: string,
    fromShipType: string,
    toShipType: string,
    credits: number,
    maxShips: number
  ) => {
    setUpgrades([
      ...upgrades,
      {
        role,
        fromShipType,
        toShipType,
        credits,
        maxShips,
      },
    ]);
  };

  const removeUpgrade = (index: number) => {
    setUpgrades([
      ...upgrades.filter((_, ix) => ix < index),
      ...upgrades.filter((_, ix) => ix > index),
    ]);
  };

  const updateUpgrade = (upgrade: IUpgrade, index: number) => {
    setUpgrades([
      ...upgrades.filter((_, ix) => ix < index),
      { ...upgrade },
      ...upgrades.filter((_, ix) => ix > index),
    ]);
  };

  if (!availableShips.length)
    return <CircularProgress color="primary" size={24} />;

  return (
    <Paper className={classes.paper}>
      <Box className={classes.header}>
        <Typography variant="h6">Auto-upgrade</Typography>
        <Typography component="div">
          <Grid
            className={classes.switchGrid}
            component="label"
            container
            alignItems="center"
            spacing={1}
          >
            <Grid item>Off</Grid>
            <Grid item>
              <Switch
                checked={on}
                title="Not yet implemented"
                // onChange={(event) => setOn(event.target.checked)}
                name="automationOn"
                inputProps={{ "aria-label": "secondary checkbox" }}
              />
            </Grid>
            <Grid item>On</Grid>
          </Grid>
        </Typography>
      </Box>
      {upgrades
        .map((upgrade, index) => (
          <Upgrade
            availableShips={availableShips}
            upgrade={upgrade}
            updateUpgrade={(u) => updateUpgrade(u, index)}
            addUpgrade={addUpgrade}
            removeUpgrade={() => removeUpgrade(index)}
            canDelete={upgrades.length > 1}
            canAdd={index === upgrades.length - 1}
          />
        ))
        .flatMap((value, index, array) =>
          array.length - 1 !== index // check for the last item
            ? [value, <Divider className={classes.divider} />]
            : value
        )}
    </Paper>
  );
};
