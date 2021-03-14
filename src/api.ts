const address = "https://api.spacetraders.io/";

type Status = {
  status: string;
};
export const getStatus = async () => {
  const result = await fetch(`${address}game/status`);
  const json: Status = await result.json();
  return json;
};
