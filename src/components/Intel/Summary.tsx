import { Typography, makeStyles } from "@material-ui/core";
import { Link } from "react-router-dom";
import { DataTable } from "../DataTable";

const useStyles = makeStyles((theme) => ({
  link: {
    "& a": {
      color: "white",
    },
  },
}));

export const Summary = ({ items }: { items: SummaryItem[] }) => {
  const classes = useStyles();
  const rows = items
    .sort((a, b) => b.quantity - a.quantity)
    .map((i) => [
      <Typography className={classes.link}>
        <Link to={`/intel/${i.username}`}>{i.username}</Link>
      </Typography>,
      i.quantity,
    ]);
  const columns = ["Username", "Ships"];
  return <DataTable title="summary" rows={rows} columns={columns} />;
};
type SummaryItem = { quantity: number; username: string };
