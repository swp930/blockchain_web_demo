const express = require('express');
const cors = require('cors');
const { Blockchain } = require('./blockchain');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

const blockchain = new Blockchain();

app.get('/api/chain', (req, res) => {
  res.json(blockchain.toJSON());
});

app.get('/api/validate', (req, res) => {
  res.json(blockchain.isChainValid());
});

app.get('/api/balance/:address', (req, res) => {
  res.json({ address: req.params.address, balance: blockchain.getBalance(req.params.address) });
});

app.post('/api/transaction', (req, res) => {
  try {
    blockchain.addTransaction(req.body);
    res.json({
      message: 'Transaction added to pending pool',
      pending: blockchain.pendingTransactions,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/mine', (req, res) => {
  const miner = req.body.miner || 'alice';
  const started = Date.now();
  const block = blockchain.minePendingTransactions(miner);
  res.json({
    message: `Block ${block.index} mined`,
    timeMs: Date.now() - started,
    block,
    chainLength: blockchain.chain.length,
  });
});

app.post('/api/mine-data', (req, res) => {
  const data = req.body.data || { note: 'Empty block' };
  const started = Date.now();
  const block = blockchain.mineBlockWithData(data);
  res.json({
    message: `Block ${block.index} mined with custom data`,
    timeMs: Date.now() - started,
    block,
  });
});

app.post('/api/difficulty', (req, res) => {
  const d = Number(req.body.difficulty);
  if (!Number.isInteger(d) || d < 1 || d > 5) {
    return res.status(400).json({ error: 'Difficulty must be an integer from 1 to 5' });
  }
  blockchain.difficulty = d;
  res.json({ difficulty: blockchain.difficulty });
});

app.listen(PORT, () => {
  console.log(`Blockchain API running on http://localhost:${PORT}`);
});
