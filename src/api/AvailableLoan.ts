import { LoanType } from "./LoanType";

export interface AvailableLoan {
  amount: number;
  collateralRequired: boolean;
  rate: number;
  termInDays: number;
  type: LoanType;
}
