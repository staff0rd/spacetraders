import { Ship } from "../api/Ship";
import Typography from "@material-ui/core/Typography";

// const useStyles = makeStyles((theme) => ({
//   list: {},
// }));

type Props = {
  ship: Ship;
};

const CargoComponent = ({ ship }: Props) => {
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
