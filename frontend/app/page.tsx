"use client";

import { useState } from "react";

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

// ── mock data ──────────────────────────────────────────────────────────────────

const ALIVE_PLAYERS: Player[] = [
  { rank: 1, address: "0xA1b2...C3d4", kills: 7, hp: 94, prize: "1.2 ETH" },
  { rank: 2, address: "0xE5f6...G7h8", kills: 5, hp: 78, prize: "0.8 ETH" },
  { rank: 3, address: "0xI9j0...K1l2", kills: 4, hp: 61, prize: "0.5 ETH" },
  { rank: 4, address: "0xM3n4...O5p6", kills: 3, hp: 45, prize: "0.3 ETH" },
  { rank: 5, address: "0xQ7r8...S9t0", kills: 2, hp: 33, prize: "0.2 ETH" },
  { rank: 6, address: "0xU1v2...W3x4", kills: 1, hp: 21, prize: "0.1 ETH" },
];

const ELIMINATED_PLAYERS: EliminatedPlayer[] = [
  { rank: 7,  address: "0xY5z6...A7b8", kills: 3, eliminatedBy: "0xA1b2...C3d4", survivalTime: "14m 32s" },
  { rank: 8,  address: "0xC9d0...E1f2", kills: 2, eliminatedBy: "0xE5f6...G7h8", survivalTime: "11m 07s" },
  { rank: 9,  address: "0xG3h4...I5j6", kills: 1, eliminatedBy: "0xI9j0...K1l2", survivalTime: "09m 44s" },
  { rank: 10, address: "0xK7l8...M9n0", kills: 0, eliminatedBy: "0xM3n4...O5p6", survivalTime: "07m 18s" },
  { rank: 11, address: "0xO1p2...Q3r4", kills: 1, eliminatedBy: "0xA1b2...C3d4", survivalTime: "05m 52s" },
  { rank: 12, address: "0xS5t6...U7v8", kills: 0, eliminatedBy: "0xQ7r8...S9t0", survivalTime: "03m 29s" },
];

const WINNER: Winner = {
  address: "0xDEAD...BEEF",
  kills: 12,
  prize: "4.2 ETH",
};

// ── helpers ────────────────────────────────────────────────────────────────────

function truncate(addr: string) {
  return addr;
}

