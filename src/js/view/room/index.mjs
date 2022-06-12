/**
 * @file The room handling. Mainly in charge of UI, menus and managing the
 *       tabletop canvas itself - but not the stuff on the tabletop.
 * @module
 * @copyright 2021-2022 Markus Leupold-Löwenthal
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

import _ from '../../lib/FreeDOM.mjs'

import {
  navigateToJoin
} from '../../app.mjs'

import {
  selectionGetPieces,
  selectionGetFeatures,
  isSelectedId,
  selectNode,
  selectionClear
} from './tabletop/selection.mjs'

import {
  iconLogo,
  iconDice,
  iconToken,
  iconOverlay,
  iconTile,
  iconAdd,
  iconEdit,
  iconRotate,
  iconFlip,
  iconTop,
  iconBottom,
  iconClone,
  iconDelete,
  iconShuffle,
  iconDownload,
  iconHelp,
  iconQuit,
  iconRuler
} from '../../lib/icons.mjs'

import {
  loadRoom,
  getRoom,
  getServerInfo,
  PREFS,
  cleanupStore,
  getServerPreference,
  setServerPreference,
  getRoomPreference,
  setRoomPreference,
  getTablePreference,
  setTablePreference,
  getTableNo,
  setTableNo,
  getTemplate
} from '../../state/index.mjs'

import {
  editSelected,
  rotateSelected,
  cloneSelected,
  toTopSelected,
  toBottomSelected,
  flipSelected,
  randomSelected,
  deleteSelected,
  url
} from '../../view/room/tabletop/index.mjs'

import {
  LAYER_TILE,
  LAYER_OVERLAY,
  LAYER_TOKEN,
  LAYER_OTHER,
  TYPE_HEX,
  getSetupCenter
} from '../../view/room/tabletop/tabledata.mjs'

import {
  enableDragAndDrop,
  getMouseCoords,
  toggleLMBLos,
  isLMBLos
} from '../../view/room/mouse/index.mjs'

import {
  startAutoSync
} from '../../view/room/sync.mjs'

import {
  modalLibrary
} from '../../view/room/modal/library.mjs'

import {
  modalHelp
} from '../../view/room/modal/help.mjs'

import {
  modalDisabled
} from '../../view/room/modal/disabled.mjs'

import {
  modalDemo
} from '../../view/room/modal/demo.mjs'

import {
  modalSettings,
  changeQuality
} from '../../view/room/modal/settings.mjs'

import {
  clamp,
  brightness
} from '../../lib/utils.mjs'

import {
  DEMO_MODE
} from '../../api/index.mjs'

// --- public ------------------------------------------------------------------

/**
 * Set the room mouse cursor (pointer, cross, ...)
 *
 * @return {String} Cursor (class), or undefined to revert to default cursor.
 */
export function setCursor (cursor) {
  scroller.remove('.cursor-*')
  if (cursor) {
    scroller.add(cursor)
  } else {
    if (isLMBLos()) {
      scroller.add('.cursor-cross')
    }
  }
}

/**
 * Get current top-left tabletop scroll position.
 *
 * @return {Object} Contains x and y in pixel.
 */
export function getScrollPosition () {
  return {
    x: scroller.scrollLeft,
    y: scroller.scrollTop
  }
}

/**
 * Get current tabletop scroll position.
 *
 * @return {Number} x X-coordinate.
 * @return {Number} y Y-coordinate.
 */
export function setScrollPosition (x, y) {
  scroller.node().scrollTo(x, y)
}

/**
 * Get current center of the viewport of the scroll position.
 *
 * @return {Object} Contains x and y in pixel.
 */
export function getViewportCenter () {
  return {
    x: scroller.scrollLeft + Math.floor(scroller.clientWidth / 2),
    y: scroller.scrollTop + Math.floor(scroller.clientHeight / 2)
  }
}

/**
 * Get current center of the viewport of the scroll position.
 *
 * @return {Object} Contains x and y in pixel.
 */
export function getViewportCenterTile () {
  const template = getTemplate()
  const pos = getViewportCenter()
  return {
    x: Math.floor(pos.x / template.gridSize),
    y: Math.floor(pos.y / template.gridSize)
  }
}

/**
 * Initialize and start the room/tabletop screen.
 *
 * @param {String} name Name of room, e.g. hilariousGazingPenguin.
 * @param {String} token API access token for this room.
 */
export function runRoom (name, token) {
  console.info('$NAME$ v$VERSION$, room ' + name)

  loadRoom(name, token)
    .then(() => setupRoom())
}

