const events = require('events');

////////////////////////////////////////////////////////////////////////////////

// Main Difficulty Function
const Difficulty = function(config) {

  const _this = this;
  this.config = config;
  this.clients = {};

  // this.spy = 0;

  // Difficulty Variables
  this.maxSize = _this.config.cacheTime / _this.config.targetTime;
  this.maxBoundary = 1 + _this.config.variance;
  this.minBoundary = 1 - _this.config.variance;

  // Difficulty Saved Values
  this.lastRetargetTime = null;

  // Get New Difficulty Correction for Updates
  this.getDiffCorrection = function(client) {

    // Setup Queue
    const timestamps = _this.clients[client.id].timestamps;
    const difficulties = _this.clients[client.id].difficulties;
    const queueLength = difficulties.length;

    // Check that Queue has Sufficient Entries
    if (queueLength < 2 || client.difficulty === 0) return null;

    // Process Queue
    const difficultySum = difficulties.reduce((a, b) => a + b, 0);
    const queueInterval = timestamps[timestamps.length - 1] - timestamps[0];
    if (queueInterval <= 0 || difficultySum === 0) return null;

    let targetDiff = _this.config.targetTime * difficultySum / queueInterval;

    // Shift Difficulty Down
    if (targetDiff > _this.config.maximum) {
      targetDiff = _this.config.maximum;
    }

    // Shift Difficulty Up
    if (targetDiff < _this.config.minimum) {
      targetDiff = _this.config.minimum;
    }

    // Set Difficulty Correction Ratio
    const diffCorrection = targetDiff / client.difficulty;

    // Ratio Variance Test
    if ((diffCorrection < _this.maxBoundary && diffCorrection > _this.minBoundary) || diffCorrection === 1)
      return null;
    else return diffCorrection;
  };

  // Handle Individual Clients
  this.handleClient = function(client) {

    // Add Event Listeners to Client Instance
    client.on('client.submit', () => _this.handleDifficulty(client));
    client.on('client.subscription', () => _this.handleDifficulty(client));
  };

  // Handle Difficulty Updates
  this.handleDifficulty = function(client) {

    // Set Current Time
    const curTime = (Date.now() / 1000) | 0;

    // Initiate Difficulty Object if Unset
    if (!(Object.keys(_this.clients).includes(client.id))) {
      _this.clients[client.id] = { difficulties: [], timestamps: [ curTime ] };
      _this.lastRetargetTime = curTime - _this.config.retargetTime / 2;
      return;
    }

    // Append New Value to Queue
    const queue = _this.clients[client.id];
    queue.difficulties.push(client.difficulty);
    queue.timestamps.push(curTime);
    if (queue.difficulties.length > _this.maxSize) {
      queue.difficulties.shift();
      queue.timestamps.shift();
    }

    // Calculate Difference Between Desired vs. Average Time
    if (curTime - _this.lastRetargetTime < _this.config.retargetTime) return;

    // Calculate Target Difficulty Correction Ratio
    const diffCorrection = _this.getDiffCorrection(client);

    // Difficulty Will Be Updated
    if (diffCorrection !== null) {
      const newDifficulty = client.difficulty * diffCorrection;
      _this.emit('client.difficulty.new', client, newDifficulty);
    }

    // Update Retarget Time
    _this.lastRetargetTime = curTime;
  };
};

module.exports = Difficulty;
Difficulty.prototype.__proto__ = events.EventEmitter.prototype;
