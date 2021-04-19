import * as api from "../../api";
import { Keys } from "./Keys";

export const setLocalUser = (response: api.GetTokenResponse) => {
  localStorage.setItem(Keys.Player, JSON.stringify(response));
};

export const getLocalUser = () => {
  const player = localStorage.getItem(Keys.Player);
  if (player) {
    const parsed: api.GetTokenResponse = JSON.parse(player);
    return { token: parsed.token, username: parsed.user.username };
  }
};
