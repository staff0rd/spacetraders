import * as PIXI from "pixi.js";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { makeStyles } from "@material-ui/core/styles";
import { useResizeListener } from "./useResizeListener";

interface PixiProps {
  backgroundColor?: string;
  onAppChange?: (app: PIXI.Application) => void;
}

const useStyles = makeStyles((theme) => ({
  pixi: {
    width: "100%",
    height: "100%",
  },
}));

const Pixi = ({ backgroundColor, onAppChange }: PixiProps) => {
  const classes = useStyles();
  const [app, setApp] = useState<PIXI.Application>();
  const pixiElement = useRef<HTMLDivElement>(null);

  const resize = (pixi: PIXI.Application) => {
    if (pixiElement.current) {
      const size = {
        width: pixiElement.current!.clientWidth,
        height: pixiElement.current!.clientHeight,
      };
      pixi.renderer.resize(size.width, size.height);
      console.log(`resized pixi to ${size.width}x${size.height}`);
    }
  };

  const onResize = useCallback(() => {
    if (app) {
      resize(app);
      setTimeout(() => resize(app), 1000);
    } else {
      console.log("no app to resize");
    }
  }, [app]);

  useEffect(() => {
    function colorToSigned24Bit(s: string) {
      return (parseInt(s.substr(1), 16) << 8) / 256;
    }
    const pixi = new PIXI.Application({
      //autoResize: true,
      backgroundColor: colorToSigned24Bit(backgroundColor || "#FFFFFF"),
    });
    resize(pixi);
    setApp(pixi);
    onAppChange && onAppChange(pixi);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backgroundColor]);

  useEffect(() => {
    const element = pixiElement.current;
    if (element && app) {
      element.appendChild(app.view);
      onResize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [app, pixiElement.current]);

  useResizeListener(onResize);

  return <div id="pixi-root" className={classes.pixi} ref={pixiElement} />;
};

export default Pixi;
