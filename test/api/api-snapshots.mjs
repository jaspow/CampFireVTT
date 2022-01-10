/**
 * @copyright 2021-2022 Markus Leupold-Löwenthal
 *
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

/* global describe */
/* eslint no-unused-expressions: 0 */

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import {
  p,
  expect,
  runTests,
  zipCreate,
  zipToc,
  testGetBuffer,
  testZIPUpload,
  testJsonGet,
  openTestroom,
  closeTestroom
} from './utils/chai.mjs'

import dateformat from 'dateformat'

// -----------------------------------------------------------------------------

function testApiSnapshotClassic (api, version, room) {
  openTestroom(api, room, 'Classic')

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=60`, headers => {
    const date = dateformat(new Date(), 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {
    const entries = zipToc(buffer)
    expect(entries.length).to.be.gte(100)
    expect(entries).to.contain('LICENSE.md')
    expect(entries).to.contain('template.json')
    expect(entries).to.contain('tables/1.json')
    expect(entries).to.contain('assets/token/chess.bishop.1x1x1.0-wood.svg')
    expect(entries).not.to.contain('room.json')
    expect(entries).not.to.contain('snapshot.zip')
  }, 200)

  testGetBuffer(api, () => `/rooms/${room}/snapshot/`, headers => {
    const now = new Date()
    now.setHours(now.getHours() - 1)
    const date = dateformat(now, 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {}, 200)

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=120`, headers => {
    const now = new Date()
    now.setHours(now.getHours() + 1)
    const date = dateformat(now, 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {}, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiSnapshotRPG (api, version, room) {
  openTestroom(api, room, 'RPG')

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=60`, headers => {
    const date = dateformat(new Date(), 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {
    const entries = zipToc(buffer)
    expect(entries.length).to.be.gte(100)
    expect(entries).to.contain('LICENSE.md')
    expect(entries).to.contain('template.json')
    expect(entries).to.contain('tables/1.json')
    expect(entries).to.contain('assets/tile/room.4x4.4x4x1.808674-paper.jpg')
    expect(entries).not.to.contain('room.json')
    expect(entries).not.to.contain('snapshot.zip')
  }, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiSnapshotHex (api, version, room) {
  openTestroom(api, room, 'Hex')

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=60`, headers => {
    const date = dateformat(new Date(), 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {
    const entries = zipToc(buffer)
    expect(entries.length).to.be.gte(100)
    expect(entries).to.contain('LICENSE.md')
    expect(entries).to.contain('template.json')
    expect(entries).to.contain('tables/1.json')
    expect(entries).to.contain('assets/tile/map.B.5x4x1.transparent.png')
    expect(entries).not.to.contain('room.json')
    expect(entries).not.to.contain('snapshot.zip')
  }, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiSnapshotTutorial (api, version, room) {
  openTestroom(api, room, 'Tutorial')

  testGetBuffer(api, () => `/rooms/${room}/snapshot/?tzo=60`, headers => {
    const date = dateformat(new Date(), 'yyyy-mm-dd-HHMM')
    expect(headers['content-disposition']).to.contain(`${room}.${date}.zip`)
  }, buffer => {
    const entries = zipToc(buffer)
    expect(entries.length).to.be.lte(100)
    expect(entries).to.contain('LICENSE.md')
    expect(entries).to.contain('template.json')
    expect(entries).to.contain('tables/6.json')
    expect(entries).to.contain('assets/token/orc.1x1x1.5-wood.svg')
    expect(entries).not.to.contain('room.json')
    expect(entries).not.to.contain('snapshot.zip')
  }, 200)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiSnapshotUpload (api, version, room) {
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('LICENSE.md', Buffer.from('you may'))
    }),
    body => {
      expect(body).to.be.an('object')
      expect(body.credits).to.be.eql('you may')
    }, 201)

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

function testApiSnapshotVersions (api, version, room) {
  const v = p.versionEngineTest.split('.')
  v[0] = Number.parseInt(v[0])
  v[1] = Number.parseInt(v[1])
  v[2] = Number.parseInt(v[2])

  // snapshot matches current version
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('template.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1]}.0"
      }`))
    }),
    body => {
      expect(body).to.be.an('object')
    }, 201)
  closeTestroom(api, room)

  // snapshot matches same patch - ok
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('template.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1]}.${v[2]}"
      }`))
    }),
    body => {
      expect(body).to.be.an('object')
    }, 201)
  closeTestroom(api, room)

  // snapshot matches older patch -> ok
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('template.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1]}.${v[2] - 1}"
      }`))
    }),
    body => {
      expect(body).to.be.an('object')
    }, 201)
  closeTestroom(api, room)

  // snapshot requires newer patch -> bad
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('template.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1]}.${v[2] + 1}"
      }`))
    }),
    body => {
      expect(body._messages[0]).to.match(/ engine mismatch/)
    }, 400)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 404)

  // snapshot is from a newer engine (major) -> bad
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('template.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0] + 1}.${v[1]}.0"
      }`))
    }),
    body => {
      expect(body._messages[0]).to.match(/ engine mismatch/)
    }, 400)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 404)

  // snapshot is from an older engine (major) -> bad
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('template.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0] - 1}.${v[1]}.0"
      }`))
    }),
    body => {
      expect(body._messages[0]).to.match(/ engine mismatch/)
    }, 400)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 404)

  // snapshot is from a newer engine (minor) -> bad
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('template.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1] + 1}.0"
      }`))
    }),
    body => {
      expect(body._messages[0]).to.match(/ engine mismatch/)
    }, 400)
  testJsonGet(api, () => `/rooms/${room}/`, body => {}, 404)

  // snapshot is from an older engine (minor) -> ok
  testZIPUpload(api,
    () => '/rooms/',
    () => { return room },
    () => { return 'apitests' },
    () => zipCreate(zip => {
      zip.addFile('template.json', Buffer.from(`{
        "type": "grid-square",
        "version": "${p.version}",
        "engine": "${v[0]}.${v[1] - 1}.0"
      }`))
    }),
    body => {
      expect(body).to.be.an('object')
    }, 201)
  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

describe('API - snapshots', function () {
  runTests((api, version, room) => {
    describe('Classic', () => testApiSnapshotClassic(api, version, room))
    describe('RPG', () => testApiSnapshotRPG(api, version, room))
    describe('Hex', () => testApiSnapshotHex(api, version, room))
    describe('Tutorial', () => testApiSnapshotTutorial(api, version, room))
    describe('upload', () => testApiSnapshotUpload(api, version, room))
    describe('versions', () => testApiSnapshotVersions(api, version, room))
  })
})
