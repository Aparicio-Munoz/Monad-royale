"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAccount, useConnect, useDisconnect, useConnectors, useReadContract, useWriteContract, useWaitForTransactionReceipt, useChainId, useSwitchChain } from "wagmi";
import { monadTestnet } from "@/lib/wagmi";
import { CONTRACT_ABI } from "@/lib/abi";

// ── types ──────────────────────────────────────────────────────────────────────

type Player = {
  rank: number;
  address: string;
  kills: number;
  hp: number;
  prize: string;
};

type EliminatedPlayer = {
  rank: number;
  address: string;
  kills: number;
  eliminatedBy: string;
  survivalTime: string;
};

type Winner = {
  address: string;
  kills: number;
  prize: string;
};

type FeedEvent = {
  id: number;
  type: "elimination" | "round" | "game_start" | "game_end" | "join";
  message: string;
  timestamp: string;
};

// ── constants ──────────────────────────────────────────────────────────────────

const TOTAL_ROUNDS = 5;
const ROUND_DURATION = 45;

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as
  | `0x${string}`
  | undefined;

const INITIAL_ELIMINATED: EliminatedPlayer[] = [
  { rank: 7,  address: "0xY5z6...A7b8", kills: 3, eliminatedBy: "0xA1b2...C3d4", survivalTime: "14m 32s" },
  { rank: 8,  address: "0xC9d0...E1f2", kills: 2, eliminatedBy: "0xE5f6...G7h8", survivalTime: "11m 07s" },
  { rank: 9,  address: "0xG3h4...I5j6", kills: 1, eliminatedBy: "0xI9j0...K1l2", survivalTime: "09m 44s" },
  { rank: 10, address: "0xK7l8...M9n0", kills: 0, eliminatedBy: "0xM3n4...O5p6", survivalTime: "07m 18s" },
  { rank: 11, address: "0xO1p2...Q3r4", kills: 1, eliminatedBy: "0xA1b2...C3d4", survivalTime: "05m 52s" },
  { rank: 12, address: "0xS5t6...U7v8", kills: 0, eliminatedBy: "0xQ7r8...S9t0", survivalTime: "03m 29s" },
];

const INITIAL_FEED: FeedEvent[] = [
  { id: 10, type: "round",       message: "Round 4 — Final 6 remaining",                    timestamp: "2m ago"  },
  { id: 9,  type: "elimination", message: "0xY5z6...A7b8 eliminated by 0xA1b2...C3d4",      timestamp: "3m ago"  },
  { id: 8,  type: "elimination", message: "0xC9d0...E1f2 eliminated by 0xE5f6...G7h8",      timestamp: "7m ago"  },
  { id: 7,  type: "round",       message: "Round 3 started — critical zone",                 timestamp: "6m ago"  },
  { id: 6,  type: "elimination", message: "0xG3h4...I5j6 eliminated by 0xI9j0...K1l2",      timestamp: "8m ago"  },
  { id: 5,  type: "elimination", message: "0xK7l8...M9n0 eliminated by 0xM3n4...O5p6",      timestamp: "10m ago" },
  { id: 4,  type: "round",       message: "Round 2 started — zone tightening",               timestamp: "10m ago" },
  { id: 3,  type: "elimination", message: "0xO1p2...Q3r4 eliminated by 0xA1b2...C3d4",      timestamp: "12m ago" },
  { id: 2,  type: "elimination", message: "0xS5t6...U7v8 eliminated by 0xQ7r8...S9t0",      timestamp: "15m ago" },
  { id: 1,  type: "game_start",  message: "Game #MR-0042 started · 12 wallets entered",     timestamp: "18m ago" },
];

// ── helpers ────────────────────────────────────────────────────────────────────

