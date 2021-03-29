import { DataTable } from "../DataTable";

export const Summary = ({ items }: { items: SummaryItem[] }) => {
  const rows = items
    .sort((a, b) => b.quantity - a.quantity)
    .map((i) => [i.username, i.quantity]);
  const columns = ["Username", "Ships"];
  return <DataTable title="summary" rows={rows} columns={columns} />;
};
type SummaryItem = { quantity: number; username: string };
