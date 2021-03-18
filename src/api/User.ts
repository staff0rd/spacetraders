import { Loan } from "./Loan";
import { Ship } from "./Ship";

export interface User {
  // from getToken
  createdAt: Date;
  email?: any;
  id: string;
  picture?: any;
  updatedAt: Date;
  // from getUser
  credits: number;
  username: string;
  ships: Ship[];
  loans: Loan[];
}