function HpBar({ hp }: { hp: number }) {
  const color = hp > 60 ? "bg-emerald-500" : hp > 30 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${hp}%` }} />
      </div>
      <span className="text-xs tabular-nums text-slate-400">{hp}%</span>
    </div>
  );
}

function Stat({ label, value, color = "text-violet-300" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-slate-500">{label}:</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

// ── WalletButton ──────────────────────────────────────────────────────────────

function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const connectors = useConnectors();
  const chainId = useChainId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const injectedConnector = connectors.find((c) => c.type === "injected");
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : "";

  // Render the disconnected state on server and until client hydration is done.
  if (!mounted) {
    return (
      <button
        disabled
        className="pulse-glow rounded-lg border border-violet-500 bg-violet-600/20 px-5 py-2 text-sm font-semibold text-violet-200 opacity-0"
      >
        Connect Wallet
      </button>
    );
  }

  if (isConnected && address) {
    if (chainId !== monadTestnet.id) {
      return (
        <button
          onClick={() => switchChain({ chainId: monadTestnet.id })}
          className="flex items-center gap-2 rounded-lg border border-amber-500/60 bg-amber-950/30 px-4 py-2 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-900/40 hover:text-amber-100"
        >
          ⚠ Switch to Monad Testnet
        </button>
      );
    }
    return (
      <button
        onClick={() => disconnect()}
        className="group flex items-center gap-2 rounded-lg border border-violet-500/50 bg-violet-950/40 px-4 py-2 text-sm font-medium text-violet-300 transition-all hover:border-violet-400 hover:bg-violet-900/50 hover:text-violet-100"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <span className="font-mono">{displayAddress}</span>
        <span className="hidden text-xs text-violet-500 group-hover:inline">disconnect</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => injectedConnector && connect({ connector: injectedConnector, chainId: monadTestnet.id })}
      className="pulse-glow rounded-lg border border-violet-500 bg-violet-600/20 px-5 py-2 text-sm font-semibold text-violet-200 transition-all hover:bg-violet-600/40 hover:text-white"
    >
      Connect Wallet
    </button>
  );
}

// ── RoundIndicator ────────────────────────────────────────────────────────────

function RoundIndicator({ round, total }: { round: number; total: number }) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 px-5 py-3 text-center min-w-[110px]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Round</p>
      <p className="font-mono text-2xl font-black text-cyan-300 leading-none tabular-nums">
        {round}<span className="text-sm text-slate-500">/{total}</span>
      </p>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-1 w-5 rounded-full transition-all duration-500 ${i < round ? "bg-cyan-400" : "bg-white/10"}`}
          />
        ))}
      </div>
    </div>
  );
}

// ── CountdownTimer ────────────────────────────────────────────────────────────

