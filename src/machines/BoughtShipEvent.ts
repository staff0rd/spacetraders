import { EventObject } from "xstate";
import * as api from "../api";
import { IShipDetail } from "../data/IShipDetail";

export type BoughtShipEvent = EventObject & {
  type: "BOUGHT_SHIP";
  data: { response: api.GetUserResponse; shipNames: IShipDetail[] };
};
