import { makeStyles, useTheme } from "@material-ui/core";
import Pixi from "./Pixi";
const useStyles = makeStyles((theme) => ({
  root: {
    height: "calc(100vh - 112px)",
  },
}));
export const Map = () => {
  const classes = useStyles();
  const theme = useTheme();
  return (
    <>
      <div className={classes.root}>
        <Pixi backgroundColor={"#ff0000"} />
      </div>
    </>
  );
};
