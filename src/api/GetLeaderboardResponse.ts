export type GetLeaderboardResponse = {
  netWorth: NetWorth[];
  userNetWorth: UserNetWorth;
};

export interface NetWorth {
  username: string;
  netWorth: number;
  rank: number;
}

export interface UserNetWorth {
  username: string;
  netWorth: number;
  rank: number;
}
