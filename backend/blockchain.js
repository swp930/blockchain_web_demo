const crypto = require('crypto');

class Block {
  constructor(index, timestamp, data, previousHash = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    this.hash = this.calculateHash();
  }

  calculateHash() {
    return crypto
      .createHash('sha256')
      .update(
        this.index +
          this.previousHash +
          this.timestamp +
          JSON.stringify(this.data) +
          this.nonce
      )
      .digest('hex');
  }

  mineBlock(difficulty) {
    const target = '0'.repeat(difficulty);
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 3;
    this.pendingTransactions = [];
    this.miningReward = 10;
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), { note: 'Genesis Block — the first block' }, '0');
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransaction(tx) {
    if (!tx.from || !tx.to || typeof tx.amount !== 'number') {
      throw new Error('Transaction must include from, to, and a numeric amount');
    }
    this.pendingTransactions.push({
      from: tx.from,
      to: tx.to,
      amount: tx.amount,
      timestamp: Date.now(),
    });
  }

  minePendingTransactions(minerAddress) {
    const rewardTx = {
      from: 'NETWORK',
      to: minerAddress || 'miner',
      amount: this.miningReward,
      timestamp: Date.now(),
    };

    const blockData = {
      transactions: [...this.pendingTransactions, rewardTx],
    };

    const block = new Block(
      this.chain.length,
      Date.now(),
      blockData,
      this.getLatestBlock().hash
    );

    block.mineBlock(this.difficulty);
    this.chain.push(block);
    this.pendingTransactions = [];
    return block;
  }

  mineBlockWithData(data) {
    const block = new Block(
      this.chain.length,
      Date.now(),
      data,
      this.getLatestBlock().hash
    );
    block.mineBlock(this.difficulty);
    this.chain.push(block);
    return block;
  }

  getBalance(address) {
    let balance = 0;
    for (const block of this.chain) {
      const txs = block.data?.transactions;
      if (!Array.isArray(txs)) continue;
      for (const tx of txs) {
        if (tx.from === address) balance -= tx.amount;
        if (tx.to === address) balance += tx.amount;
      }
    }
    return balance;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const current = this.chain[i];
      const previous = this.chain[i - 1];

      if (current.hash !== current.calculateHash()) {
        return { valid: false, reason: `Block ${i} hash is invalid` };
      }
      if (current.previousHash !== previous.hash) {
        return { valid: false, reason: `Block ${i} previousHash does not match previous block` };
      }
      const target = '0'.repeat(this.difficulty);
      if (current.hash.substring(0, this.difficulty) !== target) {
        return { valid: false, reason: `Block ${i} does not meet proof-of-work` };
      }
    }
    return { valid: true, reason: 'Chain is valid' };
  }

  toJSON() {
    return {
      difficulty: this.difficulty,
      pendingTransactions: this.pendingTransactions,
      chain: this.chain,
    };
  }
}

module.exports = { Blockchain, Block };
