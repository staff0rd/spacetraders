import { Grid } from "@material-ui/core";
import { AvailableShip } from "../../../api/AvailableShip";
import { AutoBuy } from "./AutoBuy";
import { AutoUpgrade } from "./AutoUpgrade";

type Props = {
  availableShips: AvailableShip[];
};

export const Automation = ({ availableShips }: Props) => {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <AutoBuy availableShips={availableShips} />
        </Grid>
        <Grid item xs={12} md={6}>
          <AutoUpgrade availableShips={availableShips} />
        </Grid>
      </Grid>
    </>
  );
};
