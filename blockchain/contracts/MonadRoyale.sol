// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

/**
 * @title  MonadRoyale
 * @notice On-chain battle-royale: players join, owner eliminates, last one alive wins.
 */
contract MonadRoyale {
    // ─── State ──────────────────────────────────────────────────────────────────

    address public immutable owner;
    address public winner;

    address[] private alivePlayers;
    address[] private eliminatedPlayers;

    mapping(address => bool) public hasJoined;
    mapping(address => bool) public isAlive;
    mapping(address => bool) public isEliminated;

    // ─── Events ──────────────────────────────────────────────────────────────────

    event PlayerJoined(address indexed player);
    event PlayerEliminated(address indexed player);
    event WinnerDeclared(address indexed winner);

    // ─── Errors ──────────────────────────────────────────────────────────────────

    error NotOwner();
    error AlreadyJoined();
    error PlayerNotAlive();
    error AlreadyEliminated();
    error GameOver();

    // ─── Modifiers ───────────────────────────────────────────────────────────────

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    /// @dev Blocks calls once a winner has been declared.
    modifier gameActive() {
        if (winner != address(0)) revert GameOver();
        _;
    }

    // ─── Constructor ─────────────────────────────────────────────────────────────

    constructor(address _owner) {
        owner = _owner;
    }

    // ─── External ────────────────────────────────────────────────────────────────

    /// @notice Register the caller as a game participant.
    function joinGame() external gameActive {
        if (hasJoined[msg.sender]) revert AlreadyJoined();

        hasJoined[msg.sender] = true;
        isAlive[msg.sender] = true;
        alivePlayers.push(msg.sender);

        emit PlayerJoined(msg.sender);
    }

    /// @notice Remove a player from the alive list. Declares winner when one remains.
    function eliminatePlayer(address player) external onlyOwner gameActive {
        if (isEliminated[player]) revert AlreadyEliminated();
        if (!isAlive[player]) revert PlayerNotAlive();

        isAlive[player] = false;
        isEliminated[player] = true;
        eliminatedPlayers.push(player);

        _removeFromAlive(player);

        emit PlayerEliminated(player);

        if (alivePlayers.length == 1) {
            winner = alivePlayers[0];
            emit WinnerDeclared(winner);
        }
    }

    // ─── View ─────────────────────────────────────────────────────────────────

    function getAlivePlayers() external view returns (address[] memory) {
        return alivePlayers;
    }

    function getEliminatedPlayers() external view returns (address[] memory) {
        return eliminatedPlayers;
    }

    function getWinner() external view returns (address) {
        return winner;
    }

    // ─── Internal ────────────────────────────────────────────────────────────────

    /// @dev O(n) removal; swap-with-last to avoid shifting the array.
    function _removeFromAlive(address player) internal {
        uint256 len = alivePlayers.length;
        for (uint256 i = 0; i < len; i++) {
            if (alivePlayers[i] == player) {
                alivePlayers[i] = alivePlayers[len - 1];
                alivePlayers.pop();
                break;
            }
        }
    }
}
