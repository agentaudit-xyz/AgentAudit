[README (6).md](https://github.com/user-attachments/files/26829905/README.6.md)
# AgentAudit
> If your AI agent made a bad call, can you prove it?

Immutable on-chain audit logs for autonomous AI agents.

License: MIT | npm | Part of RunLockAI

Website: getagentaudit.xyz  
Part of: RunLockAI — the runtime security ecosystem for AI agents

## The Problem

AI agents are executing high-value actions autonomously — transferring funds, voting on proposals, calling APIs, signing transactions. In Q1 2026 alone, $45M+ was lost to AI agent exploits.

When something goes wrong, there is no audit trail. No one can prove what the agent decided, when, or why.

AgentAudit solves this.

## What It Does

AgentAudit writes every agent action to the blockchain — immutable, timestamped, and permanently verifiable.

- Who authorized the action
- What was decided (action type + payload)
- When it happened (block timestamp)
- Where it was executed (block number + tx hash)

Every entry satisfies EU AI Act logging requirements (Articles 9, 13, 14, 15, 17, 72).

## Architecture

```
Your AI Agent
     │
     └── @agentaudit-xyz/sdk
              │
              ▼
     AuditVault.sol  (Mantle / Arbitrum / any EVM)
              │
              ▼
     Immutable on-chain log
     queryable by agentId, sessionId, timestamp
```

## Quick Start

```bash
npm install @agentaudit-xyz/sdk
```

```typescript
import { AgentAudit } from '@agentaudit-xyz/sdk'

const audit = new AgentAudit({
  rpcUrl:          'https://rpc.sepolia.mantle.xyz',
  contractAddress: '0xYourAuditVaultAddress',
  privateKey:      process.env.AGENT_PRIVATE_KEY,
})

await audit.registerAgent('my-defi-agent', {
  model:   'gpt-4o',
  version: '1.0.0',
  owner:   '0xYourWallet',
})

const result = await audit.logAction({
  agentId:    'my-defi-agent',
  actionType: 'TRANSFER',
  payload:    { to: '0xabc...', amount: '500 USDC' },
})

console.log('On-chain:', result.txHash)
```

## Batch Logging (Gas Efficient)

```typescript
await audit.logActionBatch('my-defi-agent', [
  { actionType: 'PRICE_CHECK', payload: { pair: 'ETH/USDC' } },
  { actionType: 'SWAP',        payload: { from: 'ETH', to: 'USDC', amount: '1.2' } },
  { actionType: 'TRANSFER',    payload: { to: '0xabc...', amount: '3100 USDC' } },
])
```

## Read the Audit Log

```typescript
const log = await audit.getAuditLog('my-defi-agent')
console.log(`${log.length} actions recorded`)

const entry = await audit.getAuditEntry('my-defi-agent', 0)
console.log(entry.actionType, entry.timestamp)
```

## Repository Structure

```
AgentAudit/
├── contracts/
│   └── AuditVault.sol      ← Core smart contract
├── sdk/
│   ├── src/
│   │   └── index.ts        ← TypeScript SDK
│   └── package.json
├── index.html              ← Landing page (getagentaudit.xyz)
└── README.md
```

## ElizaOS Integration

AgentAudit is available as a native ElizaOS plugin.

```bash
cd plugin-elizaos
npm install
```

```javascript
const agentAuditPlugin = require('./plugin-elizaos');
// add to plugins array in your ElizaOS config
```

Every agent message is automatically logged to the blockchain as an immutable audit entry.

✅ Live on Arbitrum Sepolia — TX: `0xecb8a7b3676d6e2c24cf1110351de5192a2102ca386ecebba2fe91aa1bfdee5f`

## Supported Networks

| Network | Status |
|---|---|
| Mantle Sepolia Testnet | 🟡 Deploy with AuditVault.sol |
| Arbitrum One | 🟡 Deploy with AuditVault.sol |
| Any EVM chain | ✅ Self-deploy |

## EU AI Act Compliance

AgentAudit's on-chain logs directly satisfy:

| Article | Requirement | How AgentAudit covers it |
|---|---|---|
| Art. 9 | Risk management system | Audit trail for risk review |
| Art. 13 | Transparency & logging | Immutable action logs |
| Art. 14 | Human oversight | Verifiable agent decisions |
| Art. 15 | Accuracy & robustness | Tamper-proof records |
| Art. 17 | Quality management | Full audit history |
| Art. 72 | Post-market monitoring | Continuous on-chain log throughout agent's operational lifetime |

### Article 72 — Post-Market Monitoring

EU AI Act Article 72 requires providers to systematically collect and document performance data for high-risk AI systems throughout their entire operational lifetime.

AgentAudit satisfies this requirement by design: every agent action is written to an immutable on-chain log — creating a permanent, tamper-proof record that regulators, auditors, and deployers can query at any time.

No manual reporting. No data gaps. Continuous compliance by default.

## KYA — Know Your Agent

Just as DeFi protocols use KYC to verify users, KYA verifies autonomous AI agents — giving protocols, DAOs, and regulators a way to identify, audit, and trust the agents operating in their ecosystem.

### What a KYA Credential Contains

| Field | Description |
|---|---|
| `agentId` | Unique on-chain identifier |
| `model` | AI model name + version |
| `owner` | Deploying wallet address |
| `auditHash` | Hash of the agent's audit log |
| `complianceLevel` | EU AI Act compliance status |
| `issuedAt` | Block timestamp of credential issuance |

### Soulbound Token (SBT)

KYA credentials are issued as Soulbound Tokens — non-transferable, permanently linked to the agent's identity. Once issued, the credential cannot be moved or forged.

### EU AI Act Alignment

KYA credentials directly support Article 14 (human oversight) and Article 13 (transparency) by providing a verifiable, tamper-proof identity layer for every autonomous agent.

### KYA Standard

The full specification is available in [`KYA_STANDARD.md`](./KYA_STANDARD.md).

### Register Your Agent

```typescript
await audit.registerAgent('my-defi-agent', {
  model:   'gpt-4o',
  version: '1.0.0',
  owner:   '0xYourWallet',
})
```

A KYA credential is automatically issued on registration.

## Part of RunLockAI

| Project | Role |
|---|---|
| ShieldAI | Runtime spend enforcement |
| AgentAudit | On-chain audit logging |
| AgentPay | Autonomous payment rails |
| StableSwitch | Stablecoin routing |

## License

MIT — free to use, fork, and build on.

Contact: contact@getagentaudit.xyz  
Twitter: @AgentAudit  
Website: getagentaudit.xyz
