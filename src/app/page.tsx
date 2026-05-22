"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, TrendingUp, Users } from "lucide-react";
import { formatSom } from "@/lib/utils";

type TableWithOrders = {
  id: number; name: string; zone: string; sortOrder: number;
  orders: { id: number; total: number; items: any[] }[];
};

const ZONE_COLORS: Record<string, string> = {
  "Kapa":             "from-emerald-500 to-teal-600",
  "Sori":             "from-blue-500 to-indigo-600",
  "O'rta sori":       "from-violet-500 to-purple-600",
  "Past stol":        "from-amber-500 to-orange-600",
  "Katta xona tepa":  "from-rose-500 to-pink-600",
  "Katta xona stol":  "from-cyan-500 to-sky-600",
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
    const d = setInterval(load, 10000);
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

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 glass border-b border-white/60 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-xl">☕</span>
            </div>
            <div>
              <h1 className="font-display text-2xl font-black leading-none">
                <span className="gradient-text">Sohil</span>
                <span className="text-foreground"> Choyxona</span>
              </h1>
              <p className="text-xs text-muted-foreground font-medium">Hisob-kitob tizimi</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Soat */}
            {time && (
              <div className="hidden sm:flex items-center gap-2 bg-white/70 border border-border/60 rounded-2xl px-4 py-2 shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono font-bold text-sm tabular-nums text-foreground">
                  {pad(time.getHours())}:{pad(time.getMinutes())}
                  <span className="text-muted-foreground text-xs">:{pad(time.getSeconds())}</span>
                </span>
              </div>
            )}
            <Link href="/admin">
              <button className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-2xl font-bold text-sm shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all">
                <Settings className="w-4 h-4" />
                Admin
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="max-w-7xl mx-auto px-5 pb-3 flex items-center gap-6">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-semibold text-emerald-700">
                <span className="font-black">{occupied}</span> / {tables.length} band
              </span>
            </div>
            <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
              <span className="text-xs font-semibold text-orange-700">
                <span className="font-black">{formatSom(revenue)}</span> ochiq
              </span>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-muted-foreground font-medium">Jonli</span>
            </div>
          </div>
        )}
      </header>

      {/* ═══ BODY ═══ */}
      <div className="max-w-7xl mx-auto px-5 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-bounce">
              <span className="text-2xl">☕</span>
            </div>
            <p className="text-muted-foreground font-semibold">Yuklanmoqda...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedZones.map((zone) => {
              const zoneTables = zones[zone];
              const zoneOccupied = zoneTables.filter(t => t.orders.length > 0).length;
              const gradient = ZONE_COLORS[zone] ?? "from-gray-500 to-slate-600";

              return (
                <section key={zone}>
                  {/* Zone header */}
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-9 h-9 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-base shadow-md`}>
                      {ZONE_ICONS[zone] ?? "🪑"}
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-black text-foreground">{zone}</h2>
                      <p className="text-xs text-muted-foreground font-medium">
                        {zoneOccupied > 0
                          ? <><span className="text-orange-500 font-bold">{zoneOccupied} band</span> · {zoneTables.length - zoneOccupied} bo'sh</>
                          : `${zoneTables.length} ta joy, hammasi bo'sh`}
                      </p>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent ml-2" />
                  </div>

                  {/* Tables grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {zoneTables.map((table) => {
                      const isOccupied = table.orders.length > 0;
                      const totalSum = table.orders.reduce((s, o) => s + o.total, 0);
                      const itemCount = table.orders.reduce((s, o) => s + o.items.length, 0);

                      return (
                        <Link key={table.id} href={`/order/${table.id}`}>
                          <div className={`
                            relative group rounded-2xl border p-4 cursor-pointer
                            transition-all duration-200 hover:-translate-y-1 active:scale-95
                            ${isOccupied
                              ? "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 shadow-md shadow-orange-100"
                              : "bg-white/80 border-border/60 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-100/60"
                            }
                          `}>
                            {isOccupied && (
                              <span className="absolute -top-1.5 -right-1.5 flex">
                                <span className="w-3.5 h-3.5 rounded-full bg-orange-500 border-2 border-white" />
                                <span className="absolute w-3.5 h-3.5 rounded-full bg-orange-400 animate-ping" />
                              </span>
                            )}

                            <div className={`font-display font-black text-sm mb-3 ${isOccupied ? "text-orange-800" : "text-foreground/70 group-hover:text-foreground transition-colors"}`}>
                              {table.name}
                            </div>

                            {isOccupied ? (
                              <div>
                                <div className="font-black text-orange-600 text-sm leading-tight">{formatSom(totalSum)}</div>
                                <div className="text-[10px] text-orange-400 font-semibold mt-0.5">{itemCount} mahsulot</div>
                              </div>
                            ) : (
                              <div className="text-[11px] text-muted-foreground/50 font-semibold">Bo'sh</div>
                            )}

                            <div className={`absolute bottom-3 right-3 w-6 h-6 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-xs font-black
                              ${isOccupied ? "bg-orange-100 text-orange-600" : "bg-emerald-50 text-emerald-600"}`}>
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
    </main>
  );
}
