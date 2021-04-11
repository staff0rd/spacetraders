import * as api from "../../api";

export const setLocalUser = (response: api.GetTokenResponse) => {
  localStorage.setItem("player", JSON.stringify(response));
};

export const getLocalUser = () => {
  const player = localStorage.getItem("player");
  if (player) {
    const parsed: api.GetTokenResponse = JSON.parse(player);
    return { token: parsed.token, username: parsed.user.username };
  }
};
