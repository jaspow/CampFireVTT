/**
 * @copyright 2021-2023 Markus Leupold-Löwenthal
 *
 * @license AGPL-3.0-or-later
 *
 * This file is part of FreeBeeGee.
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

/* global describe */

import { run as runAssets } from './api/api-assets.mjs'
import { run as runCrud } from './api/api-crud.mjs'
import { run as runDigests } from './api/api-digests.mjs'
import { run as runPermissions } from './api/api-permissions.mjs'
import { run as runPieces } from './api/api-pieces.mjs'
import { run as runServer } from './api/api-server.mjs'
import { run as runSnapshots } from './api/api-snapshots.mjs'
import { run as runTables } from './api/api-tables.mjs'
import { run as runTemplates } from './api/api-templates.mjs'
import { run as runUploads } from './api/api-uploads.mjs'

const runner = function (what) {
  const room = [...Array(14)].map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  const api = 'http://localhost:8765/api'

  describe('PHP 7.2', function () { what(api.replace(/localhost:8765/, 'play72.local'), '72', `${room}72`) })
  describe('PHP 7.3', function () { what(api.replace(/localhost:8765/, 'play73.local'), '73', `${room}73`) })
  describe('PHP 7.4', function () { what(api.replace(/localhost:8765/, 'play74.local'), '74', `${room}74`) })
  describe('PHP 8.0', function () { what(api.replace(/localhost:8765/, 'play80.local'), '80', `${room}80`) })
  describe('PHP 8.1', function () { what(api.replace(/localhost:8765/, 'play81.local'), '81', `${room}81`) })
  describe('PHP 8.2', function () { what(api.replace(/localhost:8765/, 'play82.local'), '82', `${room}82`) })
  describe('PHP 8.3', function () { what(api.replace(/localhost:8765/, 'play83.local'), '83', `${room}83`) })
}

runAssets(runner)
runCrud(runner)
runDigests(runner)
runPermissions(runner)
runPieces(runner)
runServer(runner)
runSnapshots(runner)
runTables(runner)
runTemplates(runner)
runUploads(runner)
