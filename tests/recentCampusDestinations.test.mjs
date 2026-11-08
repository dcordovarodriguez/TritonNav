import test from 'node:test';
import assert from 'node:assert/strict';
import resolver from '../lib/campus/resolver.js';
import data from '../data/campus/index.js';

test('recent UCSD buildings and Registrar classrooms resolve to their canonical buildings', () => {
  for (const [query, id] of [['Malk Hall', 'malk-hall'], ['COA', 'coalition'], ['Alianza', 'alianza'], ['Umoja', 'umoja'], ['Podemos', 'podemos'], ['Sankofa', 'sankofa'], ['Rya', 'pepper-canyon-west-rya'], ['Vela', 'pepper-canyon-west-vela']]) {
    assert.equal(resolver.resolveBuilding(query)?.id, id);
  }
  assert.equal(resolver.resolveRoom('MALK', 'B90')?.name, 'MALK B90');
  assert.equal(resolver.resolveRoom('Coalition', '125')?.capacity, 110);
  assert.equal(data.CAMPUS_ROOMS.filter((room) => ['malk-hall', 'coalition'].includes(room.buildingId)).length, 19);
});

test('new GIS building points are visible but are not presented as verified entrances', () => {
  const destination = resolver.resolveCampusDestination('MALK B90');
  assert.ok(destination.displayCoordinate);
  assert.equal(destination.entrance, null);
  assert.equal(destination.routingCoordinate, null);
  assert.match(resolver.createRoomDirections('malk-hall', 'B90'), /approximate.*Verify the entrance/);
});
