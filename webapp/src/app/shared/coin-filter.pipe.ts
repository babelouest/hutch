import { Pipe, PipeTransform } from '@angular/core';

import { CoinDisplayed } from '../shared/coin';

import * as _ from 'lodash';

@Pipe({
  name: 'myCoinFilter',
  pure: false
})
export class CoinFilterPipe implements PipeTransform {
  transform(coinList: CoinDisplayed[], args: string): any[] {
    return _.sortBy(_.filter(coinList, (curCoin) => {
      return !args || (curCoin.displayName.toLowerCase().indexOf(args.toLowerCase()) >= 0);
    }), ['editCoinMode', 'displayName']);
  }
}
