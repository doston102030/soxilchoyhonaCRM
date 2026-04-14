"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Users, CircleDot } from "lucide-react";
import { formatSom } from "@/lib/utils";

type TableWithOrders = {
  id: number;
  name: string;
  zone: string;
  sortOrder: number;
  orders: { id: number; total: number; items: any[] }[];
};

export default function HomePage() {
  const [tables, setTables] = useState<TableWithOrders[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/tables", { cache: "no-store" });
    const data = await res.json();
    setTables(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000); // har 10 sek yangilash
    return () => clearInterval(interval);
  }, []);

  // Zonalar bo'yicha guruhlash
  const zones: Record<string, TableWithOrders[]> = {};
  for (const t of tables) {
    if (!zones[t.zone]) zones[t.zone] = [];
    zones[t.zone].push(t);
  }

  const zoneOrder = ["Kapa", "Sori", "O'rta sori", "Past stol", "Katta xona tepa", "Katta xona stol"];
  const sortedZones = Object.keys(zones).sort(
    (a, b) => zoneOrder.indexOf(a) - zoneOrder.indexOf(b)
  );

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b-2 border-primary/10 bg-card/60 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between py-5">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary tracking-tight">
              Sohil Choyxona
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Hisob-kitob tizimi</p>
          </div>
          <Link href="/admin">
            <Button variant="outline" size="lg">
              <Settings className="w-5 h-5 mr-2" />
              Admin
            </Button>
          </Link>
        </div>
      </header>

      <div className="container py-8">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Yuklanmoqda...</div>
        ) : (
          <div className="space-y-10">
            {sortedZones.map((zone) => (
              <section key={zone} className="animate-fade-up">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-1 w-12 bg-accent rounded-full" />
                  <h2 className="font-display text-2xl font-semibold text-primary">{zone}</h2>
                  <div className="text-sm text-muted-foreground">
                    ({zones[zone].length} ta joy)
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {zones[zone].map((table) => {
                    const isOccupied = table.orders.length > 0;
                    const totalSum = table.orders.reduce((s, o) => s + o.total, 0);
                    const itemCount = table.orders.reduce((s, o) => s + o.items.length, 0);

                    return (
                      <Link key={table.id} href={`/order/${table.id}`}>
                        <Card
                          className={`cursor-pointer transition-all hover:scale-[1.03] hover:shadow-lg border-2 ${
                            isOccupied
                              ? "border-accent bg-accent/5"
                              : "border-border hover:border-primary"
                          }`}
                        >
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between mb-3">
                              <div className="font-display text-lg font-semibold">
                                {table.name}
                              </div>
                              {isOccupied && (
                                <CircleDot className="w-5 h-5 text-accent animate-pulse" />
                              )}
                            </div>
                            {isOccupied ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                  <Users className="w-4 h-4" />
                                  {itemCount} mahsulot
                                </div>
                                <div className="font-semibold text-accent">
                                  {formatSom(totalSum)}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">Bo'sh</div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
