import { IStrategy } from "data/Strategy/IStrategy";
import ForwardIcon from "@material-ui/icons/Forward";
import { makeStyles, Typography } from "@material-ui/core";
import { ChangeStrategyPayload } from "data/Strategy/StrategyPayloads";
import { ShipStrategy } from "data/Strategy/ShipStrategy";

const useStyles = makeStyles((theme) => ({
  root: {},
  forwardIcon: {
    verticalAlign: "bottom",
  },
}));

type Props = {
  strategy?: IStrategy;
};
export const Strategy = ({ strategy }: Props) => {
  const classes = useStyles();

  if (!strategy) return <Typography>Trade</Typography>;

  if (strategy.strategy === ShipStrategy.Change) {
    const from = (strategy.data as ChangeStrategyPayload).from.strategy;
    const to = (strategy.data as ChangeStrategyPayload).to.strategy;
    return (
      <Typography>
        {ShipStrategy[from]} <ForwardIcon className={classes.forwardIcon} />{" "}
        {ShipStrategy[to]}
      </Typography>
    );
  }

  return <Typography>{ShipStrategy[strategy.strategy]}</Typography>;
};
