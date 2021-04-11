/**
 * @file Handles the table settings modal.
 * @module
 * @copyright 2021 Markus Leupold-Löwenthal
 * @license This file is part of FreeBeeGee.
 *
 * FreeBeeGee is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, either version 3 of the License, or (at your option) any
 * later version.
 *
 * FreeBeeGee is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with FreeBeeGee. If not, see <https://www.gnu.org/licenses/>.
 */

import _ from '../../../FreeDOM.js'

import {
  createModal,
  getModal,
  modalClose
} from '../../../modal.js'
import {
  getTemplate,
  updateState,
  restoreState,
  getTable,
  deleteTable,
  stateGetTablePref,
  stateSetTablePref
} from '../state.js'
import { pollTimes, syncTimes } from '../sync.js'
import { navigateToJoin } from '../../../nav.js'

// --- public ------------------------------------------------------------------

/**
 * Show the settings modal.
 */
export function modalSettings () {
  createModal()

  _('#modal-header').innerHTML = `
    <h3 class="modal-title">Table settings</h3>
  `
  _('#modal-body').innerHTML = `
    <div id="tabs-settings" class="tabs">
      <input id="tab-1" type="radio" name="tabs">
      <input id="tab-2" type="radio" name="tabs">
      <div class="tabs-tabs">
        <label for="tab-1" class="tabs-tab">My preferences</label>
        <label for="tab-2" class="tabs-tab">Table settings</label>
      </div>
      <div class="tabs-content">
        <form class="container"><div id="tab-my" class="row">
          <div class="col-12">
            <p>This tab only affects your browser, not the other players.</p>

            <h2 class="h3">Statistics</h2>
            <p>Table: ${getTemplate().gridWidth}x${getTemplate().gridHeight} spaces, ${_('.piece.piece-token').nodes().length}x token, ${_('.piece.piece-overlay').nodes().length}x overlay, ${_('.piece.piece-tile').nodes().length}x tile, ${_('.piece.piece-other').nodes().length}x other</p>
            <p>Refresh time: ${Math.ceil(pollTimes.reduce((a, b) => a + b) / pollTimes.length)}ms server + ${Math.ceil(syncTimes.reduce((a, b) => a + b) / syncTimes.length)}ms browser</p>

            <h2 class="h3">Render quality</h2>
            <p>If your table seems to be slow, you can change the render quality here:</p>
            <input type="range" min="0" max="3" value="${stateGetTablePref('renderQuality') ?? 3}" class="slider" id="quality">
            <p class="if-quality-low"><strong>Low:</strong> No shadows, bells and whistles. Will look very flat.</p>
            <p class="if-quality-medium"><strong>Medium:</strong> Simplified shadows and no rounded corners.</p>
            <p class="if-quality-high"><strong>High:</strong> Some minor details are missing.</p>
            <p class="if-quality-ultra"><strong>Ultra:</strong> Full details and random piece rotation are enabled.</p>
          </div>
        </div></form>
        <form class="container"><div id="tab-server" class="row">
          <button class="is-hidden" type="submit" disabled aria-hidden="true"></button>

          <div class="col-12">
            <h2 class="h3">Danger zone</h2>
            <p>The following settings will affect the whole table and all players. There will be no <em>undo</em> if you push any of those buttons!</p>
            <p><input id="danger" type="checkbox"><label for="danger">Enable danger mode.</label></p>
          </div>

          <div class="col-12 col-sm-8">
            <p>Clearing the table will remove all pieces from it. The library will not be changed.</p>
          </div>
          <div class="col-12 col-sm-4">
            <button id="btn-table-clear" class="btn btn-wide" disabled>Clear table</button>
          </div>
          <div class="col-12 col-sm-8">
            <p>Resetting the table will revert it to the initial setup. The library will not be changed.</p>
          </div>
          <div class="col-12 col-sm-4">
            <button id="btn-table-reset" class="btn btn-wide" disabled>Reset table</button>
          </div>
          <div class="col-12 col-sm-8">
            <p>Deleting your table will permanently erase it and it's library.</p>
          </div>
          <div class="col-12 col-sm-4">
            <button id="btn-table-delete" class="btn btn-wide" disabled>Delete table</button>
          </div>
        </div></form>
      </div>
    </div>
  `
  _('#modal-footer').innerHTML = `
    <button id='btn-close' type="button" class="btn btn-primary">Close</button>
  `

  // store/retrieve selected tab
  _('input[name="tabs"]').on('change', change => {
    stateSetTablePref('modalSettingsTab', change.target.id)
  })
  const preselect = stateGetTablePref('modalSettingsTab') ?? 'tab-1'
  _('#' + preselect).checked = true

  _('#quality').on('change', () => changeQuality(Number(_('#quality').value)))

  _('#danger').on('click', () => {
    if (_('#danger').checked) {
      _('#btn-table-clear').disabled = false
      _('#btn-table-reset').disabled = false
      _('#btn-table-delete').disabled = false
    } else {
      _('#btn-table-clear').disabled = true
      _('#btn-table-reset').disabled = true
      _('#btn-table-delete').disabled = true
    }
  })

  _('#btn-close').on('click', () => getModal().hide())
  _('#modal').on('hidden.bs.modal', () => modalClose())

  _('#btn-table-clear').on('click', click => {
    click.preventDefault()
    updateState([])
  })
  _('#btn-table-reset').on('click', click => {
    click.preventDefault()
    restoreState(0)
  })
  _('#btn-table-delete').on('click', click => {
    click.preventDefault()
    deleteTable().then(() => navigateToJoin(getTable().name))
  })

  getModal().show()
}

/**
 * Adapt the quality settings based on the current slider position.
 *
 * Will add matching .is-quality-* classes to the body.
 *
 * @param {Number} value Quality setting. 0 = low, 1 = medium, 2 = high, 3 = ultra
 */
export function changeQuality (value) {
  const body = _('body').remove('.is-quality-low', '.is-quality-medium', '.is-quality-high', '.is-quality-ultra')
  stateSetTablePref('renderQuality', value)
  switch (value) {
    case 0:
      body.add('.is-quality-low')
      break
    case 1:
      body.add('.is-quality-medium')
      break
    case 2:
      body.add('.is-quality-high')
      break
    case 3:
    default:
      body.add('.is-quality-ultra')
  }
}

// --- internal ----------------------------------------------------------------
