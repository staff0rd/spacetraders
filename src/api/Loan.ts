import { LoanType } from "./LoanType";

export interface Loan {
  due: string;
  id: string;
  repaymentAmount: number;
  status: string;
  type: LoanType;
}
