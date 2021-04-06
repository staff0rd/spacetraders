import {
  makeStyles,
  TextField,
  FormControl,
  IconButton,
} from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/DeleteForever";
import AddIcon from "@material-ui/icons/AddCircle";
import { useEffect, useState } from "react";
import { AvailableShip } from "../../../api/AvailableShip";
import { CustomSelect } from "../../CustomSelect";
import { IUpgrade } from "../../../data/IAutomation";
import NumberFormat from "react-number-format";

const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    width: 120,
  },
  button: {
    marginTop: theme.spacing(1),
  },
}));

type Props = {
  upgrade: IUpgrade;
  availableShips: AvailableShip[];
  addUpgrade: (
    role: string,
    fromShipType: string,
    toShipType: string,
    credits: number,
    maxShips: number
  ) => unknown;
  removeUpgrade: () => unknown;
  updateUpgrade: (upgrade: IUpgrade) => unknown;
  canDelete: boolean;
  canAdd: boolean;
};

export const Upgrade = ({
  upgrade,
  availableShips,
  addUpgrade,
  removeUpgrade,
  updateUpgrade,
  canDelete,
  canAdd,
}: Props) => {
  const classes = useStyles();
  const roles = ["Trade", "Probe"];
  const [role, setRole] = useState(upgrade.role);
  const [fromShipType, setFromShipType] = useState(upgrade.fromShipType);
  const [toShipType, setToShipType] = useState(upgrade.toShipType);
  const [credits, setCredits] = useState(upgrade.credits);
  const [maxShips, setMaxShips] = useState(upgrade.maxShips);

  useEffect(() => {
    updateUpgrade({ role, fromShipType, toShipType, credits, maxShips });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, fromShipType, toShipType, credits, maxShips]);

  return (
    <>
      <CustomSelect
        name="Role"
        value={role}
        setValue={setRole}
        values={roles}
        hideAll
      />
      <CustomSelect
        name="From"
        value={fromShipType}
        setValue={setFromShipType}
        values={availableShips
          .map((av) => av.type)
          .sort((a, b) => a.localeCompare(b))}
        hideAll
      />
      <CustomSelect
        name="To"
        value={toShipType}
        setValue={setToShipType}
        values={availableShips
          .map((av) => av.type)
          .sort((a, b) => a.localeCompare(b))}
        hideAll
      />
      <FormControl className={classes.formControl}>
        <NumberFormat
          value={credits}
          customInput={TextField}
          prefix={"$"}
          type="text"
          label="Credits"
          thousandSeparator
          onValueChange={({ value: v }) => setCredits(Number(v))}
        />
      </FormControl>
      <FormControl className={classes.formControl}>
        <TextField
          type="number"
          label="Max ships"
          value={maxShips}
          onChange={(e) => setMaxShips(Number(e.target.value))}
        />
      </FormControl>
      {canDelete && (
        <IconButton
          className={classes.button}
          title="Delete"
          onClick={() => removeUpgrade()}
        >
          <DeleteIcon />
        </IconButton>
      )}
      {canAdd && (
        <IconButton
          className={classes.button}
          title="Add"
          onClick={() =>
            addUpgrade(role, fromShipType, toShipType, credits, maxShips)
          }
        >
          <AddIcon />
        </IconButton>
      )}
    </>
  );
};
