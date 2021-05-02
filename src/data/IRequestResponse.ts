export interface IRequestResponse {
  id?: number;
  path: string;
  isError: boolean;
  request: object;
  response: object;
  shipId: string;
  timestamp: string;
}
