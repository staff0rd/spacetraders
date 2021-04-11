import React, { useState } from "react";
import { Checkbox, FormControlLabel } from "@material-ui/core";

type Props = {
  initialValue: boolean;
  persist: (value: boolean) => void;
  title: string;
  hideWhenOff?: boolean;
};

export const DebugCheckbox = ({
  initialValue,
  persist,
  title,
  hideWhenOff,
}: Props) => {
  const [debug, setDebug] = useState(initialValue);
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDebug(event.target.checked);
    persist(event.target.checked);
  };
  if (hideWhenOff && !debug) return <></>;
  return (
    <FormControlLabel
      control={<Checkbox checked={debug} onChange={handleChange} />}
      label={title}
    />
  );
};
