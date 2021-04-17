import { CircularProgress, Typography, Tooltip } from "@material-ui/core";
import { SystemContext } from "../../machines/MarketContext";
import { DataTable } from "../DataTable";
import { makeStyles } from "@material-ui/core";
import { Link } from "react-router-dom";
import InfoIcon from "@material-ui/icons/Info";

const useStyles = makeStyles((theme) => ({
  system: {
    display: "flex",
  },
  infoIcon: {
    fontSize: 20,
  },
  text: {
    fontSize: 14,
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
          <div className={classes.system}>
            <Typography className={classes.text}>{systemSymbol}</Typography>
            {!!location.messages?.length && (
              <Tooltip title="Has messages">
                <InfoIcon className={classes.infoIcon} />
              </Tooltip>
            )}
          </div>,
          <Typography className={classes.text}>
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
