import { CircularProgress, Typography } from "@material-ui/core";
import { SystemContext } from "../../machines/MarketContext";
import { DataTable } from "../DataTable";
import { makeStyles } from "@material-ui/core";
import { Link } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  link: {
    "& a": {
      color: "white",
    },
  },
}));

type Props = {
  systems?: SystemContext;
};

export const LocationList = ({ systems }: Props) => {
  const classes = useStyles();
  if (!systems || !Object.keys(systems).length)
    return <CircularProgress size={48} />;

  const columns = ["System", "Name", "Symbol", "Type", "Position"];
  const rows = Object.keys(systems)
    .map((systemSymbol) =>
      Object.keys(systems[systemSymbol]).map((key) => {
        const location = systems[systemSymbol][key];
        return [
          systemSymbol,
          <Typography className={classes.link}>
            <Link to={`/locations/${location.symbol}`}>{location.name}</Link>
          </Typography>,
          location.symbol,
          location.type,
          `${location.x},${location.y}`,
        ];
      })
    )
    .flat();

  return <DataTable title="Locations" columns={columns} rows={rows} />;
};
