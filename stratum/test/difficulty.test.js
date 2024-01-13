const MockDate = require('mockdate');
const Difficulty = require('../main/difficulty');
const events = require('events');

// Bad Settings
const difficulty = {
  'minimum': 8,
  'maximum': 512,
  'cacheTime': 15,
  'targetTime': 15,
  'retargetTime': 90,
  'variance': 0.3,
};

////////////////////////////////////////////////////////////////////////////////

describe('Test difficulty functionality', () => {

  let client;
  beforeEach(() => {
    client = new events.EventEmitter();
    client.id = 'test';
    client.difficulty = 32;
  });

  let difficultyCopy;
  beforeEach(() => {
    difficultyCopy = JSON.parse(JSON.stringify(difficulty));
  });

  test('Test client difficulty initialization [1]', () => {
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.handleClient(client);
    expect(client._eventsCount).toBe(2);
    expect(Object.keys(client._events)[0]).toBe('client.submit');
    expect(Object.keys(client._events)[1]).toBe('client.subscription');
  });

  test('Test client difficulty initialization [2]', () => {
    MockDate.set(1634742080841);
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.lastRetargetTime = 1634741500;
    difficulty.handleClient(client);
    client.emit('client.submit');
    expect(difficulty.lastRetargetTime).toBe(1634742035);
    expect(difficulty.clients[client.id]).toStrictEqual({ difficulties: [], timestamps: [ 1634742080 ] });
  });

  test('Test client difficulty initialization [3]', () => {
    MockDate.set(1634742080841);
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.lastRetargetTime = 1634741500;
    difficulty.handleClient(client);
    client.emit('client.subscription');
    expect(difficulty.lastRetargetTime).toBe(1634742035);
    expect(difficulty.clients[client.id]).toStrictEqual({ difficulties: [], timestamps: [ 1634742080 ] });
  });

  test('Test client difficulty handling [1]', () => {
    MockDate.set(1634742080841);
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.maxSize = 3;
    difficulty.clients['test'] = {difficulties: [10, 10], timestamps: [1634742070,1634743070,1634744070]};
    difficulty.handleDifficulty(client);
    expect(difficulty.clients[client.id]).toStrictEqual({ difficulties: [10, 10, 32], timestamps: [1634742070,1634743070,1634744070,1634742080] });
  });

  test('Test client difficulty handling [2]', () => {
    MockDate.set(1634742080841);
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.maxSize = 2;
    difficulty.clients['test'] = {difficulties: [10, 10], timestamps: [1634742070,1634743070,1634744070]};
    difficulty.handleDifficulty(client);
    expect(difficulty.clients[client.id]).toStrictEqual({ difficulties: [10, 32], timestamps: [1634743070,1634744070,1634742080] });
  });

  test('Test client difficulty handling [2]', () => {
    MockDate.set(1634742081841);
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.lastRetargetTime = 1634742080841;
    difficulty.clients['test'] = {difficulties: [], timestamps: [1634742070]};
    difficulty.handleDifficulty(client);
    // expect(difficulty.clients[client.id]).toStrictEqual({ difficulties: [10, 32], timestamps: [1634743070,1634744070,1634742080] });
  });

  test('Test client difficulty correction [1]', () => {
    MockDate.set(1634742080841);
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.clients['test'] = {difficulties: [], timestamps: [1634742070]};
    difficulty.diffCorrection = difficulty.getDiffCorrection(client);
    expect(difficulty.diffCorrection).toBe(null);
  });

  test('Test client difficulty correction [2]', () => {
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.clients['test'] = {difficulties: [10, 10], timestamps: [1634742070,1634743070,1634744070]};
    difficulty.diffCorrection = difficulty.getDiffCorrection(client);
    expect(difficulty.diffCorrection).toBe(0.25);
  });

  test('Test client difficulty correction [3]', () => {
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.clients['test'] = {difficulties: [100000, 100000], timestamps: [1634742070,1634743070,1634744070]};
    difficulty.diffCorrection = difficulty.getDiffCorrection(client);
    expect(difficulty.diffCorrection).toBe(16);
  });

  test('Test client difficulty correction [4]', () => {
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.clients['test'] = {difficulties: [10000, 10000], timestamps: [1634742070,1634743070,1634744070]};
    difficulty.diffCorrection = difficulty.getDiffCorrection(client);
    expect(difficulty.diffCorrection).toBe(4.6875);
  });

  test('Test client difficulty correction [5]', () => {
    const difficulty = new Difficulty(difficultyCopy);
    difficulty.clients['test'] = {difficulties: [2000, 2000], timestamps: [1634742070,1634743070,1634744070]};
    difficulty.diffCorrection = difficulty.getDiffCorrection(client);
    expect(difficulty.diffCorrection).toBe(null);
  });
});
