import { makeStyles } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import { ReactNode } from "react";

type Props<T> = {
  name: string;
  value: string;
  setValue: (value: string) => void;
  values: T[];
  hideAll?: boolean;
  displayMap?: (value: T) => ReactNode;
  valueMap?: (value: T) => string;
  disableMap?: (value: T) => boolean;
  disabled?: boolean;
  size?: "small" | "medium";
};
const useStyles = makeStyles((theme) => ({
  formControl: {
    margin: theme.spacing(1),
    minWidth: 120,
  },
}));

const nameToLabel = (name: string) => name.toLowerCase().replace(" ", "-");

export const CustomSelect = <T,>({
  name,
  value,
  setValue,
  values,
  hideAll,
  displayMap,
  disableMap,
  valueMap,
  disabled,
  size,
}: Props<T>) => {
  const classes = useStyles();
  return (
    <FormControl className={classes.formControl} size={size}>
      <InputLabel id={`select-${nameToLabel(name)}-label`}>{name}</InputLabel>
      <Select
        labelId={`select-${nameToLabel(name)}-label`}
        id={`select-${nameToLabel(name)}`}
        value={value}
        disabled={disabled}
        placeholder="All"
        onChange={(e) => setValue(e.target.value as string)}
      >
        {!hideAll && <MenuItem value={""}>All</MenuItem>}
        {values!.map((v: any, ix) => (
          <MenuItem
            key={ix}
            value={valueMap ? valueMap(v) : v}
            disabled={disableMap ? disableMap(v) : false}
          >
            {displayMap ? displayMap(v) : v}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
