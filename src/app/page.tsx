"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, Clock, UtensilsCrossed } from "lucide-react";
import { formatSom } from "@/lib/utils";

type TableWithOrders = {
  id: number;
  name: string;
  zone: string;
  sortOrder: number;
  orders: { id: number; total: number; items: any[] }[];
};

const ZONE_ICONS: Record<string, string> = {
  "Kapa": "⛺",
  "Sori": "🛋",
  "O'rta sori": "🪑",
  "Past stol": "🍃",
  "Katta xona tepa": "🏛",
  "Katta xona stol": "🍽",
};

export default function HomePage() {
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState<Date | null>(null);

  async function load() {
    try {
      const res = await fetch("/api/tables", { cache: "no-store" });
      setTables(await res.json());
    } finally { setLoading(false); }
  }

  useEffect(() => {
    load();
    setTime(new Date());
    const d = setInterval(load, 10000);
    const c = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(d); clearInterval(c); };
  }, []);

  const zones: Record<string, TableWithOrders[]> = {};
  for (const t of tables) {
    if (!zones[t.zone]) zones[t.zone] = [];
    zones[t.zone].push(t);
  }
  const zoneOrder = ["Kapa", "Sori", "O'rta sori", "Past stol", "Katta xona tepa", "Katta xona stol"];
  const sortedZones = Object.keys(zones).sort((a, b) => zoneOrder.indexOf(a) - zoneOrder.indexOf(b));

  const occupied = tables.filter(t => t.orders.length > 0).length;
  const revenue = tables.reduce((s, t) => s + t.orders.reduce((os, o) => os + o.total, 0), 0);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <main className="min-h-screen">

      {/* ══ HEADER ══ */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-sm border-b-2 border-foreground/8">
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between py-4">

            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center rotate-3 shadow-sm">
                <span className="text-primary-foreground text-lg -rotate-3">☕</span>
              </div>
              <div>
                <div className="font-display font-black text-xl tracking-tight text-foreground leading-none">
                  SOHIL
                </div>
                <div className="font-display text-xs tracking-[0.2em] text-muted-foreground uppercase">
                  Choyxona
                </div>
              </div>
            </div>

            {/* Clock + Admin */}
            <div className="flex items-center gap-3">
              {time && (
                <div className="hidden sm:flex items-center gap-2 border border-border rounded-sm px-3 py-2 bg-muted/40">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="font-mono text-sm font-semibold tabular-nums">
                    {pad(time.getHours())}:{pad(time.getMinutes())}
                    <span className="text-muted-foreground text-xs">:{pad(time.getSeconds())}</span>
                  </span>
                </div>
              )}
              <Link href="/admin">
                <button className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-sm text-sm font-bold tracking-wide hover:bg-foreground/85 transition-colors">
                  <Settings className="w-3.5 h-3.5" />
                  ADMIN
                </button>
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          {!loading && (
            <div className="flex items-center gap-6 pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent inline-block animate-pulse" />
                <span className="text-muted-foreground">Band:</span>
                <span className="font-bold text-accent">{occupied}</span>
                <span className="text-muted-foreground">/ {tables.length} joy</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Ochiq:</span>
                <span className="font-bold font-mono">{formatSom(revenue)}</span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* ══ BODY ══ */}
      <div className="max-w-6xl mx-auto px-5 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm tracking-widest uppercase">Yuklanmoqda</p>
          </div>
        ) : (
          <div className="space-y-10">
            {sortedZones.map((zone) => {
              const zoneTables = zones[zone];
              const zoneOccupied = zoneTables.filter(t => t.orders.length > 0).length;

              return (
                <section key={zone}>
                  {/* Zone label */}
                  <div className="flex items-center gap-4 mb-5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{ZONE_ICONS[zone] ?? "🪑"}</span>
                      <h2 className="font-display font-black text-base tracking-wide uppercase text-foreground">
                        {zone}
                      </h2>
                    </div>
                    {zoneOccupied > 0 && (
                      <span className="badge-retro text-accent border-accent/60">
                        {zoneOccupied} band
                      </span>
                    )}
                    <div className="flex-1 h-px bg-foreground/10" />
                    <span className="text-xs text-muted-foreground font-mono">
                      {zoneTables.length} ta joy
                    </span>
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
                            relative group rounded-sm border-2 p-4 cursor-pointer
                            transition-all duration-150 hover:-translate-y-0.5 active:scale-95
                            ${isOccupied
                              ? "border-accent bg-accent/8 shadow-sm"
                              : "border-border bg-card hover:border-foreground/30 hover:shadow-sm"
                            }
                          `}>
                            {/* Occupied indicator */}
                            {isOccupied && (
                              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-accent rounded-full border-2 border-background">
                                <div className="w-full h-full rounded-full bg-accent animate-ping absolute opacity-60" />
                              </div>
                            )}

                            {/* Table name */}
                            <div className={`font-display font-bold text-sm mb-3 ${isOccupied ? "text-foreground" : "text-muted-foreground group-hover:text-foreground transition-colors"}`}>
                              {table.name}
                            </div>

                            {isOccupied ? (
                              <div>
                                <div className="font-mono font-bold text-accent text-sm">
                                  {formatSom(totalSum)}
                                </div>
                                <div className="text-[10px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                                  {itemCount} mahsulot
                                </div>
                              </div>
                            ) : (
                              <div className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-semibold">
                                Bo'sh
                              </div>
                            )}

                            {/* Hover arrow */}
                            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-muted-foreground">
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

            {sortedZones.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
                <div className="w-16 h-16 border-2 border-dashed border-border rounded-sm flex items-center justify-center">
                  <UtensilsCrossed className="w-6 h-6 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground text-sm uppercase tracking-widest">Server bilan aloqa yo'q</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-border/60 mt-16 py-4">
        <div className="max-w-6xl mx-auto px-5 flex items-center justify-between text-xs text-muted-foreground/60">
          <span className="font-display font-bold uppercase tracking-widest">Sohil Choyxona</span>
          <span className="font-mono">POS v2.0</span>
        </div>
      </footer>
    </main>
  );
}
