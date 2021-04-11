import { CircularProgress, makeStyles } from "@material-ui/core";
import { useRef, useState } from "react";
import { SystemContext } from "../../../machines/MarketContext";
import { CustomSelect } from "../../CustomSelect";
import { Location } from "./Location";
import { drawMap } from "./drawMap";

const useStyles = makeStyles((theme) => ({
  root: {
    height: "calc(100vh - 112px - 64px)",
    position: "relative",
  },
  location: {
    display: "inline",
    position: "absolute",
  },
  icon: {
    cusor: "pointer",
  },
  label: {
    transform: "translateX(-25%)",
  },
}));

type Props = {
  systems?: SystemContext;
};

export const Map = ({ systems }: Props) => {
  const ref = useRef(null);
  const classes = useStyles();

  const [system, setSystem] = useState("OE");

  if (!systems || !Object.keys(systems).length)
    return <CircularProgress size={48} />;

  const locations = drawMap(
    Object.keys(systems[system]).map((key) => systems[system][key]),
    (ref.current as any)?.clientWidth,
    (ref.current as any)?.clientHeight
  );

  return (
    <>
      <CustomSelect
        value={system}
        setValue={setSystem}
        values={Object.keys(systems)}
        hideAll
        name="System"
      />
      <div className={classes.root} ref={ref}>
        {locations &&
          locations.map((l, ix) => (
            <>
              <Location
                key={ix}
                location={l}
                parentWidth={(ref.current as any)?.offsetWidth}
                parentHeight={(ref.current as any)?.offsetHeight}
              />
            </>
          ))}
      </div>
    </>
  );
};
