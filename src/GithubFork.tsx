import React from "react";
import { makeStyles } from "@material-ui/core/styles";

const useStyles = makeStyles((theme) => ({
  link: {
    float: "right",
    position: "absolute",
    right: 0,
    [theme.breakpoints.down("sm")]: {
      left: 0,
      right: "auto",
      transform: "rotate(-90deg)",
    },
  },
}));

export const GithubFork = () => {
  const classes = useStyles();
  return (
    <a
      className={classes.link}
      href="https://github.com/staff0rd/spacetraders"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img
        width={149}
        height={149}
        src="https://github.blog/wp-content/uploads/2008/12/forkme_right_darkblue_121621.png?resize=149%2C149"
        alt="Fork me on GitHub"
      />
    </a>
  );
};
