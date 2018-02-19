/**
 *
 * Hutch - Password and private data locker
 *
 * Application front-end
 *
 * Copyright 2017 Nicolas Mora <mail@babelouest.org>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Affero General Public License
 * License as published by the Free Software Foundation;
 * version 3 of the License.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU General Public
 * License along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
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
