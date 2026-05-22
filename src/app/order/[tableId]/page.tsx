"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Minus, Trash2, Printer, Check, ChevronDown, ChevronUp } from "lucide-react";
import { formatSom, formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Product = { id: number; name: string; price: number; isWeighted: boolean; unit: string; emoji: string; imageUrl?: string };
type Category = { id: number; name: string; icon: string; products: Product[] };
type CartItem = { productId: number; name: string; price: number; quantity: number; isWeighted: boolean; unit: string; emoji: string; imageUrl?: string };
type ExistingOrder = {
  id: number; total: number; subtotal: number; serviceCharge: number; createdAt: string;
  items: { id: number; name: string; price: number; quantity: number; total: number }[];
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
  const [ordersOpen, setOrdersOpen] = useState(true);

  async function loadData() {
    const [catsRes, ordersRes, tableRes] = await Promise.all([
      fetch("/api/products"), fetch(`/api/orders?tableId=${tableId}&status=open`), fetch("/api/tables"),
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

  useEffect(() => { loadData(); }, [tableId]);

  function addToCart(product: Product) {
    if (product.isWeighted) { setWeightInput("1"); setWeightDialog(product); return; }
    setCart(prev => {
      const ex = prev.find(i => i.productId === product.id);
      if (ex) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, isWeighted: false, unit: product.unit, emoji: product.emoji, imageUrl: product.imageUrl }];
    });
  }

  function addWeighted() {
    if (!weightDialog) return;
    const q = parseFloat(weightInput);
    if (isNaN(q) || q <= 0) { toast.error("Noto'g'ri miqdor"); return; }
    setCart(prev => [...prev, { productId: weightDialog.id, name: weightDialog.name, price: weightDialog.price, quantity: q, isWeighted: true, unit: weightDialog.unit, emoji: weightDialog.emoji, imageUrl: weightDialog.imageUrl }]);
    setWeightDialog(null);
  }

  function changeQty(idx: number, delta: number) {
    setCart(prev => {
      const n = [...prev];
      if (n[idx].isWeighted) return prev;
      n[idx] = { ...n[idx], quantity: n[idx].quantity + delta };
      if (n[idx].quantity <= 0) n.splice(idx, 1);
      return n;
    });
  }

  function removeItem(idx: number) { setCart(prev => prev.filter((_, i) => i !== idx)); }

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const serviceCharge = Math.round(subtotal * 0.01);
  const total = subtotal + serviceCharge;

  async function submitOrder() {
    if (cart.length === 0) { toast.error("Savat bo'sh"); return; }
    const res = await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tableId: Number(tableId), items: cart.map(i => ({ productId: i.productId, quantity: i.quantity })) }),
    });
    if (!res.ok) { toast.error("Xato"); return; }
    toast.success("Buyurtma yuborildi!");
    setCart([]);
    loadData();
  }

  async function payOrder(orderId: number) {
    const order = existingOrders.find(o => o.id === orderId);
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "pay" }) });
    if (res.ok) { toast.success("To'lov qabul qilindi!"); setReceiptOrder(order); loadData(); }
  }

  function printReceipt(order: any) { setReceiptOrder(order); setTimeout(() => window.print(), 200); }

  const existingTotal = existingOrders.reduce((s, o) => s + o.total, 0);
  const activeProducts = categories.find(c => c.id === activeCat)?.products ?? [];
  const cartCount = cart.reduce((s, i) => s + (i.isWeighted ? 1 : i.quantity), 0);

  return (
    <main className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-40 no-print bg-card/95 backdrop-blur-sm border-b-2 border-foreground/8">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <button className="w-9 h-9 border border-border rounded-sm flex items-center justify-center hover:bg-muted transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display font-black text-lg tracking-tight">{tableName}</h1>
              <span className="badge-retro text-muted-foreground border-border">buyurtma</span>
            </div>
          </div>
          {existingOrders.length > 0 && (
            <div className="text-right border border-accent/30 bg-accent/8 rounded-sm px-3 py-1.5">
              <div className="text-[9px] uppercase tracking-widest text-muted-foreground font-bold">Ochiq hisob</div>
              <div className="font-mono font-black text-accent text-sm">{formatSom(existingTotal)}</div>
            </div>
          )}
        </div>
      </header>

      {/* BODY */}
      <div className="grid lg:grid-cols-[1fr_320px] h-[calc(100vh-61px)]">

        {/* CHAP: Menyu */}
        <div className="overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Ochiq buyurtmalar */}
            {existingOrders.length > 0 && (
              <div className="border-2 border-accent/30 bg-accent/5 rounded-sm overflow-hidden">
                <button className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/8 transition-colors" onClick={() => setOrdersOpen(!ordersOpen)}>
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="font-bold text-sm uppercase tracking-wide">Ochiq buyurtmalar</span>
                    <span className="font-mono text-xs bg-accent text-white px-1.5 py-0.5 rounded-sm font-bold">{existingOrders.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-accent text-sm">{formatSom(existingTotal)}</span>
                    {ordersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>
                {ordersOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-accent/20">
                    {existingOrders.map(o => (
                      <div key={o.id} className="bg-card border border-border/60 rounded-sm overflow-hidden mt-3">
                        <div className="flex items-center justify-between px-4 py-2 bg-muted/60 border-b border-border/40">
                          <span className="font-mono text-xs text-muted-foreground">#{o.id} · {formatDate(o.createdAt)}</span>
                          <span className="font-mono font-black text-sm">{formatSom(o.total)}</span>
                        </div>
                        <div className="px-4 py-2.5 space-y-1">
                          {o.items.map(it => (
                            <div key={it.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{it.name} <span className="font-bold text-foreground">×{it.quantity}</span></span>
                              <span className="font-mono font-semibold">{formatSom(it.total)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 px-4 py-3 border-t border-border/40 bg-muted/30">
                          <button onClick={() => payOrder(o.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-accent text-white font-bold text-sm py-2 rounded-sm hover:bg-accent/90 transition-colors uppercase tracking-wide">
                            <Check className="w-3.5 h-3.5" /> To'lov
                          </button>
                          <button onClick={() => printReceipt(o)} className="w-10 h-9 flex items-center justify-center border border-border rounded-sm hover:bg-muted transition-colors">
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Kategoriyalar */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {categories.map(c => (
                <button key={c.id} onClick={() => setActiveCat(c.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-sm font-bold text-xs whitespace-nowrap transition-all border-2 shrink-0 uppercase tracking-wide ${
                    activeCat === c.id
                      ? "bg-foreground text-background border-foreground"
                      : "bg-card border-border hover:border-foreground/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>

            {/* Mahsulotlar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeProducts.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="group text-left bg-card border-2 border-border rounded-sm overflow-hidden hover:border-foreground/40 hover:shadow-md transition-all duration-150 active:scale-95"
                >
                  {/* Rasm */}
                  <div className="w-full h-24 bg-muted/50 flex items-center justify-center overflow-hidden relative">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <span className="text-4xl group-hover:scale-110 transition-transform duration-200">{p.emoji}</span>
                    }
                    {/* + badge */}
                    <div className="absolute top-2 right-2 w-6 h-6 bg-foreground/80 text-background rounded-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="p-3 border-t border-border/60">
                    <div className="font-bold text-sm mb-1 leading-snug">{p.name}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-accent text-sm">{formatSom(p.price)}</span>
                      {p.isWeighted && <span className="badge-retro text-muted-foreground border-border/60 text-[9px]">/{p.unit}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* O'NG: Savat */}
        <div className="border-l-2 border-foreground/8 bg-card flex flex-col no-print">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🛒</span>
              <span className="font-display font-black text-base tracking-tight uppercase">Savat</span>
            </div>
            {cartCount > 0 && (
              <span className="font-mono font-black text-xs bg-foreground text-background w-6 h-6 rounded-sm flex items-center justify-center">{cartCount}</span>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
                <div className="text-5xl opacity-30">🛒</div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Mahsulot tanlang</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 bg-muted/40 rounded-sm px-3 py-2.5 border border-border/40">
                    <div className="w-8 h-8 rounded-sm overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-base">{item.emoji}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">{item.name}</div>
                      <div className="font-mono text-xs text-muted-foreground">{formatSom(item.price * item.quantity)}</div>
                    </div>
                    {item.isWeighted ? (
                      <span className="font-mono font-black text-xs text-accent">{item.quantity}{item.unit}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeQty(idx, -1)} className="w-6 h-6 border border-border rounded-sm flex items-center justify-center hover:bg-muted transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-mono font-black text-sm">{item.quantity}</span>
                        <button onClick={() => changeQty(idx, 1)} className="w-6 h-6 border border-border rounded-sm flex items-center justify-center hover:bg-muted transition-colors">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <button onClick={() => removeItem(idx)} className="w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-5 pt-3 border-t border-border/60">
            {cart.length > 0 && (
              <div className="border border-border/60 rounded-sm px-4 py-3 mb-3 space-y-1.5 bg-muted/30">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wide">Jami</span>
                  <span className="font-mono font-semibold">{formatSom(subtotal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground uppercase tracking-wide">Xizmat (1%)</span>
                  <span className="font-mono font-semibold">{formatSom(serviceCharge)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-2 border-t border-border/60">
                  <span className="uppercase tracking-wide">To'lov</span>
                  <span className="font-mono text-accent">{formatSom(total)}</span>
                </div>
              </div>
            )}
            <button disabled={cart.length === 0} onClick={submitOrder}
              className="w-full py-3.5 rounded-sm font-black text-sm bg-foreground text-background hover:bg-foreground/85 transition-all disabled:opacity-25 disabled:cursor-not-allowed uppercase tracking-widest"
            >
              {cart.length === 0 ? "Savat bo'sh" : `Yuborish — ${formatSom(total)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Og'irlik dialogi */}
      <Dialog open={!!weightDialog} onOpenChange={o => !o && setWeightDialog(null)}>
        <DialogContent className="max-w-sm rounded-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display font-black">
              <span className="text-2xl">{weightDialog?.emoji}</span>
              {weightDialog?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Narx: <span className="font-mono font-black text-accent">{weightDialog && formatSom(weightDialog.price)}</span> / {weightDialog?.unit}
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[0.5, 1, 1.2, 1.5, 2].map(v => (
                <button key={v} onClick={() => setWeightInput(v.toString())}
                  className={`py-2 rounded-sm text-sm font-mono font-black border-2 transition-all ${weightInput === v.toString() ? "bg-foreground text-background border-foreground" : "border-border hover:border-foreground/50"}`}>
                  {v}
                </button>
              ))}
            </div>
            <Input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)}
              className="text-center text-lg font-mono font-black h-12 rounded-sm" autoFocus />
            {weightDialog && weightInput && parseFloat(weightInput) > 0 && (
              <div className="text-center border border-accent/30 bg-accent/8 rounded-sm py-2.5 font-mono font-black text-accent text-lg">
                {formatSom(Math.round(weightDialog.price * (parseFloat(weightInput) || 0)))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setWeightDialog(null)} className="flex-1 py-2.5 rounded-sm border-2 border-border font-bold text-sm uppercase tracking-wide">Bekor</button>
            <button onClick={addWeighted} className="flex-1 py-2.5 rounded-sm bg-foreground text-background font-black text-sm uppercase tracking-wide">Qo'shish</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chek */}
      {receiptOrder && (
        <div className="print-only p-6 max-w-sm mx-auto font-mono text-sm">
          <div className="text-center border-b-2 border-dashed pb-3 mb-3">
            <div className="font-bold text-lg">SOHIL CHOYXONA</div>
            <div className="text-xs">Xush kelibsiz!</div>
          </div>
          <div className="mb-2 text-xs">
            <div>Stol: {tableName}</div>
            <div>#{receiptOrder.id} · {formatDate(receiptOrder.createdAt)}</div>
          </div>
          <div className="border-t border-dashed pt-2">
            {receiptOrder.items.map((it: any) => (
              <div key={it.id} className="flex justify-between py-0.5">
                <div className="flex-1"><div>{it.name}</div><div className="text-xs opacity-70">{it.quantity} × {formatSom(it.price)}</div></div>
                <div>{formatSom(it.total)}</div>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed mt-3 pt-2 space-y-0.5">
            <div className="flex justify-between"><span>Jami:</span><span>{formatSom(receiptOrder.subtotal)}</span></div>
            <div className="flex justify-between"><span>Xizmat (1%):</span><span>{formatSom(receiptOrder.serviceCharge)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t"><span>TO'LOV:</span><span>{formatSom(receiptOrder.total)}</span></div>
          </div>
          <div className="text-center mt-4 text-xs border-t border-dashed pt-3">Rahmat! Yana tashrif buyuring.</div>
        </div>
      )}
    </main>
  );
}
