import React, { useState } from "react";

import {
  Dialog,
  DialogActions,
  DialogContent,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { CustomSelect } from "components/CustomSelect";
import { getLocations } from "data/localStorage/locationCache";

const useStyles = makeStyles((theme) => ({
  paper: {
    width: "40%",
    [theme.breakpoints.down("sm")]: {
      width: "70%",
    },
  },
}));

type Props = {
  action: (location: string) => void;
  setOpen: (open: boolean) => void;
  open: boolean;
  cancel: () => void;
};

export const SelectLocationDialog = (props: Props) => {
  const { action, setOpen, open, cancel } = props;
  const locations = getLocations().map((x) => x.symbol);
  const [location, setLocation] = useState(locations[0]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleOk = () => {
    setOpen(false);
    action(location);
  };

  const classes = useStyles();

  return (
    <Dialog
      PaperProps={{
        className: classes.paper,
      }}
      open={open}
      onClose={handleClose}
    >
      <DialogContent>
        <Typography variant="h5">Select location</Typography>
        <CustomSelect
          name="Location"
          hideAll
          values={locations}
          setValue={setLocation}
          value={location}
        />
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={handleOk}>
          Ok
        </Button>
        <Button
          onClick={() => {
            handleClose();
            cancel();
          }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};
