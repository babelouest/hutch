export class Row {
  value: any;
  saveValue?: any;
  valueVerified: string;
  type: string;
  tags?: string[];
  edit?: boolean;
  show?: boolean;
}

export class CoinDisplayed {
  name?: string;
  icon?: string;
  rows: Array<Row>;
  displayName: string;
}

export class Coin {
  name?: string;
  data: string;
}
