const MockDate = require('mockdate');
const Daemon = require('../main/daemon');
const config = require('../../configs/example');
const nock = require('nock');

const daemons = [{
  'host': '127.0.0.1',
  'port': '9998',
  'username': 'foundation',
  'password': 'foundation'
}];

const multiDaemons = [{
  'host': '127.0.0.1',
  'port': '9998',
  'username': 'foundation',
  'password': 'foundation'
}, {
  'host': '127.0.0.2',
  'port': '9998',
  'username': 'foundation',
  'password': 'foundation'
}];

nock.disableNetConnect();
nock.enableNetConnect('127.0.0.1');

////////////////////////////////////////////////////////////////////////////////

describe('Test daemon functionality', () => {

  let configCopy, daemonsCopy, multiDaemonsCopy;
  beforeEach(() => {
    configCopy = JSON.parse(JSON.stringify(config));
    daemonsCopy = JSON.parse(JSON.stringify(daemons));
    multiDaemonsCopy = JSON.parse(JSON.stringify(multiDaemons));
  });

  beforeEach(() => nock.cleanAll());
  afterAll(() => nock.restore());
  beforeAll(() => {
    if (!nock.isActive()) nock.activate();
    nock.enableNetConnect();
  });

  test('Test daemon initialization [1]', (done) => {
    nock('http://127.0.0.1:9998')
      .post('/', (body) => body.method === 'getpeerinfo')
      .reply(200, JSON.stringify({
        error: null,
        result: null,
        instance: 'nocktest',
      }));
    const daemon = new Daemon(configCopy, daemonsCopy);
    daemon.checkInstances((error, response) => {
      expect(error).toBe(false);
      expect(response).toBe(null);
      done();
    });
  });

  test('Test daemon initialization [2]', (done) => {
    nock('http://127.0.0.1:9998')
      .post('/', (body) => body.method === 'getpeerinfo')
      .reply(200, JSON.stringify({
        error: null,
        result: null,
        instance: 'nocktest',
      }));
    nock('http://127.0.0.2:9998')
      .post('/', (body) => body.method === 'getpeerinfo')
      .reply(200, JSON.stringify({
        error: null,
        result: null,
        instance: 'nocktest',
      }));
    const multiDaemon = new Daemon(configCopy, multiDaemonsCopy);
    multiDaemon.checkInstances((error, response) => {
      expect(error).toBe(false);
      expect(response).toBe(null);
      done();
    });
  });

  test('Test daemon initialization [3]', (done) => {
    nock('http://127.0.0.1:9998')
      .post('/', (body) => body.method === 'getpeerinfo')
      .reply(401, JSON.stringify({
        error: null,
        result: null,
        instance: 'nocktest',
      }));
    const daemon = new Daemon(configCopy, daemonsCopy);
    daemon.checkInstances((error, response) => {
      expect(error).toBe(true);
      expect(response).toBe(null);
      done();
    });
  });

  test('Test daemon commands [1]', (done) => {
    MockDate.set(1634742080841);
    nock('http://127.0.0.1:9998')
      .post('/', (body) => body.method === 'getpeerinfo')
      .reply(200, JSON.stringify({
        error: null,
        result: null,
        instance: 'nocktest',
      }));
    nock('http://127.0.0.1:9998')
      .post('/', (body) => body.method === 'getblocktemplate')
      .reply(200, JSON.stringify({
        error: null,
        result: null,
        instance: 'nocktest',
      }));
    const daemon = new Daemon(configCopy, daemonsCopy);
    const requests = [['getblocktemplate', []]];
    const expected = [{'data': '{"error":null,"result":null,"instance":"nocktest"}', 'error': null, 'instance': { 'host': '127.0.0.1', 'port': '9998', 'username': 'foundation', 'password': 'foundation', 'index': 0 }, 'response': null}];
    daemon.checkInstances(() => {
      daemon.sendCommands(requests, false, (response) => {
        expect(response).toStrictEqual(expected);
        done();
      });
    });
  });

  test('Test daemon commands [2]', (done) => {
    MockDate.set(1634742080841);
    nock('http://127.0.0.1:9998')
      .post('/', (body) => body.method === 'getpeerinfo')
      .reply(200, JSON.stringify({
        error: null,
        result: null,
        instance: 'nocktest',
      }));
    nock('http://127.0.0.1:9998')
      .post('/', (body) => body.method === 'getblocktemplate')
      .reply(200, JSON.stringify({
        error: null,
        result: null,
        instance: 'nocktest',
      }));
    const daemon = new Daemon(configCopy, daemonsCopy);
    const requests = [['getblocktemplate', []]];
    const expected = [{'data': '{"error":null,"result":null,"instance":"nocktest"}', 'error': null, 'instance': { 'host': '127.0.0.1', 'port': '9998', 'username': 'foundation', 'password': 'foundation', 'index': 0 }, 'response': null}];
    daemon.checkInstances(() => {
      daemon.sendCommands(requests, false, (response) => {
        expect(response).toStrictEqual(expected);
        done();
      });
    });
  });

  test('Test daemon commands [3]', (done) => {
    const daemon = new Daemon(configCopy, []);
    const requests = [['getblocktemplate', []]];
    daemon.checkInstances(() => {
      daemon.sendCommands(requests, false, (response) => {
        expect(response).toStrictEqual([]);
        done();
      });
    });
  });
});
