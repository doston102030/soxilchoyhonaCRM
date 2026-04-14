"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Minus, Trash2, ShoppingCart, Printer, Check, ChevronDown, ChevronUp } from "lucide-react";
import { formatSom, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Product = {
  id: number;
  name: string;
  price: number;
  isWeighted: boolean;
  unit: string;
};

type Category = {
  id: number;
  name: string;
  icon: string;
  products: Product[];
};

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  isWeighted: boolean;
  unit: string;
};

type ExistingOrder = {
  id: number;
  total: number;
  subtotal: number;
  serviceCharge: number;
  createdAt: string;
  items: {
    id: number;
    name: string;
    price: number;
    quantity: number;
    total: number;
  }[];
};

export default function OrderPage({ params }: { params: Promise<{ tableId: string }> }) {
  const { tableId } = use(params);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [existingOrders, setExistingOrders] = useState<ExistingOrder[]>([]);
  const [tableName, setTableName] = useState("");
  const [weightDialog, setWeightDialog] = useState<Product | null>(null);
  const [weightInput, setWeightInput] = useState("1");
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [ordersExpanded, setOrdersExpanded] = useState(true);

  async function loadData() {
    const [catsRes, ordersRes, tableRes] = await Promise.all([
      fetch("/api/products"),
      fetch(`/api/orders?tableId=${tableId}&status=open`),
      fetch("/api/tables"),
    ]);
    const cats = await catsRes.json();
    const orders = await ordersRes.json();
    const tables = await tableRes.json();
    setCategories(cats);
    if (cats.length > 0 && activeCat === null) setActiveCat(cats[0].id);
    setExistingOrders(orders);
    const t = tables.find((x: any) => x.id === Number(tableId));
    if (t) setTableName(t.name);
  }

  useEffect(() => {
    loadData();
  }, [tableId]);

  function addToCart(product: Product) {
    if (product.isWeighted) {
      setWeightInput("1");
      setWeightDialog(product);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        { productId: product.id, name: product.name, price: product.price, quantity: 1, isWeighted: false, unit: product.unit },
      ];
    });
  }

  function addWeighted() {
    if (!weightDialog) return;
    const q = parseFloat(weightInput);
    if (isNaN(q) || q <= 0) { toast.error("Noto'g'ri miqdor"); return; }
    setCart((prev) => [
      ...prev,
      { productId: weightDialog.id, name: weightDialog.name, price: weightDialog.price, quantity: q, isWeighted: true, unit: weightDialog.unit },
    ]);
    setWeightDialog(null);
    toast.success(`${weightDialog.name} — ${q} ${weightDialog.unit}`);
  }

  function changeQty(idx: number, delta: number) {
    setCart((prev) => {
      const n = [...prev];
      if (n[idx].isWeighted) return prev;
      n[idx] = { ...n[idx], quantity: n[idx].quantity + delta };
      if (n[idx].quantity <= 0) n.splice(idx, 1);
      return n;
    });
  }

  function removeItem(idx: number) {
    setCart((prev) => prev.filter((_, i) => i !== idx));
  }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const serviceCharge = Math.round(subtotal * 0.01);
  const total = subtotal + serviceCharge;

  async function submitOrder() {
    if (cart.length === 0) { toast.error("Savat bo'sh"); return; }
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tableId: Number(tableId),
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    });
    if (!res.ok) { toast.error("Xato yuz berdi"); return; }
    toast.success("Buyurtma qo'shildi!");
    setCart([]);
    loadData();
  }

  async function payOrder(orderId: number) {
    const order = existingOrders.find((o) => o.id === orderId);
    const res = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pay" }),
    });
    if (res.ok) {
      toast.success("To'lov qabul qilindi");
      setReceiptOrder(order);
      loadData();
    }
  }

  function printReceipt(order: any) {
    setReceiptOrder(order);
    setTimeout(() => window.print(), 200);
  }

  const existingTotal = existingOrders.reduce((s, o) => s + o.total, 0);
  const activeProducts = categories.find((c) => c.id === activeCat)?.products ?? [];
  const cartCount = cart.reduce((s, i) => s + (i.isWeighted ? 1 : i.quantity), 0);

  return (
    <main className="min-h-screen bg-background">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 no-print bg-card/95 backdrop-blur-md border-b border-border/60 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <button className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="font-display text-xl font-bold text-primary leading-tight">{tableName}</h1>
            <p className="text-xs text-muted-foreground">Buyurtma qabul qilish</p>
          </div>

          {existingOrders.length > 0 && (
            <div className="text-right bg-accent/10 border border-accent/20 rounded-xl px-3 py-1.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Ochiq hisob</div>
              <div className="font-bold text-accent text-sm">{formatSom(existingTotal)}</div>
            </div>
          )}
        </div>
      </header>

      {/* ═══ BODY ═══ */}
      <div className="grid lg:grid-cols-[1fr_360px] h-[calc(100vh-61px)]">

        {/* ─── CHAP PANEL: Menyu ─── */}
        <div className="overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Ochiq buyurtmalar */}
            {existingOrders.length > 0 && (
              <div className="rounded-2xl border-2 border-accent/25 bg-accent/5 overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/10 transition-colors"
                  onClick={() => setOrdersExpanded(!ordersExpanded)}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="font-semibold text-sm">
                      Ochiq buyurtmalar ({existingOrders.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-accent text-sm">{formatSom(existingTotal)}</span>
                    {ordersExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>

                {ordersExpanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-accent/20">
                    {existingOrders.map((o) => (
                      <div key={o.id} className="bg-card rounded-xl border border-border/60 overflow-hidden mt-3">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/50 border-b border-border/40">
                          <span className="text-xs text-muted-foreground font-medium">
                            #{o.id} • {formatDate(o.createdAt)}
                          </span>
                          <span className="font-bold text-sm">{formatSom(o.total)}</span>
                        </div>
                        <div className="px-4 py-2.5 space-y-1">
                          {o.items.map((it) => (
                            <div key={it.id} className="flex justify-between text-sm">
                              <span className="text-foreground/80">{it.name} <span className="text-muted-foreground">×{it.quantity}</span></span>
                              <span className="font-medium">{formatSom(it.total)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 px-4 py-3 border-t border-border/40 bg-muted/30">
                          <button
                            onClick={() => payOrder(o.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white font-semibold text-sm py-2 rounded-lg hover:bg-accent/90 transition-colors"
                          >
                            <Check className="w-4 h-4" />
                            To'lov qilish
                          </button>
                          <button
                            onClick={() => printReceipt(o)}
                            className="w-10 h-9 flex items-center justify-center border border-border rounded-lg hover:bg-muted transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Kategoriya tablar */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCat(c.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all border-2 shrink-0 ${
                    activeCat === c.id
                      ? "bg-primary text-primary-foreground border-primary shadow-md"
                      : "bg-card border-border text-foreground hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <span className="text-base">{c.icon}</span>
                  {c.name}
                </button>
              ))}
            </div>

            {/* Mahsulotlar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="group text-left bg-card border-2 border-border rounded-2xl p-4 hover:border-accent hover:shadow-lg hover:-translate-y-0.5 transition-all duration-150 active:scale-95"
                >
                  <div className="font-semibold text-sm mb-2 group-hover:text-primary transition-colors leading-snug">
                    {p.name}
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-accent font-bold text-base">{formatSom(p.price)}</span>
                    {p.isWeighted && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                        /{p.unit}
                      </span>
                    )}
                  </div>
                  <div className="mt-2.5 w-full h-7 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                    <Plus className="w-3.5 h-3.5 text-primary group-hover:text-white transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── O'NG PANEL: Savat ─── */}
        <div className="border-l border-border/60 bg-card flex flex-col no-print">
          {/* Savat header */}
          <div className="px-5 py-4 border-b border-border/60 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-4.5 h-4.5 text-primary" />
            </div>
            <h3 className="font-display text-lg font-bold">Savat</h3>
            {cartCount > 0 && (
              <span className="ml-auto bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {cartCount}
              </span>
            )}
          </div>

          {/* Savat items */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-3">
                  <ShoppingCart className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-muted-foreground text-sm">Savat bo'sh</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Mahsulot tanlang</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2.5 bg-muted/40 rounded-xl px-3 py-2.5"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatSom(item.price)}{item.isWeighted ? ` / ${item.unit}` : ""}
                      </div>
                    </div>

                    {item.isWeighted ? (
                      <div className="text-sm font-bold text-accent px-2 bg-accent/10 rounded-lg py-1">
                        {item.quantity} {item.unit}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeQty(idx, -1)}
                          className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-sm">{item.quantity}</span>
                        <button
                          onClick={() => changeQty(idx, 1)}
                          className="w-7 h-7 rounded-lg border border-border bg-card hover:bg-muted flex items-center justify-center transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="text-right min-w-[60px]">
                      <div className="text-xs font-semibold">{formatSom(item.price * item.quantity)}</div>
                    </div>

                    <button
                      onClick={() => removeItem(idx)}
                      className="w-7 h-7 rounded-lg hover:bg-destructive/10 flex items-center justify-center text-destructive/60 hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Savat footer */}
          <div className="px-5 py-4 border-t border-border/60">
            {cart.length > 0 && (
              <div className="space-y-1.5 mb-4 bg-muted/40 rounded-xl px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Jami</span>
                  <span className="font-medium">{formatSom(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Xizmat haqi (1%)</span>
                  <span className="font-medium">{formatSom(serviceCharge)}</span>
                </div>
                <div className="flex justify-between font-bold text-base pt-2 border-t border-border/60 mt-1">
                  <span>To'lov</span>
                  <span className="text-accent">{formatSom(total)}</span>
                </div>
              </div>
            )}

            <button
              disabled={cart.length === 0}
              onClick={submitOrder}
              className="w-full py-3.5 rounded-xl font-bold text-base bg-primary text-primary-foreground hover:bg-primary/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {cart.length === 0 ? "Savat bo'sh" : `Buyurtma berish — ${formatSom(total)}`}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Og'irlik dialogi ─── */}
      <Dialog open={!!weightDialog} onOpenChange={(o) => !o && setWeightDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">{weightDialog?.name}</DialogTitle>
          </DialogHeader>
          <div className="py-3">
            <div className="text-sm text-muted-foreground mb-3">
              Narx: <span className="font-semibold text-accent">{weightDialog && formatSom(weightDialog.price)}</span> / {weightDialog?.unit}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-4">
              {[0.5, 1, 1.2, 1.5, 2].map((v) => (
                <button
                  key={v}
                  onClick={() => setWeightInput(v.toString())}
                  className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                    weightInput === v.toString()
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <Input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={`Miqdor (${weightDialog?.unit})`}
              className="text-lg text-center font-bold h-12"
              autoFocus
            />
            {weightDialog && weightInput && parseFloat(weightInput) > 0 && (
              <div className="mt-3 text-center bg-accent/10 rounded-xl py-2.5">
                <span className="font-bold text-accent text-lg">
                  {formatSom(Math.round(weightDialog.price * (parseFloat(weightInput) || 0)))}
                </span>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setWeightDialog(null)} className="flex-1">
              Bekor
            </Button>
            <Button onClick={addWeighted} className="flex-1">
              Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Chek (print) ─── */}
      {receiptOrder && (
        <div className="print-only p-6 max-w-sm mx-auto font-mono text-sm">
          <div className="text-center border-b-2 border-dashed pb-3 mb-3">
            <div className="font-bold text-lg">SOHIL CHOYXONA</div>
            <div className="text-xs">Xush kelibsiz!</div>
          </div>
          <div className="mb-2 text-xs">
            <div>Stol: {tableName}</div>
            <div>#{receiptOrder.id} • {formatDate(receiptOrder.createdAt)}</div>
          </div>
          <div className="border-t border-dashed pt-2">
            {receiptOrder.items.map((it: any) => (
              <div key={it.id} className="flex justify-between py-0.5">
                <div className="flex-1">
                  <div>{it.name}</div>
                  <div className="text-xs opacity-70">{it.quantity} × {formatSom(it.price)}</div>
                </div>
                <div>{formatSom(it.total)}</div>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed mt-3 pt-2 space-y-0.5">
            <div className="flex justify-between"><span>Jami:</span><span>{formatSom(receiptOrder.subtotal)}</span></div>
            <div className="flex justify-between"><span>Xizmat (1%):</span><span>{formatSom(receiptOrder.serviceCharge)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t">
              <span>TO'LOV:</span><span>{formatSom(receiptOrder.total)}</span>
            </div>
          </div>
          <div className="text-center mt-4 text-xs border-t border-dashed pt-3">
            Rahmat! Yana tashrif buyuring.
          </div>
        </div>
      )}
    </main>
  );
}