/**
 * Toggle one of the layers on/off for selection.
 *
 * @param {String} layer Either LAYER_TILE, LAYER_OVERLAY or LAYER_TOKEN.
 */
export function toggleLayer (layer) {
  _('#btn-' + layer).toggle('.active')
  _('#tabletop').toggle('.layer-' + layer + '-enabled')
  if (_('#btn-' + layer + '.active').exists()) {
    setRoomPreference(PREFS['LAYER' + layer], true)
  } else {
    selectionClear(layer)
    setRoomPreference(PREFS['LAYER' + layer], false)
  }
}

/**
 * Toggle the ruler on/off.
 */
export function toggleLos () {
  _('#btn-s').toggle('.active')
  toggleLMBLos()
  if (isLMBLos()) {
    setCursor('.cursor-cross')
    setRoomPreference(PREFS.LOS, true)
  } else {
    setCursor()
    setRoomPreference(PREFS.LOS, false)
  }
}

/**
 * Toggle grid display on/off.
 *
 * @param {Number} value Grid value (0..2).
 */
export function toggleGrid (value) {
  switch (value) {
    case 0:
    case 1:
    case 2:
      setRoomPreference(PREFS.GRID, value)
      break
    default: // unknown value = cycle background
      setRoomPreference(PREFS.GRID, (getRoomPreference(PREFS.GRID) + 1) % 3)
  }
  setupBackground()
}

/**
 * Update the menu's disabled buttons.
 *
 * Mostly based on if a piece is selected or not.
 */
export function updateMenu () {
  // (de)activate menu
  const menu = _('.menu-selected')
  const pieces = selectionGetPieces()

  _('.menu-selected button').remove('.disabled')
  _('.menu-selected button').add('.disabled')
  if (pieces.length <= 0) {
    menu.add('.disabled')
  } else {
    menu.remove('.disabled')

    const features = selectionGetFeatures()
    if (features.edit) _('#btn-e').remove('.disabled')
    if (features.rotate) _('#btn-r').remove('.disabled')
    if (features.flip) _('#btn-f').remove('.disabled')
    if (features.random) _('#btn-hash').remove('.disabled')
    if (features.top) _('#btn-t').remove('.disabled')
    if (features.bottom) _('#btn-b').remove('.disabled')
    if (features.clone) _('#btn-c').remove('.disabled')
    if (features.delete) _('#btn-del').remove('.disabled')
  }
}

/**
 * Update DOM room to current table-data.
 *
 * e.g. for resizing the room.
 *
 * @return {FreeDOM} Room DOM element for further customization.
 */
export function updateRoom () {
  const room = getRoom()

  return _('#tabletop').css({
    '--fbg-tabletop-width': room.width + 'px',
    '--fbg-tabletop-height': room.height + 'px'
  })
}

/**
 * Convert window coordinates to a tabletop coordinates.
 *
 * Takes position of element and scroll position inside the element into account.
 *
 * @param {Number} clientX A window x coordinate e.g. from a click event.
 * @param {Number} clientY A window y coordinate e.g. from a click event.
 * @return {Object} The absolute room coordinate as {x, y}.
 */
export function getTableCoordinates (windowX, windowY) {
  const origin = scroller.node().getBoundingClientRect()

  return {
    x: windowX + scroller.scrollLeft - origin.left,
    y: windowY + scroller.scrollTop - origin.top
  }
}

/**
 * Update the status line (clock etc.).
 */
