// Derived from blockchain/contracts/MonadRoyale.sol
// Matches the output of: forge build → out/MonadRoyale.sol/MonadRoyale.json .abi
export const CONTRACT_ABI = [
  // ── Constructor ────────────────────────────────────────────────────────────
  {
    type: "constructor",
    inputs: [{ name: "_owner", type: "address", internalType: "address" }],
    stateMutability: "nonpayable",
  },

  // ── Public state getters ───────────────────────────────────────────────────
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "winner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "hasJoined",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isAlive",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isEliminated",
    inputs: [{ name: "", type: "address", internalType: "address" }],
    outputs: [{ name: "", type: "bool", internalType: "bool" }],
    stateMutability: "view",
  },

  // ── Write functions ────────────────────────────────────────────────────────
  {
    type: "function",
    name: "joinGame",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "eliminatePlayer",
    inputs: [{ name: "player", type: "address", internalType: "address" }],
    outputs: [],
    stateMutability: "nonpayable",
  },

  // ── View functions ─────────────────────────────────────────────────────────
  {
    type: "function",
    name: "getAlivePlayers",
    inputs: [],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getEliminatedPlayers",
    inputs: [],
    outputs: [{ name: "", type: "address[]", internalType: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getWinner",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },

  // ── Events ─────────────────────────────────────────────────────────────────
  {
    type: "event",
    name: "PlayerJoined",
    inputs: [{ name: "player", type: "address", indexed: true, internalType: "address" }],
    anonymous: false,
  },
  {
    type: "event",
    name: "PlayerEliminated",
    inputs: [{ name: "player", type: "address", indexed: true, internalType: "address" }],
    anonymous: false,
  },
  {
    type: "event",
    name: "WinnerDeclared",
    inputs: [{ name: "winner", type: "address", indexed: true, internalType: "address" }],
    anonymous: false,
  },

  // ── Custom errors ──────────────────────────────────────────────────────────
  { type: "error", name: "NotOwner",          inputs: [] },
  { type: "error", name: "AlreadyJoined",     inputs: [] },
  { type: "error", name: "PlayerNotAlive",    inputs: [] },
  { type: "error", name: "AlreadyEliminated", inputs: [] },
  { type: "error", name: "GameOver",          inputs: [] },
] as const;
