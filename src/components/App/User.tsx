import db from "data";
import { DateTime } from "luxon";
import { Typography, Popover, List, ListItem } from "@material-ui/core";
import PersonIcon from "@material-ui/icons/Person";
import { makeStyles, createStyles, Theme } from "@material-ui/core/styles";
import { useState, useEffect } from "react";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: "flex",
    },
    popover: {
      pointerEvents: "none",
    },
    paper: {
      padding: theme.spacing(1),
    },
    user: {
      fontSize: 12,
      marginBottom: theme.spacing(1),
    },
    text: {
      fontSize: 12,
      margin: 0,
      padding: 0,
    },
    header: {
      fontSize: 12,
      margin: 0,
      padding: 0,
      fontWeight: "bold",
    },
  })
);

export const User = ({ username }: { username: string }) => {
  const classes = useStyles();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [activeUsers, setActiveUsers] = useState<string[]>([]);

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  useEffect(() => {
    const doWork = async () => {
      const fiveMinsAgo = DateTime.local().minus({ minutes: 5 }).toISO();
      const currentlyActiveUsers: string[] = [];
      const active = await db.intel
        .where("lastSeen")
        .above(fiveMinsAgo)
        .filter((p) => !!p.departure)
        .toArray();
      active.forEach((a) => {
        if (!currentlyActiveUsers.includes(a.username))
          currentlyActiveUsers.push(a.username);
      });
      setActiveUsers(currentlyActiveUsers);
    };
    doWork();
    const interval = setInterval(doWork, 10000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <div
        className={classes.root}
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
      >
        <Typography>{activeUsers?.length}</Typography>
        <PersonIcon />
      </div>
      <Popover
        id="mouse-over-popover"
        className={classes.popover}
        classes={{
          paper: classes.paper,
        }}
        open={open}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <Typography className={classes.user}>{username}</Typography>
        <Typography className={classes.header}>Currently active:</Typography>
        <List>
          {activeUsers
            ?.filter((u) => u !== username)
            .map((u) => (
              <ListItem className={classes.text}>{u ?? "unknown"}</ListItem>
            ))}
        </List>
      </Popover>
    </>
  );
};
