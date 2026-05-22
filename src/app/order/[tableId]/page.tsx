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
    <main className="min-h-screen">

      {/* HEADER */}
      <header className="sticky top-0 z-40 no-print glass">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/">
            <button className="w-9 h-9 bg-white/6 border border-white/10 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors text-white">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-xl font-black text-white leading-tight">{tableName}</h1>
            <p className="text-xs text-white/40 font-medium">Buyurtma qabul qilish</p>
          </div>
          {existingOrders.length > 0 && (
            <div className="bg-orange-500/15 border border-orange-500/30 rounded-2xl px-3 py-1.5">
              <div className="text-[9px] font-bold uppercase tracking-wider text-orange-400/70">Ochiq hisob</div>
              <div className="font-black text-sm text-orange-400">{formatSom(existingTotal)}</div>
            </div>
          )}
        </div>
      </header>

      {/* BODY */}
      <div className="grid lg:grid-cols-[1fr_320px] h-[calc(100vh-61px)]">

        {/* CHAP */}
        <div className="overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* Ochiq buyurtmalar */}
            {existingOrders.length > 0 && (
              <div className="rounded-2xl border border-orange-500/25 bg-orange-500/8 overflow-hidden">
                <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-orange-500/10 transition-colors" onClick={() => setOrdersOpen(!ordersOpen)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                    <span className="font-bold text-sm text-orange-200">Ochiq buyurtmalar</span>
                    <span className="bg-orange-500 text-black text-xs font-black px-2 py-0.5 rounded-full">{existingOrders.length}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-orange-400 text-sm">{formatSom(existingTotal)}</span>
                    <ChevronDown className={`w-4 h-4 text-orange-400/60 transition-transform ${ordersOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>
                {ordersOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-orange-500/15">
                    {existingOrders.map(o => (
                      <div key={o.id} className="bg-white/5 rounded-xl border border-white/8 overflow-hidden mt-3">
                        <div className="flex items-center justify-between px-4 py-2.5 bg-white/4 border-b border-white/6">
                          <span className="text-xs text-white/40 font-semibold">#{o.id} · {formatDate(o.createdAt)}</span>
                          <span className="font-black text-sm text-white">{formatSom(o.total)}</span>
                        </div>
                        <div className="px-4 py-3 space-y-1">
                          {o.items.map(it => (
                            <div key={it.id} className="flex justify-between text-sm">
                              <span className="text-white/50">{it.name} <span className="font-bold text-white/80">×{it.quantity}</span></span>
                              <span className="font-semibold text-white/70">{formatSom(it.total)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 px-4 py-3 border-t border-white/6 bg-white/3">
                          <button onClick={() => payOrder(o.id)} className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-black font-bold text-sm py-2.5 rounded-xl hover:opacity-90 transition-all shadow-lg shadow-green-900/40">
                            <Check className="w-4 h-4" /> To'lov qilish
                          </button>
                          <button onClick={() => printReceipt(o)} className="w-11 h-10 flex items-center justify-center bg-white/8 border border-white/10 rounded-xl hover:bg-white/12 transition-colors text-white/60">
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
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-black shadow-lg shadow-green-900/40"
                      : "bg-white/6 border border-white/10 text-white/60 hover:text-white hover:border-green-500/30 hover:bg-green-500/8"
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
                  className="group text-left bg-white/5 border border-white/8 rounded-2xl overflow-hidden hover:border-green-500/30 hover:bg-green-500/5 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-900/30 transition-all duration-200 active:scale-95"
                >
                  <div className="w-full h-28 bg-white/4 flex items-center justify-center overflow-hidden relative">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90" />
                      : <span className="text-5xl group-hover:scale-110 transition-transform duration-200 drop-shadow-lg">{p.emoji}</span>
                    }
                    <div className="absolute top-2 right-2 w-7 h-7 bg-green-500 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg shadow-green-900/50">
                      <Plus className="w-4 h-4 text-black" />
                    </div>
                  </div>
                  <div className="p-3 border-t border-white/6">
                    <div className="font-bold text-sm text-white/85 mb-1.5 leading-snug">{p.name}</div>
                    <div className="flex items-center justify-between">
                      <span className="font-black text-green-400 text-sm">{formatSom(p.price)}</span>
                      {p.isWeighted && <span className="text-[10px] text-white/30 bg-white/6 px-1.5 py-0.5 rounded-lg font-semibold">/{p.unit}</span>}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* O'NG: Savat */}
        <div className="border-l border-white/6 bg-white/3 flex flex-col no-print">
          <div className="px-5 py-4 border-b border-white/6 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-900/50">
              <ShoppingBag className="w-4 h-4 text-black" />
            </div>
            <span className="font-display font-black text-lg text-white">Savat</span>
            {cartCount > 0 && (
              <span className="ml-auto bg-green-500 text-black text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-md shadow-green-900/50">
                {cartCount}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-3">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-10">
                <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/8 flex items-center justify-center text-4xl">🛒</div>
                <p className="text-white/30 text-sm font-semibold">Savat bo'sh</p>
                <p className="text-white/20 text-xs">Mahsulot tanlang</p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 bg-white/5 border border-white/8 rounded-2xl px-3 py-2.5 hover:border-green-500/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/8 flex items-center justify-center shrink-0">
                      {item.imageUrl
                        ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xl">{item.emoji}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-white/85 truncate">{item.name}</div>
                      <div className="text-xs text-green-400 font-black">{formatSom(item.price * item.quantity)}</div>
                    </div>
                    {item.isWeighted ? (
                      <span className="font-black text-xs text-orange-400 bg-orange-500/15 border border-orange-500/20 px-2 py-1 rounded-lg">{item.quantity}{item.unit}</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button onClick={() => changeQty(idx, -1)} className="w-6 h-6 bg-white/8 rounded-lg flex items-center justify-center hover:bg-white/12 transition-colors text-white/60">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center font-black text-sm text-white">{item.quantity}</span>
                        <button onClick={() => changeQty(idx, 1)} className="w-6 h-6 bg-green-500/15 rounded-lg flex items-center justify-center hover:bg-green-500/25 transition-colors text-green-400">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                    <button onClick={() => removeItem(idx)} className="w-6 h-6 flex items-center justify-center text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-4 pb-5 pt-3 border-t border-white/6">
            {cart.length > 0 && (
              <div className="bg-white/4 border border-white/8 rounded-2xl px-4 py-3.5 mb-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40 font-medium">Jami</span>
                  <span className="font-bold text-white/80">{formatSom(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40 font-medium">Xizmat (1%)</span>
                  <span className="font-bold text-white/80">{formatSom(serviceCharge)}</span>
                </div>
                <div className="flex justify-between font-black text-base pt-2 border-t border-white/8">
                  <span className="text-white">To'lov</span>
                  <span className="text-green-400">{formatSom(total)}</span>
                </div>
              </div>
            )}
            <button disabled={cart.length === 0} onClick={submitOrder}
              className="w-full py-4 rounded-2xl font-black text-sm bg-gradient-to-r from-green-500 to-emerald-500 text-black hover:opacity-90 transition-all disabled:opacity-20 disabled:cursor-not-allowed shadow-xl shadow-green-900/50 hover:shadow-green-900/60 hover:-translate-y-0.5"
            >
              {cart.length === 0 ? "Savat bo'sh" : `Buyurtma berish — ${formatSom(total)}`}
            </button>
          </div>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={!!weightDialog} onOpenChange={o => !o && setWeightDialog(null)}>
        <DialogContent className="max-w-sm rounded-3xl border border-white/10 bg-[#0f1729] text-white shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-display font-black text-xl text-white">
              <span className="text-4xl">{weightDialog?.emoji}</span>
              <div>
                <div>{weightDialog?.name}</div>
                <div className="text-sm font-semibold text-green-400">{weightDialog && formatSom(weightDialog.price)} / {weightDialog?.unit}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="grid grid-cols-5 gap-2">
              {[0.5, 1, 1.2, 1.5, 2].map(v => (
                <button key={v} onClick={() => setWeightInput(v.toString())}
                  className={`py-2.5 rounded-2xl text-sm font-black transition-all ${weightInput === v.toString() ? "bg-gradient-to-br from-green-500 to-emerald-500 text-black shadow-lg shadow-green-900/50" : "bg-white/8 hover:bg-white/12 text-white/70"}`}>
                  {v}
                </button>
              ))}
            </div>
            <Input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)}
              className="text-center text-2xl font-black h-14 rounded-2xl bg-white/8 border border-white/12 text-white" autoFocus />
            {weightDialog && weightInput && parseFloat(weightInput) > 0 && (
              <div className="text-center bg-green-500/12 border border-green-500/25 rounded-2xl py-3 font-black text-green-400 text-xl">
                {formatSom(Math.round(weightDialog.price * (parseFloat(weightInput) || 0)))}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <button onClick={() => setWeightDialog(null)} className="flex-1 py-3 rounded-2xl bg-white/8 font-bold text-sm hover:bg-white/12 transition-colors text-white/70">Bekor</button>
            <button onClick={addWeighted} className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-black font-black text-sm shadow-lg shadow-green-900/50">Qo'shish</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chek */}
      {receiptOrder && (
        <div className="print-only p-6 max-w-sm mx-auto font-mono text-sm text-black">
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
