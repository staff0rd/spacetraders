import { getLocation } from "data/localStorage/locationCache";

type Props = {
  symbol: string;
};
export const Location = ({ symbol }: Props) => {
  const location = getLocation(symbol);
  return <>{location?.name}</>;
};
