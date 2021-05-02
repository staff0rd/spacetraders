import { useInterval } from "components/useInterval";
import * as api from "api";
import { getLocalUser } from "data/localStorage/getLocalUser";
import { useState } from "react";
import { GetLeaderboardResponse } from "api/GetLeaderboardResponse";
import CircularProgress from "@material-ui/core/CircularProgress";
import Grid from "@material-ui/core/Grid";
import { DataTable, right } from "components/DataTable";
import NumberFormat from "react-number-format";

export const Leaderboard = () => {
  const [response, setResponse] = useState<GetLeaderboardResponse | null>(null);
  useInterval(
    async () => {
      const result = await api.getLeaderboard(getLocalUser()!.token);
      setResponse(result);
    },
    60000,
    []
  );

  if (!response) return <CircularProgress color="primary" size={48} />;

  const columns = ["Rank", "User", right("Net worth")];
  const rows = response.netWorth.map((row) => [
    row.rank,
    row.username,
    right(
      <NumberFormat
        value={row.netWorth}
        thousandSeparator=","
        displayType="text"
        prefix="$"
      />
    ),
  ]);

  if (
    response.userNetWorth[0].rank >
    response.netWorth[response.netWorth.length - 1].rank
  ) {
    const { rank, netWorth, username } = response.userNetWorth[0];
    rows.push([
      rank,
      username,
      right(
        <NumberFormat
          value={netWorth}
          thousandSeparator=","
          displayType="text"
          prefix="$"
        />
      ),
    ]);
  }

  return (
    <Grid container>
      <Grid item xs={12} md={6}>
        <DataTable rows={rows} columns={columns} title="Leaderboard" />
      </Grid>
    </Grid>
  );
};
