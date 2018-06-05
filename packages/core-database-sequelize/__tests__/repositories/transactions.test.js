'use strict'

const app = require('../__support__/setup')
const createConnection = require('../__support__/utils/create-connection')
const genesisBlock = require('../__fixtures__/genesisBlock')
const genesisTransaction = genesisBlock.transactions[0]

let connection
let repository
let spv

const getWallet = address => {
  return spv.walletManager.getWalletByAddress(address)
}

beforeAll(async (done) => {
  await app.setUp()

  connection = await createConnection()
  repository = connection.transactions

  done()
})

afterAll(async (done) => {
  await app.tearDown()

  done()
})

beforeEach(async (done) => {
  connection.disconnect()

  connection = await createConnection()
  repository = connection.transactions
  spv = new (require('../../lib/spv'))(connection)

  // To avoid timing out TODO better way
  const redisCache = {}
  repository.redis.get = jest.fn(key => redisCache[key])
  repository.redis.set = jest.fn((key, value) => (redisCache[key] = value))

  done()
})

describe('Transaction Repository', () => {
  it('should be an object', () => {
    expect(repository).toBeObject()
  })

  describe('findAll', () => {
    it('should be a function', () => {
      expect(repository.findAll).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAll()
      expect(transactions.count).toBe(100) // NOTE is honoring the default limit
    })

    // TODO this and other methods
    xit('should find all transactions with params', () => {
    })
  })

  describe('findAllByWallet', () => {
    it('should be a function', () => {
      expect(repository.findAllByWallet).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const receiver = await getWallet('AHXtmB84sTZ9Zd35h9Y1vfFvPE2Xzqj8ri')
      expect(receiver).toBeObject()
      const receiverTransactions = await repository.findAllByWallet(receiver)
      expect(receiverTransactions.count).toBe(1)

      const sender = await getWallet('APnhwwyTbMiykJwYbGhYjNgtHiVJDSEhSn')
      expect(sender).toBeObject()
      sender.publicKey = '035b63b4668ee261c16ca91443f3371e2fe349e131cb7bf5f8a3e93a3ddfdfc788'
      const senderTransactions = await repository.findAllByWallet(sender)
      expect(senderTransactions.count).toBe(51)
    })
  })

  describe('findAllBySender', () => {
    it('should be a function', () => {
      expect(repository.findAllBySender).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllBySender('03ba0fa7dd4760a15e46bc762ac39fc8cfb7022bdfef31d1fd73428404796c23fe')
      expect(transactions.count).toBe(2)
    })
  })

  describe('findAllByRecipient', () => {
    it('should be a function', () => {
      expect(repository.findAllByRecipient).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllByRecipient('AU8hpb5QKJXBx6QhAzy3CJJR69pPfdvp5t')
      expect(transactions.count).toBe(1)
    })
  })

  describe('allVotesBySender', () => {
    it('should be a function', () => {
      expect(repository.allVotesBySender).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.allVotesBySender('03d7dfe44e771039334f4712fb95ad355254f674c8f5d286503199157b7bf7c357')
      expect(transactions.count).toBe(1)
    })
  })

  describe('findAllByBlock', () => {
    it('should be a function', () => {
      expect(repository.findAllByBlock).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllByBlock(genesisBlock.data.id)
      expect(transactions.count).toBe(100) // NOTE is honoring the default limit
    })
  })

  describe('findAllByType', () => {
    it('should be a function', () => {
      expect(repository.findAllByType).toBeFunction()
    })

    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.findAllByType(2)
      expect(transactions.count).toBe(51)
    })
  })

  describe('findById', () => {
    it('should be a function', () => {
      expect(repository.findById).toBeFunction()
    })

    // TODO: this test requires Redis or is it failing?
    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transaction = await repository.findById(genesisTransaction.id)
      expect(transaction).toBeObject()
      expect(transaction.id).toBe(genesisTransaction.id)
    })
  })

  describe('findByTypeAndId', () => {
    it('should be a function', () => {
      expect(repository.findByTypeAndId).toBeFunction()
    })

    // TODO: this test requires Redis or is it failing?
    it('should find all transactions', async () => {
      await connection.saveBlock(genesisBlock)

      const transaction = await repository.findByTypeAndId(3, '96fe3cac1ef331269fa0ecad5b56a805fad78fe7278608d4d44991b690282778')
      expect(transaction).toBeObject()
      expect(transaction.id).toBe('96fe3cac1ef331269fa0ecad5b56a805fad78fe7278608d4d44991b690282778')
      expect(transaction.type).toBe(3)
    })
  })

  describe('search', async () => {
    const expectSearch = async (params, expected) => {
      await connection.saveBlock(genesisBlock)

      const transactions = await repository.search(params)
      expect(transactions).toBeObject()

      expect(transactions).toHaveProperty('count')
      expect(transactions.count).toBeNumber()

      expect(transactions).toHaveProperty('rows')
      expect(transactions.rows).toBeObject()
      expect(transactions.rows).not.toBeEmpty()

      expect(transactions.count).toBe(expected)
    }

    it('should be a function', () => {
      expect(repository.search).toBeFunction()
    })

    it('should search transactions by the specified id', async () => {
      await expectSearch({ id: genesisTransaction.id }, 1)
    })

    it('should search transactions by the specified blockId', async () => {
      await expectSearch({ blockId: genesisTransaction.blockId }, 153)
    })

    it('should search transactions by the specified type', async () => {
      await expectSearch({ type: genesisTransaction.type }, 153)
    })

    it('should search transactions by the specified version', async () => {
      await expectSearch({ version: genesisTransaction.version }, 153)
    })

    it('should search transactions by the specified senderPublicKey', async () => {
      await expectSearch({ senderPublicKey: genesisTransaction.senderPublicKey }, 51)
    })

    it('should search transactions by the specified recipientId', async () => {
      await expectSearch({ recipientId: genesisTransaction.recipientId }, 1)
    })

    it('should search transactions by the specified timestamp', async () => {
      await expectSearch({
        timestamp: {
          from: genesisTransaction.timestamp,
          to: genesisTransaction.timestamp
        }
      }, 153)
    })

    it('should search transactions by the specified amount', async () => {
      await expectSearch({
        amount: {
          from: genesisTransaction.amount,
          to: genesisTransaction.amount
        }
      }, 50)
    })

    it('should search transactions by the specified fee', async () => {
      await expectSearch({
        fee: {
          from: genesisTransaction.fee,
          to: genesisTransaction.fee
        }
      }, 153)
    })

    it('should search transactions by the specified vendorFieldHex', async () => {
      await expectSearch({ vendorFieldHex: genesisTransaction.vendorFieldHex }, 153)
    })
  })
})
