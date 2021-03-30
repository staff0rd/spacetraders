import { Ship } from "../api/Ship";
import Typography from "@material-ui/core/Typography";
import { CircularProgress } from "@material-ui/core";

// const useStyles = makeStyles((theme) => ({
//   list: {},
// }));

type Props = {
  ship?: Ship;
};

const CargoComponent = ({ ship }: Props) => {
  if (!ship) return <CircularProgress />;
  return (
    <Typography>
      {ship.maxCargo - ship.spaceAvailable}/{ship.maxCargo}:{` `}
      {ship.cargo
        .map((cargo, ix) => `${cargo.quantity}x ${cargo.good}`)
        .join(", ")}
    </Typography>
  );
};
export default CargoComponent;