export function updateStatusline () {
  const time = new Date().toLocaleTimeString('de', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
  const message = DEMO_MODE
    ? fakeTabularNums(`<a href="https://freebeegee.org/">FreeBeeGee</a> • ${time} • Table ${getTableNo()}`)
    : fakeTabularNums(`${time} • Table ${getTableNo()}`)
  const status = _('#room .status')
  if (status.innerHTML !== message) {
    status.innerHTML = message
  }
}

/**
 * Restore the scroll position from properties (if any).
 *
 * Defaults to the center of the table setup if no last scroll position ist known.
 */
export function restoreScrollPosition () {
  const last = getTablePreference(PREFS.SCROLL)
  if (last.x && last.y) {
    scroller.node().scrollTo(
      last.x - Math.floor(scroller.clientWidth / 2),
      last.y - Math.floor(scroller.clientHeight / 2)
    )
  } else {
    const center = getSetupCenter()
    scroller.node().scrollTo(
      Math.floor(center.x - scroller.clientWidth / 2),
      Math.floor(center.y - scroller.clientHeight / 2)
    )
  }
}

/**
 * Set backround to given index + store it as preference.
 *
 * @param {Number} bgIndex Index of background. Will be clamped to the available ones.
 * @param {Boolean} showGrid If true, the overlay grid will be drawn.
 */
export function setupBackground (
  bgIndex = getServerPreference(PREFS.BACKGROUND),
  gridType = getRoomPreference(PREFS.GRID)
) {
  const room = getRoom()
  const server = getServerInfo()

  bgIndex = clamp(0, bgIndex, server.backgrounds.length - 1)

  updateRoom().css({
    '--fbg-tabletop-color': server.backgrounds[bgIndex].color,
    '--fbg-tabletop-image': url(server.backgrounds[bgIndex].image)
  })

  // setup background / wallpaper + grid
  _('#tabletop').remove('.has-grid', '--fbg-tabletop-grid')
  if (gridType > 0) {
    _('#tabletop').add('.has-grid')

    const color = brightness(server.backgrounds[bgIndex].color) < 92 ? 'white' : 'black'
    const style = gridType > 1 ? 'major' : 'minor'
    const shape = room.template?.type === TYPE_HEX ? 'hex' : 'square'
    _('#tabletop').css({ '--fbg-tabletop-grid': url(`img/grid-${shape}-${style}-${color}.svg`) })
  }

  // setup scroller
  scroller.css({ // this is for moz://a
    scrollbarColor: `${server.backgrounds[bgIndex].scroller} ${server.backgrounds[bgIndex].color}`,
    '--fbg-color-scroll-fg': server.backgrounds[bgIndex].scroller,
    '--fbg-color-scroll-bg': server.backgrounds[bgIndex].color
  })

  // store for future reference
  setServerPreference(PREFS.BACKGROUND, bgIndex)
  setRoomPreference(PREFS.GRID, gridType)
}

/**
 * Check if we need to update the select state after user clicked somewhere.
 *
 * @param {Element} node The HTML node the user clicked on. Unselect all if null.
 * @param {Boolean} toggle If false (default), selection replaces all previous.
 *                         If true, selection is added/removed (crtl-click).
 */
export function updateSelection (node, toggle = false) {
  if (toggle) {
    if (node) {
      selectNode(node, true)
    } else {
      // do nothing = keep selection
    }
  } else {
    if (node) {
      if (!isSelectedId(node.piece?.id)) {
        selectNode(node)
      }
    } else {
      selectionClear()
    }
  }
}

// --- internal ----------------------------------------------------------------

let scroller = null /** keep reference to scroller div - we need it often */

/**
 * Setup the room screen / HTML.
 *
 * @param {Object} room Room data object.
 */
function setupRoom () {
  cleanupStore()

  const room = getRoom()

  const mode = (room.template?.type === TYPE_HEX) ? '.is-template-grid-hex' : '.is-template-grid-square'

  _('body').remove('.page-boxed').add(mode).innerHTML = `
    <div id="room" class="room is-fullscreen is-noselect">
      <div class="menu">
        <div>
          <div class="menu-brand is-content">
            <button id="btn-S" class="btn-icon" title="Room settings [s]">${iconLogo}</button>
          </div>

          <div>
            <button id="btn-other" class="btn-icon" title="Toggle dice [1]">${iconDice}</button>
            <button id="btn-token" class="btn-icon" title="Toggle tokens [2]">${iconToken}</button>
            <button id="btn-overlay" class="btn-icon" title="Toggle overlays [3]">${iconOverlay}</button>
            <button id="btn-tile" class="btn-icon" title="Toggle tiles [4]">${iconTile}</button>
          </div>

          <div class="spacing-small">
            <button id="btn-s" class="btn-icon" title="Measure [m]">${iconRuler}</button>
            <button id="btn-a" class="btn-icon" title="Open library [l]">${iconAdd}</button>
          </div>

          <div class="menu-selected disabled spacing-small">
            <button id="btn-e" class="btn-icon" title="Edit [e]">${iconEdit}</button>
            <button id="btn-r" class="btn-icon" title="Rotate [r]">${iconRotate}</button>
            <button id="btn-f" class="btn-icon" title="Flip [f]">${iconFlip}</button>
            <button id="btn-hash" class="btn-icon" title="Random [#]">${iconShuffle}</button>
            <button id="btn-t" class="btn-icon" title="To top [t]">${iconTop}</button>
            <button id="btn-b" class="btn-icon" title="To bottom [b]">${iconBottom}</button>
            <button id="btn-c" class="btn-icon" title="Clone [c]">${iconClone}</button>
            <button id="btn-del" class="btn-icon" title="Delete [Del]">${iconDelete}</button>
          </div>
        </div>
        <div>
          <button id="btn-h" class="btn-icon" title="Help [h]">${iconHelp}</button>

          <a id="btn-snap" class="btn-icon" title="Download snapshot">${iconDownload}</a>

          <button id="btn-q" class="btn-icon" title="Leave room">${iconQuit}</button>
        </div>
      </div>
      <div id="scroller" class="scroller">
        <div id="tabletop" class="tabletop layer-note-enabled">
          <div id="layer-other" class="layer layer-other"></div>
          <div id="layer-token" class="layer layer-token"></div>
          <div id="layer-note" class="layer layer-note"></div>
          <div id="layer-overlay" class="layer layer-overlay"></div>
          <div id="layer-tile" class="layer layer-tile"></div>
          <div id="layer-room" class="layer layer-room"></div>
        </div>
      </div>
      <div class="status"></div>
    </div>
  `

  // keep global reference for scroll-tracking
  scroller = _('#scroller')

  // load preferences
  changeQuality(getServerPreference(PREFS.QUALITY))

  // setup menu for layers
  let undefinedCount = 0
  for (const layer of [LAYER_TOKEN, LAYER_OVERLAY, LAYER_TILE, LAYER_OTHER]) {
    _('#btn-' + layer).on('click', () => toggleLayer(layer))
    const prop = getRoomPreference(PREFS['LAYER' + layer])
    if (prop === true) toggleLayer(layer) // stored enabled
    if (prop === undefined) undefinedCount++
  }
  if (undefinedCount >= 4) {
    // default if store was empty
    toggleLayer(LAYER_OTHER)
    toggleLayer(LAYER_TOKEN)
  }

  if (getRoomPreference(PREFS.LOS)) toggleLos()

  // setup menu for selection
  _('#btn-a').on('click', () => modalLibrary(getViewportCenter()))
  _('#btn-e').on('click', () => editSelected())
  _('#btn-r').on('click', () => rotateSelected())
  _('#btn-c').on('click', () => cloneSelected(getMouseCoords()))
  _('#btn-t').on('click', () => toTopSelected())
  _('#btn-b').on('click', () => toBottomSelected())
  _('#btn-f').on('click', () => flipSelected())
  _('#btn-s').on('click', () => toggleLos())
  _('#btn-S').on('click', () => modalSettings())
  _('#btn-hash').on('click', () => randomSelected())
  _('#btn-del').on('click', () => deleteSelected())

  // setup remaining menu
  _('#btn-h').on('click', () => modalHelp())
  _('#btn-q').on('click', () => navigateToJoin(getRoom().name))

  setupBackground()

  _('body').on('contextmenu', e => e.preventDefault())

  enableDragAndDrop('#tabletop')

  // load + setup content
  setTableNo(getRoomPreference(PREFS.TABLE), false)
  runStatuslineLoop()

  // start autosyncing after a short delay to reduce server load a bit
  setTimeout(() => {
    startAutoSync(() => { autoTrackScrollPosition() })
  }, 100)

  if (DEMO_MODE) {
    _('#btn-snap').on('click', () => modalDisabled('would have downloaded a snapshot (a.k.a. savegame) of your whole room as <code>.zip</code> by now'))
    if (!getRoomPreference(PREFS.DISCLAIMER)) {
      setRoomPreference(PREFS.DISCLAIMER, true)
      modalDemo()
    }
  } else {
    _('#btn-snap').href = `./api/rooms/${room.name}/snapshot/?tzo=` + new Date().getTimezoneOffset() * -1
  }
}

let scrollFetcherTimeout = -1

/**
 * Start scroll tracking.
 */
function autoTrackScrollPosition () {
  _('#scroller').on('scroll', () => {
    clearTimeout(scrollFetcherTimeout)
    scrollFetcherTimeout = setTimeout(() => { // delay a bit to not/less fire during scroll
      const pos = getViewportCenter()
      setTablePreference(PREFS.SCROLL, { x: pos.x, y: pos.y })
    }, 1000)
  })
}

let statuslineLoop = -1

function runStatuslineLoop () {
  clearTimeout(statuslineLoop)
  updateStatusline()
  statuslineLoop = setTimeout(() => {
    runStatuslineLoop()
  }, 5000)
}

function fakeTabularNums (text) {
  return text.replace(/([0-9])/g, '<span class="is-tabular">$1</span>')
}
