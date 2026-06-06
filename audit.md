# Project Summary

Monad Royale is a hackathon MVP for an on-chain battle-royale game deployed on Monad Testnet. Players join via `joinGame()`, an owner wallet eliminates them one by one via `eliminatePlayer()`, and the last wallet standing wins. The project has two major parts: a Foundry/Solidity smart contract and a Next.js/React frontend. Both parts are individually functional in isolation — the contract compiles and its tests pass, and the frontend renders a polished UI — but **the two halves have zero integration with each other**. The frontend runs entirely on hardcoded mock data.

---

# Repository Structure

```
monad-royale/
├── package.json                  ← root workspace (viem, wagmi, lucide-react)
├── .gitignore
│
├── blockchain/
│   ├── foundry.toml              ← Foundry config, Monad Testnet RPC
│   ├── foundry.lock              ← forge-std v1.16.1 pinned
│   ├── .env.example              ← PRIVATE_KEY, RPC_URL, EXPLORER_URL
│   ├── .gitignore
│   ├── contracts/
│   │   └── MonadRoyale.sol       ← main contract (106 lines)
│   ├── script/
│   │   └── Deploy.s.sol          ← Foundry broadcast deploy script
│   └── test/
│       └── MonadRoyale.t.sol     ← 14 unit tests
│
└── frontend/
    ├── package.json              ← Next.js 16, React 19, wagmi, viem, TanStack Query
    ├── next.config.ts            ← empty config
    ├── tsconfig.json
    ├── postcss.config.mjs        ← Tailwind v4
    ├── eslint.config.mjs
    ├── app/
    │   ├── layout.tsx            ← root layout, no providers
    │   ├── page.tsx              ← entire app (~630 lines, all mock data)
    │   └── globals.css           ← custom keyframes + Tailwind import
    └── public/                   ← default Next.js SVG assets
```

**Notable absences:** No `lib/wagmi.ts` config, no `abi/` directory, no `.env.local.example`, no `components/` directory, no API routes, no contract address anywhere.

---

# Frontend Analysis

## What Is Implemented

| Area | Status |
|---|---|
| Dark cyber UI (grid-bg, scan-line, glows) | Complete |
| Round indicator with progress pips | Complete |
| Countdown timer with urgency state | Complete |
| Activity feed with type-coded events | Complete |
| Elimination animation (`elim-flash`) | Complete |
| Winner modal with trophy bounce | Complete |
| Winner inline banner (post-game) | Complete |
| Alive players table (rank, address, kills, HP, prize) | Complete (mock) |
| Eliminated players table | Complete (mock) |
| Stats bar (total / alive / eliminated) | Complete (mock) |
| Game info bar (round, prize pool, game ID, duration) | Complete (mock) |
| Mobile responsive layout | Complete |
| Simulate Elimination demo button | Complete (client-only) |
| WalletButton UI | Shell only |

## What Is Missing

**Wagmi/Viem integration is entirely absent.** Despite `wagmi@3.6.16`, `viem@2.52.2`, and `@tanstack/react-query@5.101` being in `package.json`, not a single import from any of these libraries appears anywhere in the source code. Specifically:

- **No `WagmiProvider` or `QueryClientProvider`** — `layout.tsx` wraps children with nothing but a bare `<body>`. Any wagmi hook called anywhere would throw immediately.
- **No wagmi config file** — No `createConfig()`, no chain definition, no connector setup (MetaMask, WalletConnect, etc.).
- **No contract ABI** — The Foundry `out/` directory is gitignored. No ABI JSON has been copied or imported into the frontend. There is no `abi/` folder.
- **No contract address** — No environment variable, no constant, no `.env.local.example` referencing a deployed address.
- **WalletButton is a fake toggle** — `setConnected(true/false)` flips local React state. It does not call `useConnect()`, `useAccount()`, or any wagmi hook. No real wallet connection occurs.
- **All game data is hardcoded constants** — `INITIAL_ALIVE`, `INITIAL_ELIMINATED`, and `INITIAL_FEED` are static TypeScript arrays defined at module scope. The UI never reads from the blockchain.
- **`simulateElimination()` is pure client state** — The function mutates React state only. It does not send a transaction. No `useWriteContract` call, no wagmi action, no RPC request.
- **No real-time event subscription** — No `useWatchContractEvent`, no polling of `getAlivePlayers()`, no `viem` `watchEvent`. The "Live" indicator and the pinging dot are cosmetic only.
- **No error handling for wallet/chain state** — No wrong-network detection, no transaction loading states, no rejection handling.

---

# Smart Contract Analysis

## What Is Implemented

