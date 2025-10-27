// Lightweight mock of withRateLimit used in tests
module.exports.withRateLimit = function withRateLimit(handler) {
  return handler
}
module.exports.default = module.exports