function CountdownTimer({ seconds }: { seconds: number }) {
  const urgent = seconds <= 10;
  const pct = (seconds / ROUND_DURATION) * 100;

  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-xl border px-5 py-3 text-center min-w-[110px] transition-all duration-300 ${
      urgent
        ? "border-red-500/60 bg-red-950/20 shadow-[0_0_16px_rgba(239,68,68,0.2)]"
        : "border-violet-500/40 bg-violet-950/20"
    }`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Next Round</p>
      <p className={`font-mono text-2xl font-black tabular-nums leading-none ${
        urgent ? "text-red-400 animate-pulse" : "text-violet-300"
      }`}>
        {String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}
      </p>
      <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${urgent ? "bg-red-500" : "bg-violet-500"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── ActivityFeed ──────────────────────────────────────────────────────────────

const FEED_ICON: Record<FeedEvent["type"], string> = {
  elimination: "💀",
  round:       "🔔",
  game_start:  "🚀",
  game_end:    "🏆",
  join:        "👤",
};

const FEED_COLOR: Record<FeedEvent["type"], string> = {
  elimination: "text-red-400",
  round:       "text-cyan-400",
  game_start:  "text-emerald-400",
  game_end:    "text-yellow-400",
  join:        "text-violet-400",
};

function ActivityFeed({ events, latestId }: { events: FeedEvent[]; latestId: number }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [latestId]);

  return (
    <div className="rounded-xl border border-violet-700/30 bg-white/[0.02] overflow-hidden flex flex-col">
      <div className="flex items-center gap-2 border-b border-violet-700/30 bg-violet-950/20 px-4 py-3 shrink-0">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-500" />
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-widest text-violet-400">Activity Feed</h2>
        <span className="ml-auto rounded-full bg-violet-400/10 px-2 py-0.5 text-xs font-bold text-violet-400">Live</span>
      </div>
      <div ref={listRef} className="overflow-y-auto max-h-80 lg:max-h-[460px] divide-y divide-white/[0.04]">
        {events.map((ev, i) => (
          <div
            key={ev.id}
            className={`flex gap-2.5 items-start px-3 py-2.5 hover:bg-white/[0.02] transition-colors ${
              i === 0 && ev.id === latestId ? "feed-item-new" : ""
            }`}
          >
            <span className="text-base mt-0.5 shrink-0">{FEED_ICON[ev.type]}</span>
            <div className="min-w-0 flex-1">
              <p className={`text-xs leading-snug font-mono ${FEED_COLOR[ev.type]}`}>{ev.message}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{ev.timestamp}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── WinnerModal ───────────────────────────────────────────────────────────────

function WinnerModal({ winner, onClose }: { winner: Winner; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="modal-backdrop absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="winner-modal-card relative w-full max-w-md rounded-2xl border border-yellow-400/50 bg-gradient-to-br from-yellow-950/95 via-[#07070f] to-yellow-950/95 p-8 shadow-[0_0_80px_rgba(250,204,21,0.25)] z-10">
        {/* corner accents */}
        <span className="absolute left-0 top-0 h-8 w-8 border-l-2 border-t-2 border-yellow-400/70 rounded-tl-2xl" />
        <span className="absolute right-0 top-0 h-8 w-8 border-r-2 border-t-2 border-yellow-400/70 rounded-tr-2xl" />
        <span className="absolute bottom-0 left-0 h-8 w-8 border-b-2 border-l-2 border-yellow-400/70 rounded-bl-2xl" />
        <span className="absolute bottom-0 right-0 h-8 w-8 border-b-2 border-r-2 border-yellow-400/70 rounded-br-2xl" />

        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-600 hover:text-slate-400 transition-colors text-lg leading-none"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="text-5xl mb-4 trophy-bounce inline-block">🏆</div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-yellow-400/70 mb-1">
            Last One Standing
          </p>
          <h2 className="font-mono text-xl font-black text-yellow-300 sm:text-2xl mb-1 break-all">
            {winner.address}
          </h2>
          <p className="text-xs text-slate-500 mb-6">Winner of Game #MR-0042</p>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="rounded-lg border border-red-700/30 bg-red-950/20 px-4 py-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Kills</p>
              <p className="text-3xl font-black text-red-400">{winner.kills}</p>
            </div>
            <div className="rounded-lg border border-yellow-600/30 bg-yellow-950/20 px-4 py-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Prize</p>
              <p className="text-3xl font-black text-yellow-300">{winner.prize}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full rounded-lg border border-yellow-400/40 bg-yellow-400/10 px-6 py-2.5 text-sm font-semibold text-yellow-300 transition-all hover:bg-yellow-400/20 hover:text-yellow-100"
          >
            View Leaderboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ── WinnerBanner ──────────────────────────────────────────────────────────────

function WinnerBanner({ winner, onShowModal }: { winner: Winner; onShowModal: () => void }) {
  return (
    <div className="winner-glow relative overflow-hidden rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-yellow-950/60 via-amber-900/30 to-yellow-950/60 p-6">
      <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-yellow-400/70 rounded-tl-2xl" />
      <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-yellow-400/70 rounded-tr-2xl" />
      <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-yellow-400/70 rounded-bl-2xl" />
      <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-yellow-400/70 rounded-br-2xl" />

      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-yellow-400/60 bg-yellow-400/10 text-3xl shadow-[0_0_24px_rgba(250,204,21,0.3)]">
          🏆
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70">Last One Standing</p>
          <p className="mt-1 font-mono text-lg font-bold text-yellow-300 sm:text-xl">{winner.address}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-4 sm:justify-start">
            <Stat label="Kills" value={String(winner.kills)} color="text-red-400" />
            <Stat label="Prize" value={winner.prize} color="text-yellow-300" />
          </div>
        </div>
        <button
          onClick={onShowModal}
          className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 px-5 py-3 text-center hover:bg-yellow-400/10 transition-all"
        >
          <p className="text-xs uppercase tracking-widest text-yellow-500/70">Total Prize</p>
          <p className="text-2xl font-black text-yellow-300">{winner.prize}</p>
        </button>
      </div>
    </div>
  );
}

// ── StatsBar ──────────────────────────────────────────────────────────────────

function StatsBar({ total, alive, eliminated }: { total: number; alive: number; eliminated: number }) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {[
        { label: "Total Players", value: total,      accent: "text-slate-300",  border: "border-slate-700/60",    glow: "" },
        { label: "Alive",         value: alive,      accent: "text-emerald-400", border: "border-emerald-700/40", glow: "shadow-[0_0_12px_rgba(52,211,153,0.1)]"  },
        { label: "Eliminated",    value: eliminated, accent: "text-red-400",    border: "border-red-700/40",      glow: "shadow-[0_0_12px_rgba(248,113,113,0.1)]" },
      ].map(({ label, value, accent, border, glow }) => (
        <div key={label} className={`rounded-xl border ${border} bg-white/[0.03] p-3 sm:p-4 text-center ${glow}`}>
          <p className={`text-2xl font-black sm:text-3xl ${accent}`}>{value}</p>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-slate-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

// ── AliveTable ────────────────────────────────────────────────────────────────

function AliveTable({ players }: { players: Player[] }) {
  return (
    <div className="rounded-xl border border-emerald-700/30 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-emerald-700/30 bg-emerald-950/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-400">Alive Players</h2>
        <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-400">{players.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-slate-600">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Kills</th>
              <th className="px-4 py-2">HP</th>
              <th className="hidden px-4 py-2 sm:table-cell">Prize</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.rank} className="border-b border-white/[0.04] transition-colors hover:bg-emerald-900/10">
                <td className="px-4 py-3 font-mono text-xs text-slate-500">{String(p.rank).padStart(2, "0")}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">{p.address}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-red-900/30 px-1.5 py-0.5 text-xs font-semibold text-red-400">{p.kills}</span>
                </td>
                <td className="px-4 py-3"><HpBar hp={p.hp} /></td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="text-xs font-semibold text-violet-300">{p.prize}</span>
                </td>
              </tr>
            ))}
            {players.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-slate-600">No players remaining</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── EliminatedTable ───────────────────────────────────────────────────────────

function EliminatedTable({ players, flashIds }: { players: EliminatedPlayer[]; flashIds: Set<number> }) {
  return (
    <div className="rounded-xl border border-red-900/30 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-red-900/30 bg-red-950/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-400">Eliminated</h2>
        <span className="ml-auto rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-bold text-red-400">{players.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs uppercase tracking-widest text-slate-600">
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Address</th>
              <th className="px-4 py-2">Kills</th>
              <th className="hidden px-4 py-2 sm:table-cell">Eliminated By</th>
              <th className="hidden px-4 py-2 md:table-cell">Survived</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr
                key={p.rank}
                className={`border-b border-white/[0.04] transition-all hover:bg-red-900/10 ${
                  flashIds.has(p.rank) ? "elim-flash" : "opacity-70 hover:opacity-100"
                }`}
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{String(p.rank).padStart(2, "0")}</td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 line-through decoration-red-700/50">{p.address}</td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-800/60 px-1.5 py-0.5 text-xs font-semibold text-slate-500">{p.kills}</span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell font-mono text-xs text-slate-600">{p.eliminatedBy}</td>
                <td className="hidden px-4 py-3 md:table-cell text-xs text-slate-600">{p.survivalTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── JoinButton ────────────────────────────────────────────────────────────────

function JoinButton({ onJoined }: { onJoined: () => void }) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();

  const { data: alreadyJoined } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "hasJoined",
    args: [address as `0x${string}`],
    query: { enabled: !!CONTRACT_ADDRESS && !!address },
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  useEffect(() => {
    if (isSuccess) onJoined();
  }, [isSuccess, onJoined]);

  if (!isConnected || !CONTRACT_ADDRESS) return null;

  if (alreadyJoined) {
    return (
      <span className="flex items-center gap-1.5 rounded-full border border-emerald-700/40 bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_#34d399]" />
        In Game
      </span>
    );
  }

  const onWrongChain = chainId !== monadTestnet.id;
  const busy = isPending || isConfirming;
  const label = isPending ? "Confirm in wallet…" : isConfirming ? "Joining…" : "Join Game";

  return (
    <button
      onClick={() => {
        if (onWrongChain) {
          switchChain({ chainId: monadTestnet.id });
          return;
        }
        writeContract({
          address: CONTRACT_ADDRESS!,
          abi: CONTRACT_ABI,
          functionName: "joinGame",
          chainId: monadTestnet.id,
        });
      }}
      disabled={busy}
      className="rounded-lg border border-emerald-500/50 bg-emerald-950/30 px-4 py-2 text-sm font-semibold text-emerald-300 transition-all hover:bg-emerald-900/40 hover:border-emerald-400/60 hover:text-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {onWrongChain ? "Switch to Monad" : label}
    </button>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const { data: aliveAddresses, refetch: refetchAlive } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: "getAlivePlayers",
    query: {
      enabled: !!CONTRACT_ADDRESS,
      refetchInterval: 3000,
    },
  });

  const [alive, setAlive] = useState<Player[]>([]);
  const [eliminated, setEliminated] = useState<EliminatedPlayer[]>(INITIAL_ELIMINATED);

  useEffect(() => {
    if (!aliveAddresses) return;
    setAlive(
      aliveAddresses.map((addr, i) => ({
        rank: i + 1,
        address: addr,
        kills: 0,
        hp: 100,
        prize: "—",
      }))
    );
  }, [aliveAddresses]);
  const [round, setRound] = useState(4);
  const [countdown, setCountdown] = useState(ROUND_DURATION);
  const [feed, setFeed] = useState<FeedEvent[]>(INITIAL_FEED);
  const [flashIds, setFlashIds] = useState<Set<number>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState<Winner | null>(null);

  const feedIdRef = useRef(INITIAL_FEED.length + 1);
  const roundRef = useRef(4);
  const countdownRef = useRef(ROUND_DURATION);
  const latestFeedId = feed[0]?.id ?? 0;

  const pushFeedEvent = useCallback((type: FeedEvent["type"], message: string) => {
    const id = feedIdRef.current++;
    setFeed((prev) => [{ id, type, message, timestamp: "just now" }, ...prev].slice(0, 25));
  }, []);

  const handleJoined = useCallback(() => {
    void refetchAlive();
    pushFeedEvent("join", "A new wallet joined the game");
  }, [refetchAlive, pushFeedEvent]);

  // live countdown
  useEffect(() => {
    if (gameOver) return;
    const t = setInterval(() => {
      countdownRef.current -= 1;
      if (countdownRef.current <= 0) {
        const next = roundRef.current + 1;
        if (next <= TOTAL_ROUNDS) {
          roundRef.current = next;
          setRound(next);
          pushFeedEvent("round", `Round ${next} started — zone closing in`);
        }
        countdownRef.current = ROUND_DURATION;
      }
      setCountdown(countdownRef.current);
    }, 1000);
    return () => clearInterval(t);
  }, [gameOver, pushFeedEvent]);

  function simulateElimination() {
    setAlive((prevAlive) => {
      if (prevAlive.length <= 1) return prevAlive;

      const victimIdx = prevAlive.length - 1;
      const victim = prevAlive[victimIdx];
      const killerIdx = Math.floor(Math.random() * victimIdx);
      const killer = prevAlive[killerIdx];

      const newElim: EliminatedPlayer = {
        rank: victim.rank,
        address: victim.address,
        kills: victim.kills,
        eliminatedBy: killer.address,
        survivalTime: `${Math.floor(Math.random() * 18 + 1)}m ${Math.floor(Math.random() * 59)}s`,
      };

      const nextAlive = prevAlive
        .filter((p) => p.rank !== victim.rank)
        .map((p) => p.rank === killer.rank ? { ...p, kills: p.kills + 1 } : p);

      setEliminated((prev) => [newElim, ...prev]);
      setFlashIds(new Set([victim.rank]));
      setTimeout(() => setFlashIds(new Set()), 2500);

      pushFeedEvent("elimination", `${victim.address} eliminated by ${killer.address}`);

      if (nextAlive.length === 1) {
        const w: Winner = { address: nextAlive[0].address, kills: nextAlive[0].kills, prize: nextAlive[0].prize };
        setTimeout(() => {
          pushFeedEvent("game_end", `Game Over — ${w.address} wins ${w.prize}!`);
          setWinner(w);
          setGameOver(true);
          setShowModal(true);
        }, 600);
      }

      return nextAlive;
    });
  }

  const total = alive.length + eliminated.length;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* background */}
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-100" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]" />
      <div className="scan-line pointer-events-none fixed left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />

      {/* winner modal */}
      {showModal && winner && (
        <WinnerModal winner={winner} onClose={() => setShowModal(false)} />
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── header ── */}
        <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-600/20 text-xl">⚔️</div>
              <h1 className="title-flicker font-mono text-2xl font-black tracking-tight text-white sm:text-3xl">
                MONAD{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">ROYALE</span>
              </h1>
            </div>
            <p className="mt-1 pl-12 text-xs text-slate-500 tracking-widest uppercase">The last wallet standing wins everything</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-full border border-emerald-700/40 bg-emerald-950/30 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Live</span>
            </div>
            <WalletButton />
            <JoinButton onJoined={handleJoined} />
          </div>
        </header>

        {/* ── winner banner (post-game) ── */}
        {gameOver && winner && (
          <section className="mb-6">
            <WinnerBanner winner={winner} onShowModal={() => setShowModal(true)} />
          </section>
        )}

        {/* ── round + timer strip ── */}
        <div className="mb-6 flex flex-col gap-4 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <RoundIndicator round={round} total={TOTAL_ROUNDS} />
            {!gameOver && <CountdownTimer seconds={countdown} />}
            {gameOver && (
              <div className="flex flex-col items-center gap-1 rounded-xl border border-yellow-500/40 bg-yellow-950/20 px-5 py-3 text-center min-w-[110px]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="font-mono text-lg font-black text-yellow-400 leading-none">FINAL</p>
                <p className="text-[10px] text-yellow-500/60 uppercase tracking-wider">Game Over</p>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!gameOver ? (
              <button
                onClick={simulateElimination}
                disabled={alive.length <= 1}
                className="rounded-lg border border-red-500/40 bg-red-950/20 px-4 py-2 text-xs font-semibold text-red-400 transition-all hover:bg-red-950/40 hover:border-red-400/60 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ⚡ Simulate Elimination
              </button>
            ) : (
              <button
                onClick={() => setShowModal(true)}
                className="pulse-glow rounded-lg border border-yellow-400/40 bg-yellow-950/20 px-4 py-2 text-xs font-semibold text-yellow-400 transition-all hover:bg-yellow-950/40"
              >
                🏆 View Winner
              </button>
            )}
          </div>
        </div>

        {/* ── stats ── */}
        <section className="mb-6">
          <StatsBar total={total} alive={alive.length} eliminated={eliminated.length} />
        </section>

        {/* ── game info bar ── */}
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-xs sm:gap-4">
          <Stat label="Round"            value={gameOver ? "Final" : `${round}/${TOTAL_ROUNDS}`} color="text-violet-300" />
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <Stat label="Total Prize Pool" value="4.2 ETH"   color="text-yellow-300" />
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <Stat label="Game ID"          value="#MR-0042"  color="text-cyan-400"   />
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <Stat label="Duration"         value="18m 45s"   color="text-slate-300"  />
        </div>

        {/* ── main grid: tables + feed ── */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AliveTable players={alive} />
          <EliminatedTable players={eliminated} flashIds={flashIds} />
          <div className="md:col-span-2 lg:col-span-1">
            <ActivityFeed events={feed} latestId={latestFeedId} />
          </div>
        </div>

        {/* ── footer ── */}
        <footer className="mt-10 flex flex-col items-center gap-1 text-center">
          <p className="font-mono text-xs text-slate-600 tracking-widest uppercase">Monad Royale · On-chain Battle Royale</p>
          <p className="text-xs text-slate-700">Powered by Monad Network</p>
        </footer>
      </div>
    </div>
  );
}
