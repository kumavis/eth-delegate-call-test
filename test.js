const tape = require('tape')
const createHookedVm = require('ethereumjs-vm/lib/hooked')
const _ = require('eth-needlework/lib/opCodes')
const opFn = require('eth-needlework/lib/opFn')
const returnLastOnStack = require('eth-needlework/lib/returnLastOnStack')
const pushData = require('eth-needlework/lib/pushData')
const compile = require('eth-needlework/lib/compile')

tape('delegate call impersonate test', function (test) {
  var victimContractAddressHex = '0xaaaa000000000000000000000000000000000000'
  var reflectContractAddressHex = '0x0100000000000000000000000000000000000000'
  var targetContractAddressHex =  '0x0200000000000000000000000000000000000000'

  // a contract that calls delegate call to another contract
  var reflectContractCodeStructure = [
    opFn.delegateCall({
      gas: new Buffer('00ffffffff', 'hex'),
      toAddress: new Buffer(targetContractAddressHex.slice(2), 'hex'),
      inOffset: 0x00,
      inLength: 0x00,
      outOffset: 0x00,
      outLength: 0x20,
    }),
    opFn.return({ offset: 12, length: 20 }),
  ]
  var reflectContractCode = new Buffer(compile(reflectContractCodeStructure))

  // a contract that returns the `msg.sender`
  var targetContractCodeStructure = [
    _.CALLER,
    returnLastOnStack({ mstoreOffset: 0x60, returnLength: 0x20 }),
  ]
  var targetContractCode = new Buffer(compile(targetContractCodeStructure))

  var blockchainState = {
    [reflectContractAddressHex]: {
      code: '0x' + reflectContractCode.toString('hex'),
      balance: '0x00',
      nonce: '0x00',
      storage: {}
    },
    [targetContractAddressHex]: {
      code: '0x' + targetContractCode.toString('hex'),
      balance: '0x00',
      nonce: '0x00',
      storage: {}
    },
  }

  var vm = createHookedVm({
    enableHomestead: true
  }, hooksForBlockchainState(blockchainState))

  vm.on('step', function(stepData){
    console.log(`========================================================`)
    console.log(`${stepData.opcode.name} (${stepData.opcode.in})->(${stepData.opcode.out})`)
    console.log(`stack:`,stepData.stack)
    console.log(`memory:`,stepData.memory.join(','))
  })

  vm.runCode({
    code: reflectContractCode,
    address: new Buffer(reflectContractAddressHex.slice(2), 'hex'),
    caller: new Buffer(victimContractAddressHex.slice(2), 'hex'),
    gasLimit: new Buffer('ffffffffff')
  }, function (err, results) {
    
    console.log(`========================================================`)
    console.log(results)

    test.ifError(err, 'Should run code without error')
    test.ifError(results.exceptionError, 'Should run code without vm error')

    test.equals('0x'+results.return.toString('hex'), victimContractAddressHex, 'target contract\'s msg.sender was the victim address')

    test.end()
  })
})

function hooksForBlockchainState (blockchainState) {
  return {
    fetchAccountBalance: function (addressHex, cb) {
      var value = blockchainState[addressHex].balance
        // console.log('fetchAccountBalance', addressHex, '->', value)
      cb(null, value)
    },
    fetchAccountNonce: function (addressHex, cb) {
      var value = blockchainState[addressHex].nonce
        // console.log('fetchAccountNonce', addressHex, '->', value)
      cb(null, value)
    },
    fetchAccountCode: function (addressHex, cb) {
      var value = blockchainState[addressHex].code
        // console.log('fetchAccountCode', addressHex, '->', value)
      cb(null, value)
    },
    fetchAccountStorage: function (addressHex, keyHex, cb) {
      var value = blockchainState[addressHex].storage[keyHex]
        // console.log('fetchAccountStorage', addressHex, keyHex, '->', value)
      cb(null, value)
    }
  }
}
