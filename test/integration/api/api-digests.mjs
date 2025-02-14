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

// -----------------------------------------------------------------------------

// Mocha / Chai tests for the API. See test/README.md how to run them.

import {
  REGEXP,
  expect,
  openTestroom,
  closeTestroom,
  testGetBuffer,
  testJsonGet,
  testJsonPatch,
  testJsonPut
} from '../utils/chai.mjs'

import {
  pieceMinimal
} from '../utils/data.mjs'

let digest = null
let data = null

const crcTable = (() => {
  let c
  const crcTable = []
  for (let n = 0; n < 256; n++) {
    c = n
    for (let k = 0; k < 8; k++) {
      c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1))
    }
    crcTable[n] = c
  }
  return crcTable
})()

/**
 * Calculate a CRC32 of a string.
 *
 * @param {string} str String to calculate hash for.
 * @returns {string} Hash as 'crc32:<number>'
 */
function crc32 (str) {
  let crc = 0 ^ (-1)

  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ str.charCodeAt(i)) & 0xFF]
  }

  return 'crc32:' + ((crc ^ (-1)) >>> 0)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiRoomDigest (api, room) {
  openTestroom(api, room, 'Classic')

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.width).to.be.eql(4096)
    expect(body.height).to.be.eql(4096)
    expect(body.setup.gridWidth).to.be.eql(64)
    expect(body.setup.gridHeight).to.be.eql(64)
    data = body
  }, 200)

  // fetch digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body).to.be.an('object')
    expect(body['room.json']).to.match(REGEXP.DIGEST)
    digest = body['room.json']
  })

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.width).to.be.eql(4096)
    expect(body.height).to.be.eql(4096)
  }, 200)

  // get didn't change digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // change of setup should change room digest
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {
    return {
      gridWidth: 128,
      gridHeight: 256
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(128)
    expect(body.gridHeight).to.be.eql(256)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).not.to.be.eql(digest)
  })

  // change it back and digest should revert
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {
    return {
      gridWidth: 64,
      gridHeight: 64
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(64)
    expect(body.gridHeight).to.be.eql(64)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // change of table should not change room digest
  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
    data = body[0].id
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // change of piece should not change room digest
  testJsonPatch(api, () => `/rooms/${room}/tables/9/pieces/${data}/`, () => {
    return { w: 8 }
  }, body => {
    expect(body.w).to.be.eql(8)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiTableDigest (api, room) {
  openTestroom(api, room, 'Classic')

  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(1)
  }, 200)

  // fetch digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP.DIGEST)
    digest = body['tables/9.json']
  })

  testJsonGet(api, () => `/rooms/${room}/tables/9/`, body => {
    expect(body.length).to.be.eql(1)
  }, 200)

  // get didn't change digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP.DIGEST)
    expect(body['tables/9.json']).to.be.eql(digest)
  })

  // change of setup should not change table digest
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {
    return {
      gridWidth: 128,
      gridHeight: 256
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(128)
    expect(body.gridHeight).to.be.eql(256)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP.DIGEST)
    expect(body['tables/9.json']).to.be.eql(digest)
  })

  // change of table should change table digest
  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
    data = body[0].id
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP.DIGEST)
    expect(body['tables/9.json']).not.to.be.eql(digest)
    digest = body['tables/9.json']
  })

  // change of piece should change digest again
  testJsonPatch(api, () => `/rooms/${room}/tables/9/pieces/${data}/`, () => {
    return { w: 8 }
  }, body => {
    expect(body.w).to.be.eql(8)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/9.json']).to.match(REGEXP.DIGEST)
    expect(body['tables/9.json']).not.to.be.eql(digest)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiSetupDigest (api, room) {
  openTestroom(api, room, 'Classic')

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.width).to.be.eql(4096)
    expect(body.height).to.be.eql(4096)
    expect(body.setup.gridWidth).to.be.eql(64)
    expect(body.setup.gridHeight).to.be.eql(64)
    data = body
  }, 200)

  // fetch digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body).to.be.an('object')
    expect(body['setup.json']).to.match(REGEXP.DIGEST)
    digest = body['setup.json']
  })

  testJsonGet(api, () => `/rooms/${room}/`, body => {
    expect(body.width).to.be.eql(4096)
    expect(body.height).to.be.eql(4096)
  }, 200)

  // get didn't change digest
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['setup.json']).to.be.eql(digest)
  })

  // change of setup should change setup digest
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {
    return {
      gridWidth: 128,
      gridHeight: 256
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(128)
    expect(body.gridHeight).to.be.eql(256)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['setup.json']).not.to.be.eql(digest)
  })

  // change it back and digest should revert
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {
    return {
      gridWidth: 64,
      gridHeight: 64
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(64)
    expect(body.gridHeight).to.be.eql(64)
  })
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['setup.json']).to.be.eql(digest)
  })

  // change of table should not change setup digest
  testJsonPut(api, () => `/rooms/${room}/tables/9/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
    data = body[0].id
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['setup.json']).to.be.eql(digest)
  })

  // change of piece should not change room digest
  testJsonPatch(api, () => `/rooms/${room}/tables/9/pieces/${data}/`, () => {
    return { w: 8 }
  }, body => {
    expect(body.w).to.be.eql(8)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['setup.json']).to.be.eql(digest)
  })

  closeTestroom(api, room)
}

// -----------------------------------------------------------------------------

/**
 * @param {string} api API root path.
 * @param {string} room Room name to use for test.
 */
function testApiDigestHeader (api, room) {
  openTestroom(api, room, 'Classic')

  // room digest
  testGetBuffer(api, () => `/rooms/${room}/`, headers => {
    expect(headers.digest).to.match(REGEXP.DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // table digest
  testGetBuffer(api, () => `/rooms/${room}/tables/1/`, headers => {
    expect(headers.digest).to.match(REGEXP.DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/1.json']).to.be.eql(digest)
  })

  // change room/setup
  testJsonPatch(api, () => `/rooms/${room}/setup/`, () => {
    return {
      gridWidth: 128,
      gridHeight: 256
    }
  }, body => {
    expect(body.gridWidth).to.be.eql(128)
    expect(body.gridHeight).to.be.eql(256)
  })

  // room digest
  testGetBuffer(api, () => `/rooms/${room}/`, headers => {
    expect(headers.digest).to.match(REGEXP.DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // table digest
  testGetBuffer(api, () => `/rooms/${room}/tables/1/`, headers => {
    expect(headers.digest).to.match(REGEXP.DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/1.json']).to.be.eql(digest)
  })

  // change table
  testJsonPut(api, () => `/rooms/${room}/tables/1/`, () => {
    return [pieceMinimal, pieceMinimal]
  }, body => {
    expect(body.length).to.be.eql(2)
  }, 200)

  // room digest
  testGetBuffer(api, () => `/rooms/${room}/`, headers => {
    expect(headers.digest).to.match(REGEXP.DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['room.json']).to.be.eql(digest)
  })

  // table digest
  testGetBuffer(api, () => `/rooms/${room}/tables/1/`, headers => {
    expect(headers.digest).to.match(REGEXP.DIGEST)
    digest = headers.digest
  }, buffer => {
    expect(crc32(buffer.toString('utf-8'))).to.be.eql(digest)
  }, 200)
  testJsonGet(api, () => `/rooms/${room}/digest/`, body => {
    expect(body['tables/1.json']).to.be.eql(digest)
  })

  closeTestroom(api, room)
}

// --- the test runners --------------------------------------------------------

/**
 * @param {object} runner Test runner to add our tests to.
 */
export function run (runner) {
  describe('API - digests', function () {
    runner((api, version, room) => {
      describe('room digest', () => testApiRoomDigest(api, room))
      describe('table digest', () => testApiTableDigest(api, room))
      describe('setup digest', () => testApiSetupDigest(api, room))
      describe('digest header', () => testApiDigestHeader(api, room))
    })
  })
}
