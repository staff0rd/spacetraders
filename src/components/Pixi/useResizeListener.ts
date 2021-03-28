import { useEffect } from "react";
export const useResizeListener = (onResize: any) => {
  useEffect(() => {
    window.addEventListener("resize", () => setTimeout(onResize, 500));
    return () => window.removeEventListener("resize", onResize);
  }, [onResize]);
};