function HpBar({ hp }: { hp: number }) {
  const color =
    hp > 60 ? "bg-emerald-500" : hp > 30 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${hp}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-400">{hp}%</span>
    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────────

function WalletButton() {
  const [connected, setConnected] = useState(false);
  const [address] = useState("0xBEEF...1337");

  return connected ? (
    <button
      onClick={() => setConnected(false)}
      className="group flex items-center gap-2 rounded-lg border border-violet-500/50 bg-violet-950/40 px-4 py-2 text-sm font-medium text-violet-300 transition-all hover:border-violet-400 hover:bg-violet-900/50 hover:text-violet-100"
    >
      <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
      <span className="font-mono">{address}</span>
      <span className="hidden text-xs text-violet-500 group-hover:inline">
        disconnect
      </span>
    </button>
  ) : (
    <button
      onClick={() => setConnected(true)}
      className="pulse-glow rounded-lg border border-violet-500 bg-violet-600/20 px-5 py-2 text-sm font-semibold text-violet-200 transition-all hover:bg-violet-600/40 hover:text-white"
    >
      Connect Wallet
    </button>
  );
}

function WinnerSection({ winner }: { winner: Winner }) {
  return (
    <div className="winner-glow relative overflow-hidden rounded-2xl border border-yellow-400/40 bg-gradient-to-br from-yellow-950/60 via-amber-900/30 to-yellow-950/60 p-6">
      {/* corner accents */}
      <span className="absolute left-0 top-0 h-6 w-6 border-l-2 border-t-2 border-yellow-400/70 rounded-tl-2xl" />
      <span className="absolute right-0 top-0 h-6 w-6 border-r-2 border-t-2 border-yellow-400/70 rounded-tr-2xl" />
      <span className="absolute bottom-0 left-0 h-6 w-6 border-b-2 border-l-2 border-yellow-400/70 rounded-bl-2xl" />
      <span className="absolute bottom-0 right-0 h-6 w-6 border-b-2 border-r-2 border-yellow-400/70 rounded-br-2xl" />

      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-yellow-400/60 bg-yellow-400/10 text-3xl shadow-[0_0_24px_rgba(250,204,21,0.3)]">
          🏆
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-400/70">
            Last One Standing
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-yellow-300 sm:text-xl">
            {winner.address}
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-4 sm:justify-start">
            <Stat label="Kills" value={String(winner.kills)} color="text-red-400" />
            <Stat label="Prize" value={winner.prize} color="text-yellow-300" />
          </div>
        </div>
        <div className="rounded-lg border border-yellow-400/30 bg-yellow-400/5 px-5 py-3 text-center">
          <p className="text-xs uppercase tracking-widest text-yellow-500/70">
            Total Prize
          </p>
          <p className="text-2xl font-black text-yellow-300">{winner.prize}</p>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-violet-300",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="text-slate-500">{label}:</span>
      <span className={`font-semibold ${color}`}>{value}</span>
    </div>
  );
}

function StatsBar({
  total,
  alive,
  eliminated,
}: {
  total: number;
  alive: number;
  eliminated: number;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {[
        { label: "Total Players", value: total, accent: "text-slate-300", border: "border-slate-700/60", glow: "" },
        { label: "Alive", value: alive, accent: "text-emerald-400", border: "border-emerald-700/40", glow: "shadow-[0_0_12px_rgba(52,211,153,0.1)]" },
        { label: "Eliminated", value: eliminated, accent: "text-red-400", border: "border-red-700/40", glow: "shadow-[0_0_12px_rgba(248,113,113,0.1)]" },
      ].map(({ label, value, accent, border, glow }) => (
        <div
          key={label}
          className={`rounded-xl border ${border} bg-white/[0.03] p-4 text-center ${glow}`}
        >
          <p className={`text-2xl font-black sm:text-3xl ${accent}`}>{value}</p>
          <p className="mt-0.5 text-xs uppercase tracking-widest text-slate-500">
            {label}
          </p>
        </div>
      ))}
    </div>
  );
}

function AliveTable({ players }: { players: Player[] }) {
  return (
    <div className="rounded-xl border border-emerald-700/30 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-emerald-700/30 bg-emerald-950/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
          Alive Players
        </h2>
        <span className="ml-auto rounded-full bg-emerald-400/10 px-2 py-0.5 text-xs font-bold text-emerald-400">
          {players.length}
        </span>
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
              <tr
                key={p.rank}
                className="border-b border-white/[0.04] transition-colors hover:bg-emerald-900/10"
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-500">
                  {String(p.rank).padStart(2, "0")}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-300">
                  {truncate(p.address)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-red-900/30 px-1.5 py-0.5 text-xs font-semibold text-red-400">
                    {p.kills}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <HpBar hp={p.hp} />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <span className="text-xs font-semibold text-violet-300">
                    {p.prize}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EliminatedTable({ players }: { players: EliminatedPlayer[] }) {
  return (
    <div className="rounded-xl border border-red-900/30 bg-white/[0.02] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-red-900/30 bg-red-950/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <h2 className="text-sm font-semibold uppercase tracking-widest text-red-400">
          Eliminated
        </h2>
        <span className="ml-auto rounded-full bg-red-400/10 px-2 py-0.5 text-xs font-bold text-red-400">
          {players.length}
        </span>
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
                className="border-b border-white/[0.04] opacity-70 transition-all hover:opacity-100 hover:bg-red-900/10"
              >
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {String(p.rank).padStart(2, "0")}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500 line-through decoration-red-700/50">
                  {truncate(p.address)}
                </td>
                <td className="px-4 py-3">
                  <span className="rounded bg-slate-800/60 px-1.5 py-0.5 text-xs font-semibold text-slate-500">
                    {p.kills}
                  </span>
                </td>
                <td className="hidden px-4 py-3 sm:table-cell font-mono text-xs text-slate-600">
                  {p.eliminatedBy}
                </td>
                <td className="hidden px-4 py-3 md:table-cell text-xs text-slate-600">
                  {p.survivalTime}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── page ───────────────────────────────────────────────────────────────────────

export default function Home() {
  const total = ALIVE_PLAYERS.length + ELIMINATED_PLAYERS.length;

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* animated grid background */}
      <div className="grid-bg pointer-events-none fixed inset-0 opacity-100" />

      {/* radial vignette */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]" />

      {/* scan line */}
      <div className="scan-line pointer-events-none fixed left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* ── header ── */}
        <header className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-600/20 text-xl">
                ⚔️
              </div>
              <h1 className="title-flicker font-mono text-2xl font-black tracking-tight text-white sm:text-3xl">
                MONAD{" "}
                <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                  ROYALE
                </span>
              </h1>
            </div>
            <p className="mt-1 pl-12 text-xs text-slate-500 tracking-widest uppercase">
              The last wallet standing wins everything
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* live indicator */}
            <div className="flex items-center gap-2 rounded-full border border-emerald-700/40 bg-emerald-950/30 px-3 py-1.5">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Live
              </span>
            </div>
            <WalletButton />
          </div>
        </header>

        {/* ── winner section ── */}
        <section className="mb-6">
          <WinnerSection winner={WINNER} />
        </section>

        {/* ── stats ── */}
        <section className="mb-6">
          <StatsBar
            total={total}
            alive={ALIVE_PLAYERS.length}
            eliminated={ELIMINATED_PLAYERS.length}
          />
        </section>

        {/* ── game info bar ── */}
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-white/5 bg-white/[0.02] px-4 py-3 text-xs">
          <Stat label="Round" value="Final" color="text-violet-300" />
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <Stat label="Total Prize Pool" value="4.2 ETH" color="text-yellow-300" />
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <Stat label="Game ID" value="#MR-0042" color="text-cyan-400" />
          <span className="hidden h-3 w-px bg-white/10 sm:block" />
          <Stat label="Duration" value="18m 45s" color="text-slate-300" />
        </div>

        {/* ── tables ── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <AliveTable players={ALIVE_PLAYERS} />
          <EliminatedTable players={ELIMINATED_PLAYERS} />
        </div>

        {/* ── footer ── */}
        <footer className="mt-10 flex flex-col items-center gap-1 text-center">
          <p className="font-mono text-xs text-slate-600 tracking-widest uppercase">
            Monad Royale · On-chain Battle Royale
          </p>
          <p className="text-xs text-slate-700">
            Powered by Monad Network
          </p>
        </footer>
      </div>
    </div>
  );
}
