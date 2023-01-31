/*!
 * Copyright(c) Eros 2017 <pbft@foxmail.com>
 */

const assert = require('assert')
const randomstring = require('randomstring')
const instrumentation = require('./lib/instrumentation.js')

// step 代表一个gas单位可以走几步
function scrub(source, params, gas, step) {
  assert(typeof source === 'string', 'must be a string')
  assert(typeof params === 'string', 'params must be a string')
  assert(typeof gas === 'number', 'must be a number')
  assert(typeof step === 'number', 'must be a number')
  assert(gas > 0, 'gas <= 0')
  assert(step > 0, 'step <= 0')
  const gasSteps = Math.floor(gas * step) // 代表总共可以执行多少步
  const gasDeclaration = `${randomstring.generate({length: 12, charset: 'alphabetic'})}${Date.now()}`
  const labelDeclaration = `L${gasDeclaration}`
  const resultValue = `_${gasDeclaration}`
  var gensource = ''
  {
    const inSource = `var ${gasDeclaration} = ${gasSteps};
      ${labelDeclaration}:
      do {
        if(--${gasDeclaration} <= 0){
          throw new Error('gas-has-been-exhausted');
        }
        ${source};;
      }while(false);`
    gensource = instrumentation(inSource, gasDeclaration);
  }

  return {
    scrubedSource: 
    `var Atomics=undefined;var uneval=undefined;var Promise=undefined;var window=undefined;
    ${gensource};
    var ${resultValue} = main('${params}');
    `,
    gasStepsLeave : gasDeclaration,
    resultValue
  }
}

module.exports = scrub
