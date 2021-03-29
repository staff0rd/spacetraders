export type FlightPlan = {
  createdAt: string;
  arrivesAt: string;
  departure: string;
  destination: string;
  distance: number;
  fuelConsumed: number;
  fuelRemaining: number;
  id: string;
  shipId: string;
  terminatedAt: string | null;
  timeRemainingInSeconds: number;
};
