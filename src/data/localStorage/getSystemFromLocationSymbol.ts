export const getSystemFromLocationSymbol = (location: string) =>
  location.match(/([A-Z0-9]+)/g)![0];
