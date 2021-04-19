import {
  makeStyles,
  TextField,
  FormControl,
  IconButton,
  Grid,
  Typography,
  Paper,
  Box,
  Switch,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/DeleteForever";
import AddIcon from "@material-ui/icons/AddCircle";
import { useEffect, useState } from "react";
import { AvailableShip } from "api/AvailableShip";
import { CustomSelect } from "../../CustomSelect";
import { IAutoUpgrade } from "data/localStorage/IAutomation";
import NumberFormat from "react-number-format";

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
  formControl: {
    margin: theme.spacing(1),
    width: 120,
  },
  button: {
    marginTop: theme.spacing(1),
  },
}));

type Props = {
  upgrade: IAutoUpgrade;
  availableShips: AvailableShip[];
  addUpgrade: (
    role: string,
    fromShipType: string,
    toShipType: string,
    credits: number,
    maxShips: number
  ) => unknown;
  removeUpgrade: () => unknown;
  updateUpgrade: (upgrade: IAutoUpgrade) => unknown;
  canDelete: boolean;
  canAdd: boolean;
};

export const AutoUpgrade = ({
  upgrade,
  availableShips,
  addUpgrade,
  removeUpgrade,
  updateUpgrade,
  canDelete,
  canAdd,
}: Props) => {
  const classes = useStyles();
  const roles = ["Trade"];
  const [role, setRole] = useState(upgrade.role);
  const [on, setOn] = useState(upgrade.on);
  const [fromShipType, setFromShipType] = useState(upgrade.fromShipType);
  const [toShipType, setToShipType] = useState(upgrade.toShipType);
  const [credits, setCredits] = useState(upgrade.credits);
  const [maxShips, setMaxShips] = useState(upgrade.maxShips);

  useEffect(() => {
    updateUpgrade({ role, fromShipType, toShipType, credits, maxShips, on });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, fromShipType, toShipType, credits, maxShips, on]);

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
                onChange={(event) => setOn(event.target.checked)}
                name="automationOn"
                inputProps={{ "aria-label": "secondary checkbox" }}
              />
            </Grid>
            <Grid item>On</Grid>
          </Grid>
        </Typography>
      </Box>
      <CustomSelect
        name="Role"
        value={role}
        setValue={setRole}
        values={roles}
        hideAll
      />
      <CustomSelect
        name="From"
        value={fromShipType}
        setValue={setFromShipType}
        values={availableShips
          .map((av) => av.type)
          .sort((a, b) => a.localeCompare(b))}
        hideAll
      />
      <CustomSelect
        name="To"
        value={toShipType}
        setValue={setToShipType}
        values={availableShips
          .map((av) => av.type)
          .sort((a, b) => a.localeCompare(b))}
        hideAll
      />
      <FormControl className={classes.formControl}>
        <NumberFormat
          value={credits}
          customInput={TextField}
          prefix={"$"}
          type="text"
          label="Credits"
          thousandSeparator
          onValueChange={({ value: v }) => setCredits(Number(v))}
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <TextField
          type="number"
          label="Max ships"
          value={maxShips}
          onChange={(e) => setMaxShips(Number(e.target.value))}
        />
      </FormControl>
      {canDelete && (
        <IconButton
          className={classes.button}
          title="Delete"
          onClick={() => removeUpgrade()}
        >
          <DeleteIcon />
        </IconButton>
      )}
      {canAdd && (
        <IconButton
          className={classes.button}
          title="Add"
          onClick={() =>
            addUpgrade(role, fromShipType, toShipType, credits, maxShips)
          }
        >
          <AddIcon />
        </IconButton>
      )}
    </Paper>
  );
};
