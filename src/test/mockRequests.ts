import * as req from "api/makeRequest";
import Bottleneck from "bottleneck";

const mockRequestCache: { [path: string]: any } = {};

export const mockRequest = <T>(path: string, response: T = {} as T) => {
  mockRequestCache[path] = response;
};

export const setupMockRequests = () => {
  jest.spyOn(req, "makeRequest").mockImplementation((path) => {
    const result = mockRequestCache[path];
    if (result) return result;
    throw new Error(`Should mock this: ${path}`);
  });
  jest
    .spyOn(Bottleneck.prototype, "schedule")
    .mockImplementation((func: any) => func());
};
