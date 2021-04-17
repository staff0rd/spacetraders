import { Grid, Typography } from "@material-ui/core";
import { GoodIcon } from "components/Trades/GoodIcon";
import { getLocation } from "data/localStorage/locationCache";
import NumberFormat from "react-number-format";
import { DataTable, right } from "../DataTable";
import { Structures } from "./Structures";

type Props = {
  symbol: string;
};
export const Location = ({ symbol }: Props) => {
  const location = getLocation(symbol);

  if (!location) {
    return (
      <Typography variant="h6">
        No data on this location, send a probe
      </Typography>
    );
  }

  const columns = [right("Qty"), "", right("Buy"), right("Sell"), right("㎥")];
  const rows = location?.marketplace?.map((row) => [
    right(
      <NumberFormat
        value={row.quantityAvailable}
        thousandSeparator=","
        displayType="text"
      />
    ),
    <GoodIcon good={row.symbol} />,
    right(
      <NumberFormat
        value={row.purchasePricePerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={row.sellPricePerUnit}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
    right(
      <NumberFormat
        value={row.volumePerUnit}
        thousandSeparator=","
        displayType="text"
      />
    ),
  ]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Typography variant="h6">
          {location?.name} | {location?.symbol} | {location?.type}
        </Typography>
      </Grid>
      <Grid item xs={12}>
        {location?.messages?.map((m) => (
          <Typography>{m}</Typography>
        ))}
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="h5">Market</Typography>
        <DataTable title="Market" rows={rows || []} columns={columns} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Typography variant="h5">Structures</Typography>
        {location?.structures?.map((s) => (
          <Structures structure={s} key={s.id} />
        ))}
      </Grid>
    </Grid>
  );
};
