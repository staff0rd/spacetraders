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
    <>
      {ship.cargo.map((cargo, ix) => (
        <Typography key={ix}>
          {cargo.quantity}x {cargo.good}
        </Typography>
      ))}
    </>
  );
};
export default CargoComponent;
