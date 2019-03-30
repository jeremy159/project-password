export interface PasswordCrackingTimes {
  minimum: number;
  maximum: number;
  total: number;
  data: {
    seconds: TickValue[],
    minutes: TickValue[],
    hours: TickValue[],
    days: TickValue[],
    months: TickValue[],
    years: TickValue[]
  };
}

export interface TickValue {
  t: number;
  value: number;
}
