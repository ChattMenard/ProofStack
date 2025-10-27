// Minimal mock for @upstash/redis used in tests
class Redis {
  constructor(opts) {
    this.opts = opts
  }
}

module.exports = { Redis }
