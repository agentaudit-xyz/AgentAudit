// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AuditVault
 * @author AgentAudit — getagentaudit.xyz
 * @notice Immutable on-chain audit log for AI agent decisions.
 *         Every action an agent takes can be recorded here —
 *         who authorized it, what was decided, and when.
 *
 *         EU AI Act compliant logging (Articles 9, 13, 14, 15, 17).
 */
contract AuditVault {

    // ─── Events ───────────────────────────────────────────────────────────────

    event ActionLogged(
        bytes32 indexed agentId,
        bytes32 indexed sessionId,
        address indexed caller,
        string  actionType,
        string  payload,
        uint256 timestamp
    );

    event AgentRegistered(
        bytes32 indexed agentId,
        address indexed owner,
        string  metadata,
        uint256 timestamp
    );

    // ─── Structs ──────────────────────────────────────────────────────────────

    struct AuditEntry {
        bytes32 agentId;
        bytes32 sessionId;
        address caller;
        string  actionType;
        string  payload;
        uint256 timestamp;
        uint256 blockNumber;
    }

    struct AgentProfile {
        address owner;
        string  metadata;
        uint256 registeredAt;
        bool    active;
    }

    // ─── Storage ──────────────────────────────────────────────────────────────

    /// agentId => list of audit entries
    mapping(bytes32 => AuditEntry[]) private _auditLog;

    /// agentId => agent profile
    mapping(bytes32 => AgentProfile) public agents;

    /// agentId => authorized loggers (agent wallets allowed to write)
    mapping(bytes32 => mapping(address => bool)) public authorizedLoggers;

    // ─── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyAuthorized(bytes32 agentId) {
        require(
            agents[agentId].owner == msg.sender ||
            authorizedLoggers[agentId][msg.sender],
            "AuditVault: not authorized"
        );
        _;
    }

    modifier agentExists(bytes32 agentId) {
        require(agents[agentId].registeredAt != 0, "AuditVault: agent not registered");
        _;
    }

    // ─── Registration ─────────────────────────────────────────────────────────

    /**
     * @notice Register a new AI agent for audit logging.
     * @param agentId   Unique identifier (e.g. keccak256 of agent name + owner)
     * @param metadata  JSON string with agent description, model, version
     */
    function registerAgent(bytes32 agentId, string calldata metadata) external {
        require(agents[agentId].registeredAt == 0, "AuditVault: agent already registered");
        agents[agentId] = AgentProfile({
            owner: msg.sender,
            metadata: metadata,
            registeredAt: block.timestamp,
            active: true
        });
        authorizedLoggers[agentId][msg.sender] = true;
        emit AgentRegistered(agentId, msg.sender, metadata, block.timestamp);
    }

    /**
     * @notice Authorize an additional wallet to log actions for this agent.
     */
    function addLogger(bytes32 agentId, address logger) external agentExists(agentId) {
        require(agents[agentId].owner == msg.sender, "AuditVault: not owner");
        authorizedLoggers[agentId][logger] = true;
    }

    // ─── Logging ──────────────────────────────────────────────────────────────

    /**
     * @notice Log a single agent action on-chain.
     * @param agentId    Registered agent identifier
     * @param sessionId  Session/conversation identifier
     * @param actionType Short label e.g. "TRANSFER", "DAO_VOTE", "API_CALL"
     * @param payload    JSON string with action details (redact sensitive data)
     */
    function logAction(
        bytes32 agentId,
        bytes32 sessionId,
        string calldata actionType,
        string calldata payload
    ) external agentExists(agentId) onlyAuthorized(agentId) {
        _auditLog[agentId].push(AuditEntry({
            agentId:     agentId,
            sessionId:   sessionId,
            caller:      msg.sender,
            actionType:  actionType,
            payload:     payload,
            timestamp:   block.timestamp,
            blockNumber: block.number
        }));

        emit ActionLogged(agentId, sessionId, msg.sender, actionType, payload, block.timestamp);
    }

    /**
     * @notice Batch log multiple actions in one transaction (gas efficient).
     */
    function logActionBatch(
        bytes32 agentId,
        bytes32[] calldata sessionIds,
        string[] calldata actionTypes,
        string[] calldata payloads
    ) external agentExists(agentId) onlyAuthorized(agentId) {
        require(
            sessionIds.length == actionTypes.length &&
            actionTypes.length == payloads.length,
            "AuditVault: array length mismatch"
        );

        for (uint256 i = 0; i < sessionIds.length; i++) {
            _auditLog[agentId].push(AuditEntry({
                agentId:     agentId,
                sessionId:   sessionIds[i],
                caller:      msg.sender,
                actionType:  actionTypes[i],
                payload:     payloads[i],
                timestamp:   block.timestamp,
                blockNumber: block.number
            }));

            emit ActionLogged(agentId, sessionIds[i], msg.sender, actionTypes[i], payloads[i], block.timestamp);
        }
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    function getAuditLog(bytes32 agentId) external view returns (AuditEntry[] memory) {
        return _auditLog[agentId];
    }

    function getAuditLogCount(bytes32 agentId) external view returns (uint256) {
        return _auditLog[agentId].length;
    }

    function getAuditEntry(bytes32 agentId, uint256 index) external view returns (AuditEntry memory) {
        require(index < _auditLog[agentId].length, "AuditVault: index out of bounds");
        return _auditLog[agentId][index];
    }
}
