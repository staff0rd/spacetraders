import {
  Grid,
  Typography,
  Paper,
  makeStyles,
  Box,
  TextField,
  CircularProgress,
  FormControl,
  Switch,
} from "@material-ui/core";
import { useEffect, useState } from "react";
import { AvailableShip } from "../../../api/AvailableShip";
import { CustomSelect } from "../../CustomSelect";
import NumberFormat from "react-number-format";
import {
  getAutomation,
  setAutomation,
} from "../../../data/localStorage/IAutomation";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    width: 120,
  },
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
}));

type Props = {
  availableShips: AvailableShip[];
};

export const AutoBuy = ({ availableShips }: Props) => {
  const { autoBuy } = getAutomation();
  const classes = useStyles();
  const [on, setOn] = useState(autoBuy.on);
  const [shipType, setShipType] = useState(autoBuy.shipType);
  const [credits, setCredits] = useState(autoBuy.credits);
  const [maxShips, setMaxShips] = useState(autoBuy.maxShips);

  useEffect(() => {
    setAutomation({
      ...getAutomation(),
      autoBuy: {
        credits,
        shipType,
        on,
        maxShips,
      },
    });
  }, [shipType, credits, maxShips, on]);

  if (!availableShips.length)
    return <CircularProgress color="primary" size={24} />;

  return (
    <Paper className={classes.paper}>
      <Box className={classes.header}>
        <Typography variant="h6">Auto-buy</Typography>
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
        name="Ship"
        value={shipType}
        setValue={setShipType}
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
    </Paper>
  );
};
