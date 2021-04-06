export interface IAutomation {
  autoBuy: {
    shipType: string;
    credits: number;
    maxShips: number;
    on: boolean;
  };
}

export const getAutomation = (): IAutomation => {
  const store = localStorage.getItem("automation");
  return store
    ? JSON.parse(store)
    : {
        autoBuy: {
          shipType: "JW-MK-I",
          credits: 100000,
          maxShips: 20,
          on: true,
        },
      };
};

export const setAutomation = (automation: IAutomation) => {
  localStorage.setItem("automation", JSON.stringify(automation));
};
