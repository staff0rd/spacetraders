import { Ship } from "../api/Ship";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";

type Props = {
  ship: Ship;
};
const CargoComponent = ({ ship }: Props) => {
  return (
    <List aria-label="cargo">
      {ship.cargo.map((cargo, ix) => (
        <ListItem key={ix}>
          <ListItemText primary={`${cargo.quantity}x ${cargo.good}`} />
        </ListItem>
      ))}
    </List>
  );
};
export default CargoComponent;
