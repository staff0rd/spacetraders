import { useLiveQuery } from "dexie-react-hooks";
import { useParams } from "react-router-dom";
import db from "../../data";
import CircularProgress from "@material-ui/core/CircularProgress";
import Typography from "@material-ui/core/Typography";
import Grid from "@material-ui/core/Grid";
import { makeStyles } from "@material-ui/core";
import { groupByLocation } from "../Locations/Map/groupByLocation";
import { filterToIntelWindow } from "./filterToIntelWindow";

const useStyles = makeStyles((theme) => ({
  header: {
    display: "flex",
    alignItems: "baseline",
  },
  subHeader: {
    marginLeft: theme.spacing(2),
  },
}));
export const User = () => {
  const { username } = useParams<{ username: string }>();
  const classes = useStyles();

  const intel = useLiveQuery(() => {
    const collection = db.intel.where("username").equals(username);
    return filterToIntelWindow(collection);
  }, [username]);

  if (!intel) return <CircularProgress size={48} />;

  const grouped = groupByLocation(intel);

  const docked = grouped.map((g) => g.docked).reduce((a, b) => a + b, 0);
  const enroute = grouped.map((g) => g.inTransit).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className={classes.header}>
        <Typography variant="h4">{username}</Typography>
        <Typography className={classes.subHeader}>Docked: {docked}</Typography>
        <Typography className={classes.subHeader}>
          In Transit: {enroute}
        </Typography>
        <Typography className={classes.subHeader}>
          Total: {enroute + docked}
        </Typography>
      </div>
      <Grid container spacing={2}>
        {grouped.map((g) => (
          <Grid key={g.symbol} item xs={3}>
            <Typography variant="h6">{g.symbol}</Typography>
            <Typography>Docked: {g.docked}</Typography>
            <Typography>In Transit: {g.inTransit}</Typography>
          </Grid>
        ))}
      </Grid>
    </>
  );
};
