"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, Users, CircleDot, Coffee, UtensilsCrossed, Clock } from "lucide-react";
import { formatSom } from "@/lib/utils";

type TableWithOrders = {
  id: number;
  name: string;
  zone: string;
  sortOrder: number;
  orders: { id: number; total: number; items: any[]; createdAt: string }[];
};

const ZONE_ICONS: Record<string, string> = {
  "Kapa": "⛺",
  "Sori": "🛋",
  "O'rta sori": "🪑",
  "Past stol": "🪑",
  "Katta xona tepa": "🏛",
  "Katta xona stol": "🍽",
};

export default function HomePage() {
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  async function load() {
    try {
      const res = await fetch("/api/tables", { cache: "no-store" });
      const data = await res.json();
      setTables(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const dataInterval = setInterval(load, 10000);
    const clockInterval = setInterval(() => setTime(new Date()), 1000);
    return () => { clearInterval(dataInterval); clearInterval(clockInterval); };
  }, []);

  const zones: Record<string, TableWithOrders[]> = {};
  for (const t of tables) {
    if (!zones[t.zone]) zones[t.zone] = [];
    zones[t.zone].push(t);
  }

  const zoneOrder = ["Kapa", "Sori", "O'rta sori", "Past stol", "Katta xona tepa", "Katta xona stol"];
  const sortedZones = Object.keys(zones).sort((a, b) => zoneOrder.indexOf(a) - zoneOrder.indexOf(b));

  const totalOccupied = tables.filter(t => t.orders.length > 0).length;
  const totalRevenue = tables.reduce((s, t) => s + t.orders.reduce((os, o) => os + o.total, 0), 0);
  const totalTables = tables.length;

  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");

  return (
    <main className="min-h-screen">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container flex items-center justify-between py-3 px-4">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <Coffee className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-primary leading-tight">Sohil Choyxona</h1>
              <p className="text-xs text-muted-foreground">Hisob-kitob tizimi</p>
            </div>
          </div>

          {/* Clock + Admin */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-muted/60 border border-border/50 rounded-xl px-4 py-2">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="font-mono font-bold text-sm tabular-nums">
                {hours}:{minutes}
                <span className="text-muted-foreground">:{seconds}</span>
              </span>
            </div>
            <Link href="/admin">
              <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm">
                <Settings className="w-4 h-4" />
                Admin
              </button>
            </Link>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && (
          <div className="border-t border-border/40 bg-muted/20">
            <div className="container flex items-center gap-6 px-4 py-2">
              <div className="flex items-center gap-1.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-muted-foreground">Band:</span>
                <span className="font-bold text-accent">{totalOccupied}</span>
                <span className="text-muted-foreground">/ {totalTables}</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5 text-xs">
                <UtensilsCrossed className="w-3 h-3 text-muted-foreground" />
                <span className="text-muted-foreground">Ochiq hisob:</span>
                <span className="font-bold text-primary">{formatSom(totalRevenue)}</span>
              </div>
              <div className="w-px h-3 bg-border" />
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Jonli yangilanish
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ═══ BODY ═══ */}
      <div className="container px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Coffee className="w-6 h-6 text-primary animate-pulse" />
            </div>
            <p className="text-muted-foreground text-sm">Yuklanmoqda...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {sortedZones.map((zone) => {
              const zoneTables = zones[zone];
              const occupied = zoneTables.filter(t => t.orders.length > 0).length;

              return (
                <section key={zone}>
                  {/* Zone header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-base">
                      {ZONE_ICONS[zone] ?? "🪑"}
                    </div>
                    <div>
                      <h2 className="font-display text-lg font-bold text-primary">{zone}</h2>
                      <p className="text-xs text-muted-foreground">
                        {occupied > 0
                          ? <><span className="text-accent font-semibold">{occupied} ta band</span>, {zoneTables.length - occupied} ta bo'sh</>
                          : `${zoneTables.length} ta joy — hammasi bo'sh`
                        }
                      </p>
                    </div>
                    <div className="ml-auto h-px flex-1 bg-border/60 max-w-[120px]" />
                  </div>

                  {/* Tables grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {zoneTables.map((table) => {
                      const isOccupied = table.orders.length > 0;
                      const totalSum = table.orders.reduce((s, o) => s + o.total, 0);
                      const itemCount = table.orders.reduce((s, o) => s + o.items.length, 0);

                      return (
                        <Link key={table.id} href={`/order/${table.id}`}>
                          <div className={`relative group rounded-2xl border-2 p-4 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${
                            isOccupied
                              ? "border-accent/50 bg-accent/5 hover:border-accent"
                              : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                          }`}>
                            {/* Occupied dot */}
                            {isOccupied && (
                              <div className="absolute top-3 right-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-accent">
                                  <div className="w-2.5 h-2.5 rounded-full bg-accent animate-ping absolute" />
                                </div>
                              </div>
                            )}

                            {/* Table name */}
                            <div className={`font-display font-bold text-sm mb-2 pr-4 ${isOccupied ? "text-foreground" : "text-muted-foreground group-hover:text-foreground transition-colors"}`}>
                              {table.name}
                            </div>

                            {isOccupied ? (
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Users className="w-3 h-3" />
                                  <span>{itemCount} mahsulot</span>
                                </div>
                                <div className="font-bold text-sm text-accent">{formatSom(totalSum)}</div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground/60">
                                <CircleDot className="w-3 h-3" />
                                <span>Bo'sh</span>
                              </div>
                            )}

                            {/* Hover overlay */}
                            <div className={`absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                              isOccupied ? "bg-accent/10" : "bg-primary/5"
                            }`}>
                              <span className={`text-xs font-bold ${isOccupied ? "text-accent" : "text-primary"}`}>
                                Ochish →
                              </span>
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
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <UtensilsCrossed className="w-7 h-7 text-muted-foreground/40" />
                </div>
                <p className="text-muted-foreground font-medium">Ma'lumot yuklanmadi</p>
                <p className="text-muted-foreground/60 text-sm mt-1">Server bilan aloqa yo'q</p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
