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