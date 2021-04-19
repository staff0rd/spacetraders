import { useEffect, useRef } from "react";

export const useInterval = (
  callback: () => void,
  delay: number,
  dependencies: any[] = []
) => {
  const savedCallbackRef = useRef<TimerHandler>();

  useEffect(() => {
    savedCallbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    // @ts-ignore
    const handler = (...args: any[]) => savedCallbackRef.current!(...args);
    handler();

    if (delay !== null) {
      const intervalId = setInterval(handler, delay);
      return () => clearInterval(intervalId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [delay, ...dependencies]);
};
