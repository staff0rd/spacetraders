import { LoanType } from "./LoanType";

export interface Loan {
  due: Date;
  id: string;
  repaymentAmount: number;
  status: string;
  type: LoanType;
}
