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
    minWidth: 60,
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
  const maxShipValues = [
    1,
    2,
    3,
    4,
    5,
    10,
    20,
    30,
    40,
    50,
    60,
    70,
    80,
    90,
    100,
  ];

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
      <CustomSelect
        name="Max ships"
        setValue={(v) => setMaxShips(parseInt(v))}
        values={maxShipValues}
        value={maxShips.toString()}
        hideAll
      />
    </Paper>
  );
};
