export type NetWorthLineItem = {
  category: Category;
  value: number;
  description: string;
  quantity: number;
};
export type Category = "asset" | "debt";
