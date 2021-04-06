import { Grid } from "@material-ui/core";
import { AvailableShip } from "../../api/AvailableShip";
import { AutoBuy } from "./AutoBuy";

type Props = {
  availableShips: AvailableShip[];
};

export const Automation = ({ availableShips }: Props) => {
  return (
    <>
      <Grid container>
        <Grid item xs={12} md={6}>
          <AutoBuy availableShips={availableShips} />
        </Grid>
      </Grid>
    </>
  );
};
