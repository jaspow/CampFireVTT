# Roadmap

This document is part of the [FreeBeeGee documentation](DOCS.md). It contains a list what might happen next. However, priorities may change.

## v0.19 - Frying Frog

* [X] PHP 8.2 support
* [X] hex variant for hexes rotated 90°
* [X] engine: rough & linen material
* [X] engine: support G-Z as token number
* [X] engine: make side digit in 1x1x1 optional (= 1x1)
* [X] pre-release
  * [X] bump dependencies
  * [X] bugfixes + refactoring
    * [X] bug: trailing slash in apache config confuses FBG
    * [X] refactor: PHP consts
    * [X] refactor: split api tests in all/latest
    * [X] refactor: automated tests for zip/tgz packages after build
    * [X] bug: docker build not pulling latest php baseimage
    * [X] minimizing of pre-minimized snapshot assets
    * [X] bug: token selection not properly working when clicking through transparent dicemap
  * [X] review docs
  * [X] review tutorial
  * [X] bump engine, version/codename & update CHANGELOG
  * [X] review + run tests
  * [X] update screenshots

## Backlog

### rather sooner (before v1)

* [ ] PHP 8.3 support
* [ ] bug: dragging multiselected hex tokens does not always snap correctly
* [ ] refactor: split (edit) modals
* [ ] library: show/indicate backside/all sides in tile browser
* [ ] library: delete assets UI
* [ ] ui: half-rotations (45° for square, 30° for hex)
* [ ] ui: tweak minor grid visibility
* [ ] ui: shuffle z-order (+ put on same X/Y) & remove shuffle item
* [ ] engine: grid-on-tile flag
* [ ] repo: split API tests in docker/all/latest
* [ ] piece: wooden cubes
* [ ] refactor: relative includes via @
* [ ] refactor: split edit modals
* [ ] PHP 8.2 support
* [ ] refactor: smaller modal paddings
* [ ] simplify/automate more deployment steps (ongoing)
  * [ ] automated screenshots using screenshot.zip snapshot
* [ ] ui: clipboard ctrl+c/v/x between tables
* [ ] engine: option to rotate group vs individual pieces
* [ ] engine: protect api objects in JS code
* [ ] snapshot download for demo mode
* [ ] ui: move dice more
* [ ] ui: library: tooltip explanation for '3x3:3' in library window
* [ ] ui: open edit window on note create
* [ ] library: edit asset UI
* [ ] bug: png maps make pieces flicker when cursor changes
* [ ] when dragging pieces, move those on top of the original piece too
* [ ] dedicated HP/Mana/Value field(s)
* [ ] ui: set fixed table size (e.g. 73x65)
* [ ] piece: supply heap
* [ ] piece: cards / card-decks
  * [ ] shuffle deck/stack
* [ ] player secrets (e.g. for goal cards, hidden rolling, ...)
* [ ] reduce impact of "back" button
* [ ] dicemat: randomize button
* [ ] dicemat: don't roll dice on transparent parts
* [ ] dicemat: count dice values
* [ ] ui: doubleclick handling?
* [ ] concurrent drag-n-drop (first mover wins) via hash/deprecation header
* [ ] system: password-protect assets, too
* [ ] docs: template-template
* [ ] docs: how-to make snapshot `.zip`s
* [ ] API: check sides correspond to asset
* [ ] API: hide .../data/... from URLs (via .htaccess)
* [ ] API: obfuscate/hash room name
* [ ] repo: generate average piece color
* [ ] API: catch all unhandled warnings/exceptions in PHP API and return 500
* [ ] docs: API Docs
* [ ] more backgrounds: snow/ice

### rather later (unsorted, after v1)

* ui skins (modals, fonts, ...)
* library: folder / modules / packages to enable/disable groups of assets (e.g. dungeon, woods, space, ...)
* pieces: inline-edit notes
* better sticky notes (auto-size text)
* bulk manipulation of assets (delete, edit, change type)
* show even more infos in media browser
* sounds
  * dice-roll
  * shuffle
  * object selection
  * moving
* I18N
* cones + attack zones
* rotate desk 90° 180° 270°
* pinboard for handouts
* undo (limited)
* better tablet / touch support
  * zooming
  * moving pieces
* color.sh: detect dominant piece color instead of average color
* compile js for older browsers (<globalThis)
* arbitrary layers via template configuration
* link to subtable in url via /roomname#1
* game rules / metainfos (pdf) links in help
* send to previous position for pieces
* detail-pane to the right for selected item
* move stuff via cursor keys
* rename room
* custom, faster tooltips
* use left-right keys to switch tabs in modals
* multi-panes / splitscreen / split.js
* measure range (in fields)
* auto-z based on tile position
* better fix dragndrop when 'drop' outside
* dark mode css
* library window usability
  * add without closing
  * nicer cards/selection
  * asset adding: (re)set token size 2x2->3x4
* FreeDOM: Emmet '~' support
* shared notepad / scratchpad / piece of paper / postits
* users + roles
  * admins, players, spectators
  * vote for new admin / gm
* cache/resuse/symlink same assets in different table folders (via sha256?)
* download map/table as PDF for printing
* cutcenes / message panels
* labels looking like piece of paper sticking out
* lobby / room browser
