import { useCallback, useEffect, useState } from 'react';

const API = '/api';

function short(h = '', n = 10) {
  if (!h) return '';
  return h.length <= n * 2 ? h : `${h.slice(0, n)}…${h.slice(-n)}`;
}

export default function App() {
  const [state, setState] = useState({ chain: [], pendingTransactions: [], difficulty: 3 });
  const [valid, setValid] = useState({ valid: true, reason: '' });
  const [from, setFrom] = useState('alice');
  const [to, setTo] = useState('bob');
  const [amount, setAmount] = useState(5);
  const [miner, setMiner] = useState('alice');
  const [note, setNote] = useState('Hello blockchain');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const refresh = useCallback(async () => {
    const [chainRes, validRes] = await Promise.all([
      fetch(`${API}/chain`).then((r) => r.json()),
      fetch(`${API}/validate`).then((r) => r.json()),
    ]);
    setState(chainRes);
    setValid(validRes);
  }, []);

  useEffect(() => {
    refresh().catch((e) => setMsg(e.message));
  }, [refresh]);

  async function addTx(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`${API}/transaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ from, to, amount: Number(amount) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg('Transaction queued in the mempool.');
      await refresh();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function mine() {
    setBusy(true);
    setMsg('Mining… finding a nonce whose hash starts with zeros.');
    try {
      const res = await fetch(`${API}/mine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ miner }),
      });
      const data = await res.json();
      setMsg(`Mined block #${data.block.index} in ${data.timeMs} ms (nonce ${data.block.nonce}).`);
      await refresh();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function mineNote() {
    setBusy(true);
    setMsg('Mining a data block…');
    try {
      const res = await fetch(`${API}/mine-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { note } }),
      });
      const data = await res.json();
      setMsg(`Mined block #${data.block.index} in ${data.timeMs} ms.`);
      await refresh();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function setDifficulty(d) {
    setBusy(true);
    try {
      await fetch(`${API}/difficulty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty: Number(d) }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Simple Blockchain</h1>
          <p className="sub">
            A tiny Node + Express + React demo. Each block stores data, a link to the previous
            hash, and a nonce found by proof-of-work so the hash starts with zeros.
          </p>
        </div>
        <div className="badge">
          <span className={`dot ${valid.valid ? '' : 'bad'}`} />
          {valid.valid ? 'Chain valid' : valid.reason}
        </div>
      </header>

      <div className="grid">
        <aside className="panel">
          <h2>Add a transaction</h2>
          <form onSubmit={addTx}>
            <div className="row">
              <div>
                <label>From</label>
                <input value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label>To</label>
                <input value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <label>Amount</label>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button disabled={busy}>Queue transaction</button>
          </form>

          <h2 style={{ marginTop: 22 }}>Mine pending txs</h2>
          <label>Miner address (gets reward)</label>
          <input value={miner} onChange={(e) => setMiner(e.target.value)} />
          <button disabled={busy} onClick={mine}>
            Mine block
          </button>

          <h2 style={{ marginTop: 22 }}>Or mine a note</h2>
          <label>Data</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} />
          <button className="secondary" disabled={busy} onClick={mineNote}>
            Mine data block
          </button>

          <label>Difficulty (leading zeros)</label>
          <select
            value={state.difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={busy}
          >
            {[1, 2, 3, 4].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="status">{msg}</div>
          <p className="legend">
            Pending txs: <strong>{state.pendingTransactions?.length || 0}</strong>
            <br />
            Difficulty {state.difficulty} means hashes must start with{' '}
            <code>{'0'.repeat(state.difficulty || 0)}</code>. Higher = slower mining.
          </p>
        </aside>

        <section className="panel">
          <h2>The chain ({state.chain?.length || 0} blocks)</h2>
          <div className="chain">
            {(state.chain || []).map((block) => {
              const txs = block.data?.transactions;
              return (
                <article className="block" key={block.index}>
                  <div className="block-top">
                    <span className="idx">Block #{block.index}</span>
                    <span className="meta">
                      nonce {block.nonce} · {new Date(block.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="k">Previous hash</div>
                  <div className="hash">{block.previousHash}</div>
                  <div className="k">This hash</div>
                  <div className="hash">{block.hash}</div>
                  {Array.isArray(txs) ? (
                    txs.map((tx, i) => (
                      <div className="tx" key={i}>
                        {tx.from} → {tx.to} · {tx.amount}
                      </div>
                    ))
                  ) : (
                    <div className="tx">{JSON.stringify(block.data)}</div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
