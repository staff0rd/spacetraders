import React, { ReactNode } from "react";

import {
  Dialog,
  DialogActions,
  DialogContent,
  makeStyles,
  Typography,
} from "@material-ui/core";
import Button from "@material-ui/core/Button";

const useStyles = makeStyles((theme) => ({
  paper: {
    width: "40%",
    [theme.breakpoints.down("sm")]: {
      width: "70%",
    },
  },
}));

type Props = {
  header: ReactNode;
  content: ReactNode;
  action: () => void;
  setOpen: (open: boolean) => void;
  open: boolean;
};

export const ConfirmDialog = (props: Props) => {
  const { header, content, action, setOpen, open } = props;

  const handleClose = () => {
    setOpen(false);
  };

  const handleOk = () => {
    setOpen(false);
    action();
  };

  const classes = useStyles();

  const getContent = () => {
    if (typeof content === "string")
      return <Typography variant="body1">{content}</Typography>;
    else return content;
  };
  const getHeader = () => {
    if (typeof header === "string")
      return <Typography variant="h5">{header}</Typography>;
    else return header;
  };

  return (
    <Dialog
      PaperProps={{
        className: classes.paper,
      }}
      open={open}
      onClose={handleClose}
    >
      <DialogContent>
        {getHeader()}
        {getContent()}
      </DialogContent>
      <DialogActions>
        <Button color="primary" onClick={handleOk}>
          Ok
        </Button>
        <Button onClick={handleClose}>Cancel</Button>
      </DialogActions>
    </Dialog>
  );
};
