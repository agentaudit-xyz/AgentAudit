import { ethers } from "ethers";

// ─── ABI (minimal) ────────────────────────────────────────────────────────────

const AUDIT_VAULT_ABI = [
  "function registerAgent(bytes32 agentId, string metadata) external",
  "function addLogger(bytes32 agentId, address logger) external",
  "function logAction(bytes32 agentId, bytes32 sessionId, string actionType, string payload) external",
  "function logActionBatch(bytes32 agentId, bytes32[] sessionIds, string[] actionTypes, string[] payloads) external",
  "function getAuditLog(bytes32 agentId) external view returns (tuple(bytes32 agentId, bytes32 sessionId, address caller, string actionType, string payload, uint256 timestamp, uint256 blockNumber)[])",
  "function getAuditLogCount(bytes32 agentId) external view returns (uint256)",
  "function getAuditEntry(bytes32 agentId, uint256 index) external view returns (tuple(bytes32 agentId, bytes32 sessionId, address caller, string actionType, string payload, uint256 timestamp, uint256 blockNumber))",
  "function agents(bytes32 agentId) external view returns (address owner, string metadata, uint256 registeredAt, bool active)",
  "event ActionLogged(bytes32 indexed agentId, bytes32 indexed sessionId, address indexed caller, string actionType, string payload, uint256 timestamp)",
];

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentAuditConfig {
  /** RPC endpoint (Mantle, Arbitrum, or any EVM chain) */
  rpcUrl: string;
  /** AuditVault contract address */
  contractAddress: string;
  /** Private key of the authorized logger wallet */
  privateKey: string;
}

export interface AuditEntry {
  agentId: string;
  sessionId: string;
  caller: string;
  actionType: string;
  payload: string;
  timestamp: number;
  blockNumber: number;
}

export interface LogActionParams {
  agentId: string;
  sessionId?: string;
  actionType: string;
  payload: Record<string, unknown> | string;
}

export interface LogResult {
  txHash: string;
  blockNumber: number;
  timestamp: number;
}

// ─── SDK ──────────────────────────────────────────────────────────────────────

export class AgentAudit {
  private provider: ethers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private contract: ethers.Contract;

  constructor(config: AgentAuditConfig) {
    this.provider = new ethers.JsonRpcProvider(config.rpcUrl);
    this.signer = new ethers.Wallet(config.privateKey, this.provider);
    this.contract = new ethers.Contract(
      config.contractAddress,
      AUDIT_VAULT_ABI,
      this.signer
    );
  }

  // ─── Registration ───────────────────────────────────────────────────────────

  /**
   * Register a new agent. Call once before logging.
   */
  async registerAgent(
    agentName: string,
    metadata: Record<string, unknown>
  ): Promise<{ agentId: string; txHash: string }> {
    const agentId = ethers.keccak256(
      ethers.toUtf8Bytes(`${agentName}:${this.signer.address}`)
    );

    const tx = await this.contract.registerAgent(
      agentId,
      JSON.stringify(metadata)
    );
    const receipt = await tx.wait();

    return { agentId, txHash: receipt.hash };
  }

  /**
   * Derive agentId from name (deterministic, no tx needed).
   */
  getAgentId(agentName: string): string {
    return ethers.keccak256(
      ethers.toUtf8Bytes(`${agentName}:${this.signer.address}`)
    );
  }

  // ─── Logging ────────────────────────────────────────────────────────────────

  /**
   * Log a single agent action on-chain.
   */
  async logAction(params: LogActionParams): Promise<LogResult> {
    const agentId = params.agentId.startsWith("0x")
      ? params.agentId
      : this.getAgentId(params.agentId);

    const sessionId = params.sessionId
      ? ethers.keccak256(ethers.toUtf8Bytes(params.sessionId))
      : ethers.keccak256(ethers.toUtf8Bytes(Date.now().toString()));

    const payload =
      typeof params.payload === "string"
        ? params.payload
        : JSON.stringify(params.payload);

    const tx = await this.contract.logAction(
      agentId,
      sessionId,
      params.actionType,
      payload
    );
    const receipt = await tx.wait();
    const block = await this.provider.getBlock(receipt.blockNumber);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: block?.timestamp ?? Math.floor(Date.now() / 1000),
    };
  }

  /**
   * Batch log multiple actions (more gas efficient).
   */
  async logActionBatch(
    agentId: string,
    actions: Array<{ sessionId?: string; actionType: string; payload: Record<string, unknown> | string }>
  ): Promise<LogResult> {
    const id = agentId.startsWith("0x") ? agentId : this.getAgentId(agentId);

    const sessionIds = actions.map((a) =>
      ethers.keccak256(ethers.toUtf8Bytes(a.sessionId ?? Date.now().toString()))
    );
    const actionTypes = actions.map((a) => a.actionType);
    const payloads = actions.map((a) =>
      typeof a.payload === "string" ? a.payload : JSON.stringify(a.payload)
    );

    const tx = await this.contract.logActionBatch(id, sessionIds, actionTypes, payloads);
    const receipt = await tx.wait();
    const block = await this.provider.getBlock(receipt.blockNumber);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      timestamp: block?.timestamp ?? Math.floor(Date.now() / 1000),
    };
  }

  // ─── Read ────────────────────────────────────────────────────────────────────

  /**
   * Fetch full audit log for an agent.
   */
  async getAuditLog(agentId: string): Promise<AuditEntry[]> {
    const id = agentId.startsWith("0x") ? agentId : this.getAgentId(agentId);
    const entries = await this.contract.getAuditLog(id);
    return entries.map(this._formatEntry);
  }

  async getAuditLogCount(agentId: string): Promise<number> {
    const id = agentId.startsWith("0x") ? agentId : this.getAgentId(agentId);
    const count = await this.contract.getAuditLogCount(id);
    return Number(count);
  }

  async getAuditEntry(agentId: string, index: number): Promise<AuditEntry> {
    const id = agentId.startsWith("0x") ? agentId : this.getAgentId(agentId);
    const entry = await this.contract.getAuditEntry(id, index);
    return this._formatEntry(entry);
  }

  private _formatEntry(e: any): AuditEntry {
    return {
      agentId: e.agentId,
      sessionId: e.sessionId,
      caller: e.caller,
      actionType: e.actionType,
      payload: e.payload,
      timestamp: Number(e.timestamp),
      blockNumber: Number(e.blockNumber),
    };
  }
}

export default AgentAudit;
