const tape = require('tape')
const createHookedVm = require('ethereumjs-vm/lib/hooked')
const _ = require('eth-needlework/lib/opCodes')
const opFn = require('eth-needlework/lib/opFn')
const returnLastOnStack = require('eth-needlework/lib/returnLastOnStack')
const pushData = require('eth-needlework/lib/pushData')
const compile = require('eth-needlework/lib/compile')
const memWrite = require('eth-needlework/lib/memWrite')
const codeToConstructor = require('eth-needlework/lib/codeToConstructor')

// console.log('target contract:')
// var code = compileTargetContract()
// console.log('code:', code.toString('hex'))
// console.log(codeToConstructor(code))
// var constructor = new Buffer(compile(codeToConstructor(code)))
// console.log('constructor:', constructor.toString('hex'))

console.log('reflector contract:')
var code = compileReflectorContract('0x00841a741bf74f5f1937508bf6aef25057dae42e')
console.log('code:', code.toString('hex'))
console.log(codeToConstructor(code))
var constructor = new Buffer(compile(codeToConstructor(code)))
console.log('constructor:', constructor.toString('hex'))


function compileTargetContract( ){
  // a contract that returns the `msg.sender`
  var targetContractCodeStructure = [
    _.CALLER,
    returnLastOnStack({ mstoreOffset: 0x60, returnLength: 0x20 }),
  ]

  return new Buffer(compile(targetContractCodeStructure))
}

function compileReflectorContract(targetContractAddressHex){
  // a contract that calls delegate call to another contract
  // '0x04CB1AdE2Bd72aCD758d4f7abacbC633fC532857'
  0xa9059cbb00000000000000000000000004cb1ade2bd72acd758d4f7abacbc633fc5328570000000000000000000000000000000000000000000000000000000000000001
  // method: a9059cbb
  // to: 0000000000000000000000000,04cb1ade2bd72acd758d4f7abacbc633fc532857
  // amount: 0000000000000000000000000000000000000000000000000000000000000001
  // pushData(new Buffer('a9059cbb00000000000000000000000004cb1ade2bd72acd758d4f7abacbc633fc5328570000000000000000000000000000000000000000000000000000000000000001', 'hex'))
  // var transferFundsRequestData = ''
  var tokenCallArgs = new Buffer('a9059cbb00000000000000000000000004cb1ade2bd72acd758d4f7abacbc633fc5328570000000000000000000000000000000000000000000000000000000000000001', 'hex')

  var reflectContractCodeStructure = [
    memWrite({ offset: 0, data: tokenCallArgs }),
    opFn.delegateCall({
      gas: new Buffer('00ffffffff', 'hex'),
      toAddress: new Buffer(targetContractAddressHex.slice(2), 'hex'),
      inOffset: 0x00,
      inLength: tokenCallArgs.length,
      outOffset: 0x00,
      outLength: 0x00,
    }),
    // opFn.return({ offset: 12, length: 20 }),
  ]
  return new Buffer(compile(reflectContractCodeStructure))
}

// tape('delegate call impersonate test', function (test) {
//   var victimContractAddressHex = '0xaaaa000000000000000000000000000000000000'
//   var reflectContractAddressHex = '0x0100000000000000000000000000000000000000'
//   var targetContractAddressHex =  '0x0200000000000000000000000000000000000000'

//   var victimContractAddressHex = 

//   var targetContractCode = compileTargetContract()
//   deployContract(targetContractCode, function(err, targetContractAddressHex){
//     if (err) throw err

//     var reflectContractCode = compileReflectorContract(targetContractAddressHex)
//     deployContract(reflectContractCode, function(reflectContractAddressHex){
//     if (err) throw err


//     })
//   })

  
//   // }, function (err, results) {
    
//   //   console.log(`========================================================`)
//   //   console.log(results)

//   //   test.ifError(err, 'Should run code without error')
//   //   test.ifError(results.exceptionError, 'Should run code without vm error')

//   //   test.equals('0x'+results.return.toString('hex'), victimContractAddressHex, 'target contract\'s msg.sender was the victim address')

//   //   test.end()
//   // })
// })

