// Minimal mock for @upstash/ratelimit used in tests
class Ratelimit {
  constructor(opts) {
    this.opts = opts
  }

  async limit(_identifier) {
    const now = Date.now()
    return { success: true, limit: 30, remaining: 29, reset: now + 60 * 1000 }
  }

  static slidingWindow(count, _duration) {
    return { type: 'slidingWindow', count }
  }
}

module.exports = { Ratelimit }
