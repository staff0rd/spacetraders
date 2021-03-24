import React from "react";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Box from "@material-ui/core/Box";
import { Typography, Tooltip } from "@material-ui/core";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    iconAndValue: {
      display: "inline-flex",
    },
    iconValue: {
      cursor: "default",
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(2),
    },
  })
);

type Props = {
  tooltip: string;
  icon: React.ReactNode;
  value: React.ReactNode;
};

export const IconAndValue = ({ icon, tooltip, value }: Props) => {
  const classes = useStyles();
  return (
    <Tooltip title={tooltip}>
      <Box className={classes.iconAndValue}>
        {icon}
        <Typography className={classes.iconValue}>{value}</Typography>
      </Box>
    </Tooltip>
  );
};
