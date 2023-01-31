const source = `
function add (a, b) {
  return a + b;
}
function main (args) {
  const params = JSON.parse(args)
  var ret = 0
  for (const it of params) {
    ret = add(ret, it);
  }
  return ret
}
`
const vm = require('vm')
const scrub = require('../scrub')
const rr = scrub(source, JSON.stringify([
  0,1,2,3,4,5,6,7,8,9,10
]), 5, 10)

const sandbox = {}

vm.runInNewContext(rr.scrubedSource, sandbox)
console.log(sandbox)
