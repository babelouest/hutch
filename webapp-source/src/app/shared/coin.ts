export class Row {
  value: any;
  valueVerified: string;
  type: string;
  tags?: string[];
}

export class CoinDisplayed {
  name: string;
  rows: Array<Row>;
  displayName: string;
}

export class Coin {
  name?: string;
  data: string;
}
