export enum ShipOrders {
  Trade = "Trade",
  Halt = "Halt",
  Probe = "Probe",
  GoTo = "GoTo",
}

export enum ShipOrderStatus {
  Pending,
  Completed,
}

export interface IGotoOrderPayload {
  location: string;
}

export interface IShipOrder {
  id?: number;
  shipId: string;
  order: ShipOrders;
  createdAt: string;
  createdReason: string;
  completedAt?: string;
  status: ShipOrderStatus;
  payload?: IGotoOrderPayload;
}
