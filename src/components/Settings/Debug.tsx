import React from "react";
import { getDebug, setDebug } from "../../data/localStorage/IDebug";
import { DebugCheckbox } from "./DebugCheckbox";

export const Debug = () => {
  const debug = getDebug();

  return (
    <>
      <DebugCheckbox
        hideWhenOff
        title="Ship focused"
        initialValue={!!debug.focusShip}
        persist={(value) =>
          !value ? setDebug({ focusShip: undefined }) : () => {}
        }
      />
      <DebugCheckbox
        title="Debug Player Machine"
        persist={(value) => setDebug({ debugPlayerMachine: value })}
        initialValue={debug.debugPlayerMachine}
      />
      <DebugCheckbox
        title="Debug Probe Machine"
        persist={(value) => setDebug({ debugProbeMachine: value })}
        initialValue={debug.debugProbeMachine}
      />
      <DebugCheckbox
        title="Debug Trade Machine"
        persist={(value) => setDebug({ debugTradeMachine: value })}
        initialValue={debug.debugTradeMachine}
      />
      <DebugCheckbox
        title="Debug Upgrade Machine"
        persist={(value) => setDebug({ debugUpgradeMachine: value })}
        initialValue={debug.debugUpgradeMachine}
      />
    </>
  );
};
