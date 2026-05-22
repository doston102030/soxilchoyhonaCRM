"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, TrendingUp, Users, Clock } from "lucide-react";
import { formatSom } from "@/lib/utils";

type TableWithOrders = {
  id: number; name: string; zone: string; sortOrder: number;
  orders: { id: number; total: number; items: any[] }[];
};

const ZONE_ICONS: Record<string, string> = {
  "Kapa": "⛺", "Sori": "🛋", "O'rta sori": "🪑",
  "Past stol": "🍃", "Katta xona tepa": "🏛", "Katta xona stol": "🍽",
};

export default function HomePage() {
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState<Date | null>(null);

  async function load() {
    try { const res = await fetch("/api/tables", { cache: "no-store" }); setTables(await res.json()); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    load(); setTime(new Date());
    const d = setInterval(load, 15000);
    const c = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(d); clearInterval(c); };
  }, []);

  const zones: Record<string, TableWithOrders[]> = {};
  for (const t of tables) { if (!zones[t.zone]) zones[t.zone] = []; zones[t.zone].push(t); }
  const zoneOrder = ["Kapa", "Sori", "O'rta sori", "Past stol", "Katta xona tepa", "Katta xona stol"];
  const sortedZones = Object.keys(zones).sort((a, b) => zoneOrder.indexOf(a) - zoneOrder.indexOf(b));

  const occupied = tables.filter(t => t.orders.length > 0).length;
  const revenue = tables.reduce((s, t) => s + t.orders.reduce((os, o) => os + o.total, 0), 0);
  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <main className="min-h-screen">

      {/* HEADER */}
      <header className="sticky top-0 z-50 glass no-print">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-900/50">
              <span className="text-xl">☕</span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-black leading-none">
                <span className="gradient-text">Sohil</span>
                <span className="text-white"> Choyxona</span>
              </h1>
              <p className="text-xs text-white/40 font-medium">Hisob-kitob tizimi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {time && (
              <div className="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                <Clock className="w-3.5 h-3.5 text-green-400" />
                <span className="font-mono font-bold text-sm tabular-nums text-white">
                  {pad(time.getHours())}:{pad(time.getMinutes())}
                  <span className="text-white/40 text-xs">:{pad(time.getSeconds())}</span>
                </span>
              </div>
            )}
            <Link href="/admin">
              <button className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 text-black px-5 py-2.5 rounded-2xl font-black text-sm shadow-lg shadow-green-900/50 hover:opacity-90 hover:scale-[1.02] transition-all">
                <Settings className="w-4 h-4" />
                Admin
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="max-w-7xl mx-auto px-5 pb-3 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-green-400" />
              <span className="text-xs font-semibold text-green-300">
                <span className="font-black text-green-400">{occupied}</span> / {tables.length} band
              </span>
            </div>
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
              <span className="text-xs font-semibold text-orange-300">
                <span className="font-black text-orange-400">{formatSom(revenue)}</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/30 font-medium">Jonli</span>
            </div>
          </div>
        )}
      </header>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-2xl shadow-green-900/60 animate-pulse">
              <span className="text-2xl">☕</span>
            </div>
            <p className="text-white/40 font-semibold text-sm">Yuklanmoqda...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedZones.map((zone) => {
              const zoneTables = zones[zone];
              const zoneOccupied = zoneTables.filter(t => t.orders.length > 0).length;

              return (
                <section key={zone}>
                  {/* Zone header */}
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-xl">{ZONE_ICONS[zone] ?? "🪑"}</span>
                    <h2 className="font-display font-black text-white text-lg">{zone}</h2>
                    {zoneOccupied > 0 && (
                      <span className="bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold px-2.5 py-1 rounded-xl">
                        {zoneOccupied} band
                      </span>
                    )}
                    <div className="flex-1 h-px bg-gradient-to-r from-white/10 to-transparent" />
                    <span className="text-xs text-white/25 font-medium">{zoneTables.length} joy</span>
                  </div>

                  {/* Tables */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {zoneTables.map((table) => {
                      const isOccupied = table.orders.length > 0;
                      const totalSum = table.orders.reduce((s, o) => s + o.total, 0);
                      const itemCount = table.orders.reduce((s, o) => s + o.items.length, 0);

                      return (
                        <Link key={table.id} href={`/order/${table.id}`}>
                          <div className={`
                            relative group rounded-2xl p-4 cursor-pointer card-glow
                            transition-all duration-200 hover:-translate-y-1 active:scale-95
                            ${isOccupied
                              ? "bg-gradient-to-br from-orange-500/15 to-amber-500/10 border border-orange-500/30"
                              : "bg-white/4 border border-white/8 hover:border-green-500/30 hover:bg-green-500/5"
                            }
                          `}>
                            {isOccupied && (
                              <span className="absolute -top-1.5 -right-1.5 flex">
                                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-[#080d1a]" />
                                <span className="absolute w-3.5 h-3.5 rounded-full bg-orange-400 animate-ping opacity-60" />
                              </span>
                            )}

                            <div className={`font-display font-bold text-sm mb-3 ${isOccupied ? "text-orange-200" : "text-white/50 group-hover:text-white/80 transition-colors"}`}>
                              {table.name}
                            </div>

                            {isOccupied ? (
                              <div>
                                <div className="font-black text-orange-400 text-sm">{formatSom(totalSum)}</div>
                                <div className="text-[10px] text-orange-400/60 font-semibold mt-0.5">{itemCount} mahsulot</div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-white/20 font-semibold">Bo'sh</div>
                            )}

                            <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs font-black
                              ${isOccupied ? "bg-orange-500/20 text-orange-400" : "bg-green-500/15 text-green-400"}`}>
                              →
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <footer className="border-t border-white/5 mt-16 py-4">
        <div className="max-w-7xl mx-auto px-5 flex justify-between text-xs text-white/20">
          <span className="font-display font-black">Sohil Choyxona</span>
          <span className="font-mono">POS v2.0</span>
        </div>
      </footer>
    </main>
  );
}
