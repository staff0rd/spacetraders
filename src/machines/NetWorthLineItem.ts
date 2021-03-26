export type NetWorthLineItem = {
  category: Category;
  value: number;
  description: string;
};
export type Category = "asset" | "debt";