The contract is clean, minimal, and correct for its current scope.

```
MonadRoyale.sol
├── State
│   ├── owner (immutable)         ← set in constructor, never changes
│   ├── winner (address)          ← set when 1 alive player remains
│   ├── alivePlayers (address[])
│   ├── eliminatedPlayers (address[])
│   └── mappings: hasJoined, isAlive, isEliminated
├── Events: PlayerJoined, PlayerEliminated, WinnerDeclared
├── Errors: NotOwner, AlreadyJoined, PlayerNotAlive, AlreadyEliminated, GameOver
├── joinGame()                    ← anyone can call, gameActive guarded
├── eliminatePlayer(address)      ← onlyOwner + gameActive
├── getAlivePlayers()             ← view
├── getEliminatedPlayers()        ← view
├── getWinner()                   ← view
└── _removeFromAlive()            ← swap-last O(n) internal
```

The test suite is thorough for the implemented surface: join events, join state updates, duplicate join reverts, game-over join block, elimination state, elimination revert paths, winner declaration, and view helper correctness.

## Critical Missing Features

**No ETH / Prize Pool** — This is the single largest architectural gap. The contract has no `payable` functions, no `receive()`, no ETH balance tracking, no prize distribution. The frontend displays "4.2 ETH" and "1.2 ETH" prizes but there is no on-chain mechanism backing any of them. A winner is declared but receives nothing.

**No Kill Tracking** — `eliminatePlayer(address player)` takes only the victim. There is no `eliminatedBy` parameter, no kills counter per address, and no mapping of who killed whom. The frontend shows per-player kill counts and "Eliminated By" columns, but the contract emits only `PlayerEliminated(player)` with no killer information.

**No Entry Fee / Free Join** — `joinGame()` is not `payable`. Any prize pool would have to be funded externally. For a hackathon "stake to play" model this is a blocker.

**No HP or Rounds On-Chain** — HP bars and round progression in the UI are purely cosmetic. The contract has no concept of rounds, zones, HP, or time-based game phases.

**No Game Phases / Lobby State** — The contract has no "waiting" state. Players can join at any time while the game is active, even after eliminations have started. There is no "game started" flag or minimum player requirement.

**No Game Reset** — Once `winner != address(0)`, the contract is permanently locked behind `GameOver`. There is no `reset()` or ability to run a second game on the same deployment. Each new game requires a new contract deployment.

**Winner Cannot Be Declared With Zero or One Player** — If only one player joins and no one is eliminated, `winner` remains `address(0)` indefinitely. The `alivePlayers.length == 1` check in `eliminatePlayer` only triggers when reducing from 2→1, not on initial single-join.

**O(n) Linear Scan in `_removeFromAlive`** — For a hackathon with ≤20 players this is fine, but at scale this becomes a gas problem.

**No `WinnerDeclared` Event Parameter for Prize** — The event only emits the winner address. A frontend listening to events cannot determine the prize amount from events alone.

---

# Deployment Readiness

| Checklist Item | Status |
|---|---|
| Contract compiles (`forge build`) | Assumed ready (code is clean) |
| Tests pass (`forge test`) | Assumed passing — 14 well-written tests |
| Deploy script exists | Yes (`script/Deploy.s.sol`) |
| `.env.example` with correct RPC | Yes (`https://testnet-rpc.monad.xyz`) |
| Contract deployed to Monad Testnet | **No** — no broadcast receipts, no address anywhere |
| Contract verified on explorer | **No** |
| ABI exported to frontend | **No** |
| Frontend `.env.local` with contract address | **No** |
| Frontend `next build` succeeds | Yes (verified clean build) |
| Wagmi configured for Monad chain | **No** |
| Frontend deployable (Vercel/etc.) | Technically yes, but displays only mock data |

---

# Integration Readiness

**Current integration level: 0%.**

The two halves of this project do not communicate. The complete list of work needed to wire them together:

1. Export ABI — run `forge build`, copy ABI into `frontend/lib/abi.ts`
2. Deploy contract — run deploy script against Monad Testnet, capture address
3. Create wagmi config — define Monad Testnet chain, HTTP transport, injected connector
4. Wrap the app with providers — `WagmiProvider` + `QueryClientProvider` in `layout.tsx`
5. Replace WalletButton — use `useConnect`, `useAccount`, `useDisconnect`
6. Read alive players — `useReadContract` → `getAlivePlayers()`
7. Read eliminated players — `useReadContract` → `getEliminatedPlayers()`
8. Read winner — `useReadContract` → `getWinner()`, show banner when non-zero
9. Subscribe to events — `useWatchContractEvent` for `PlayerEliminated` and `WinnerDeclared`
10. Real `joinGame` call — `useWriteContract` on button click
11. Real `eliminatePlayer` call — owner-gated write replacing the simulate button
12. Transaction states — loading, confirmation, error
13. Network guard — detect Monad Testnet, prompt to switch

