export interface IApiError {
  id?: number;
  code: number;
  message: string;
  path: string;
  data?: string;
  created: string;
}
