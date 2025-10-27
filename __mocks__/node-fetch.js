// Minimal CommonJS mock for node-fetch to avoid ESM parsing in Jest
// Returns a function that resolves to an object with ok/json
module.exports = async function nodeFetchMock(url, options) {
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '{}'
  }
}
// support default import
module.exports.default = module.exports;