---

# Critical Issues

**Issue 1 — No Prize Pool (Contract)**
Severity: Critical for MVP claim. The game advertises ETH prizes in the UI but the contract cannot hold or distribute ETH. Requires adding `payable` to `joinGame`, an `entryFee` constant, and a winner payout in `eliminatePlayer`. Reentrancy guard needed the moment ETH is involved.

**Issue 2 — No Blockchain-Frontend Bridge (Integration)**
Severity: Critical for demo. The entire frontend is mock data. "Simulate Elimination" does not touch the blockchain. "Connect Wallet" connects to nothing. The "Live" indicator is always on regardless of chain state.

**Issue 3 — No Kill Attribution (Contract)**
Severity: High. The contract does not record who killed whom. The frontend's "Eliminated By" column and per-player kill counts have no on-chain backing.

**Issue 4 — No Deployed Contract (Deployment)**
Severity: Critical for demo. No contract address exists in the repository. The frontend has no address to read from or write to.

**Issue 5 — No Wagmi Provider Setup (Frontend)**
Severity: Critical. Any attempt to use wagmi hooks will throw a context error at runtime because `WagmiProvider` is missing from the tree.

**Issue 6 — No Game Reset Mechanism (Contract)**
Severity: Medium for MVP, high for repeated demo use. After one complete game the contract is permanently locked. Every demo run requires redeploying.

**Issue 7 — Free Join with No Stake (Contract)**
Severity: Medium. For a "the last wallet standing wins everything" premise, `joinGame()` being free means there is nothing to win. The economic mechanic the UI implies does not exist.

---

# Recommended Next Steps

**P0 — Unblock the Demo (Must-Have)**

1. Add `payable` to `joinGame()`, set a fixed `ENTRY_FEE`, store ETH, pay winner on game end
2. Add `address killer` to `eliminatePlayer` and a `kills` mapping
3. Deploy to Monad Testnet: `forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast`
4. Create `frontend/lib/wagmi.ts` — Monad chain + injected connector
5. Add `WagmiProvider` + `QueryClientProvider` to `layout.tsx` via client wrapper
6. Create `frontend/lib/abi.ts` from compiled artifact
7. Add `NEXT_PUBLIC_CONTRACT_ADDRESS` to `frontend/.env.local`
8. Wire `useReadContract` for `getAlivePlayers()`, `getEliminatedPlayers()`, `getWinner()`
9. Make WalletButton use `useConnect` / `useAccount` / `useDisconnect`
10. Add `useWatchContractEvent` for `PlayerEliminated` and `WinnerDeclared`

**P1 — Polish for Demo Quality**

11. Add `joinGame` button with `useWriteContract` and entry fee attached
12. Replace "Simulate Elimination" with owner-only `eliminatePlayer` write
13. Add transaction pending states
14. Add wrong-network detection and switch prompt
15. Add game reset (deploy fresh contract per demo run)

**P2 — Nice to Have**

16. Kill leaderboard from on-chain data
17. `PlayerJoined` event listener in activity feed
18. Lobby/waiting room view
19. Real wallet address in connected state
20. Round tracking as an off-chain UI concept (it already is)

---

# MVP Completion Percentage

| Layer | Completion | Notes |
|---|---|---|
| Smart Contract logic | 55% | Join + eliminate + winner works. Missing: ETH, kill attribution, reset. |
| Smart Contract tests | 85% | Well-covered for existing surface. Missing: fee/ETH tests when added. |
| Deployment pipeline | 30% | Scripts exist, env configured, not yet executed. |
| Frontend UI | 90% | Polished, animated, responsive. Mock data only. |
| Wallet connection | 5% | UI shell exists, no actual wagmi wiring. |
| Blockchain reads | 0% | Zero `useReadContract` usage. |
| Blockchain writes | 0% | Zero `useWriteContract` usage. |
| Event subscriptions | 0% | Zero wagmi event hooks. |
| Frontend ↔ Contract integration | 0% | No ABI, no address, no providers. |

**Overall MVP completion: ~35%**

The project has a solid, demo-ready UI skin and a functionally correct (if minimal) smart contract. The critical missing layer is the connection between them — wagmi providers, contract reads/writes, event subscriptions, and a deployed contract address. Resolving the P0 items above is a focused 1–2 day effort, achievable before a hackathon demo.
