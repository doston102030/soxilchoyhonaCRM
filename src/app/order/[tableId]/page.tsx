"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Minus, Trash2, Printer, Check, ChevronDown, ShoppingBag } from "lucide-react";
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
    toast.success(`${product.name} qo'shildi`, { duration: 800, position: "bottom-center" });
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
    toast.success("✅ Buyurtma yuborildi!");
    setCart([]); loadData();
  }

  async function payOrder(orderId: number) {
    const order = existingOrders.find(o => o.id === orderId);
    const res = await fetch(`/api/orders/${orderId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "pay" }) });
    if (res.ok) { toast.success("💰 To'lov qabul qilindi!"); setReceiptOrder(order); loadData(); }
  }

  function printReceipt(order: any) { setReceiptOrder(order); setTimeout(() => window.print(), 200); }

  const existingTotal = existingOrders.reduce((s, o) => s + o.total, 0);
  const activeProducts = categories.find(c => c.id === activeCat)?.products ?? [];
  const cartCount = cart.reduce((s, i) => s + (i.isWeighted ? 1 : i.quantity), 0);

  return (
    <main className="min-h-screen bg-background">

      {/* HEADER */}
      <header className="sticky top-0 z-40 no-print glass border-b border-white/60 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <button className="w-9 h-9 bg-white/80 border border-border/60 rounded-xl flex items-center justify-center hover:bg-muted transition-colors shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-xl font-black text-foreground leading-tight">{tableName}</h1>
            <p className="text-xs text-muted-foreground font-medium">Buyurtma qabul qilish</p>
          </div>
          {existingOrders.length > 0 && (
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl px-3 py-1.5 shadow-lg shadow-orange-200">
              <div className="text-[9px] font-bold uppercase tracking-wider opacity-80">Ochiq hisob</div>
              <div className="font-black text-sm">{formatSom(existingTotal)}</div>
            </div>
          )}
        </div>
      </header>

      {/* BODY */}
      <div className="grid lg:grid-cols-[1fr_340px] h-[calc(100vh-61px)]">

        {/* CHAP: Menyu */}
        <div className="overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Ochiq buyurtmalar */}
            {existingOrders.length > 0 && (
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden shadow-sm">
                <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-orange-100/50 transition-colors" onClick={() => setOrdersOpen(!ordersOpen)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                    <span className="font-bold text-sm text-orange-800">Ochiq buyurtmalar</span>
                    <span className="bg-orange-500 text-white text-xs font-black px-2 py-0.5 rounded-full">{existingOrders.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-orange-600 text-sm">{formatSom(existingTotal)}</span>
                    <ChevronDown className={`w-4 h-4 text-orange-400 transition-transform ${ordersOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {ordersOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-orange-100">
                    {existingOrders.map(o => (
                      <div key={o.id} className="bg-white rounded-xl border border-orange-100 overflow-hidden shadow-sm mt-3">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-orange-50/60 border-b border-orange-100">
                          <span className="text-xs text-orange-400 font-semibold">#{o.id} · {formatDate(o.createdAt)}</span>
                          <span className="font-black text-sm text-orange-700">{formatSom(o.total)}</span>
                        </div>
                        <div className="px-4 py-3 space-y-1">
                          {o.items.map(it => (
                            <div key={it.id} className="flex justify-between text-sm">
                              <span className="text-muted-foreground">{it.name} <span className="font-bold text-foreground">×{it.quantity}</span></span>
                              <span className="font-semibold">{formatSom(it.total)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 px-4 py-3 border-t border-orange-100 bg-orange-50/40">
                          <button onClick={() => payOrder(o.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm py-2.5 rounded-xl hover:opacity-90 transition-all shadow-sm shadow-emerald-200">
                            <Check className="w-4 h-4" /> To'lov qilish
                          </button>
                          <button onClick={() => printReceipt(o)} className="w-11 h-10 flex items-center justify-center bg-white border border-border rounded-xl hover:bg-muted transition-colors shadow-sm">
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
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl font-bold text-sm whitespace-nowrap transition-all shrink-0 ${
                    activeCat === c.id
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-200"
                      : "bg-white/80 border border-border/60 text-muted-foreground hover:text-foreground hover:border-emerald-200 hover:bg-emerald-50/50 shadow-sm"
                  }`}
                >
                  <span>{c.icon}</span> {c.name}
                </button>
              ))}
            </div>

            {/* Mahsulotlar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {activeProducts.map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="group text-left bg-white border border-border/50 rounded-2xl overflow-hidden hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-100/60 hover:-translate-y-1 transition-all duration-200 active:scale-95 shadow-sm"
                >
                  <div className="w-full h-28 bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center overflow-hidden relative">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <span className="text-5xl group-hover:scale-110 transition-transform duration-200 drop-shadow-md">{p.emoji}</span>
                    }
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 right-2 w-7 h-7 bg-white/90 backdrop-blur rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md">
                      <Plus className="w-4 h-4 text-emerald-600" />
                    </div>
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-sm text-foreground mb-1.5 leading-snug">{p.name}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-emerald-600 text-sm">{formatSom(p.price)}</span>
                      {p.isWeighted && <span className="text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded-lg font-semibold">/{p.unit}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* O'NG: Savat */}
        <div className="border-l border-border/40 bg-white/70 backdrop-blur-sm flex flex-col no-print">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-black text-lg">Savat</span>
            {cartCount > 0 && (
              <span className="ml-auto bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md shadow-emerald-200">
                {cartCount}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-10">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-muted/60 to-muted/30 flex items-center justify-center text-4xl">🛒</div>
                <p className="text-muted-foreground text-sm font-semibold">Savat bo'sh</p>
                <p className="text-muted-foreground/60 text-xs">Mahsulot tanlang</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 bg-white border border-border/50 rounded-2xl px-3 py-2.5 shadow-sm hover:border-emerald-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-muted/50 flex items-center justify-center shrink-0">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xl">{item.emoji}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs truncate">{item.name}</div>
                      <div className="text-xs text-emerald-600 font-black">{formatSom(item.price * item.quantity)}</div>
                    </div>
                    {item.isWeighted ? (
                      <span className="font-black text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded-lg">{item.quantity}{item.unit}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeQty(idx, -1)} className="w-6 h-6 bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-black text-sm">{item.quantity}</span>
                        <button onClick={() => changeQty(idx, 1)} className="w-6 h-6 bg-emerald-50 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors">
                          <Plus className="w-3 h-3 text-emerald-600" />
                        </button>
                      </div>
                    )}
                    <button onClick={() => removeItem(idx)} className="w-6 h-6 flex items-center justify-center text-muted-foreground/40 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-5 pt-3 border-t border-border/40">
            {cart.length > 0 && (
              <div className="bg-muted/40 rounded-2xl px-4 py-3.5 mb-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Jami</span>
                  <span className="font-bold">{formatSom(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Xizmat (1%)</span>
                  <span className="font-bold">{formatSom(serviceCharge)}</span>
                </div>
                <div className="flex justify-between font-black text-base pt-2 border-t border-border/60">
                  <span>To'lov</span>
                  <span className="text-emerald-600">{formatSom(total)}</span>
                </div>
              </div>
            )}
            <button disabled={cart.length === 0} onClick={submitOrder}
              className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 hover:shadow-xl hover:shadow-emerald-200 hover:-translate-y-0.5"
            >
              {cart.length === 0 ? "Savat bo'sh" : `Buyurtma berish — ${formatSom(total)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Og'irlik dialogi */}
      <Dialog open={!!weightDialog} onOpenChange={o => !o && setWeightDialog(null)}>
        <DialogContent className="max-w-sm rounded-3xl border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-display font-black text-xl">
              <span className="text-4xl">{weightDialog?.emoji}</span>
              <div>
                <div>{weightDialog?.name}</div>
                <div className="text-sm font-semibold text-emerald-600">{weightDialog && formatSom(weightDialog.price)} / {weightDialog?.unit}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {[0.5, 1, 1.2, 1.5, 2].map(v => (
                <button key={v} onClick={() => setWeightInput(v.toString())}
                  className={`py-2.5 rounded-2xl text-sm font-black transition-all ${weightInput === v.toString() ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-200" : "bg-muted/60 hover:bg-muted text-foreground"}`}>
                  {v}
                </button>
              ))}
            </div>
            <Input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)}
              className="text-center text-2xl font-black h-14 rounded-2xl border-2 border-emerald-100 focus:border-emerald-400" autoFocus />
            {weightDialog && weightInput && parseFloat(weightInput) > 0 && (
              <div className="text-center bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl py-3 font-black text-emerald-600 text-xl">
                {formatSom(Math.round(weightDialog.price * (parseFloat(weightInput) || 0)))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setWeightDialog(null)} className="flex-1 py-3 rounded-2xl bg-muted font-bold text-sm hover:bg-muted/80 transition-colors">Bekor</button>
            <button onClick={addWeighted} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-sm shadow-md shadow-emerald-200 hover:opacity-90 transition-all">Qo'shish</button>
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
