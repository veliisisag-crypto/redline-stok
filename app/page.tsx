"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

function AuditSection({ supabase }: { supabase: typeof import("@/lib/supabase").supabase }) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => { setLogs((data || []) as AuditLog[]); setLoading(false); });
  }, []);
  return (
    <div className="space-y-4">
      <Card title="İşlem Geçmişi">
        {loading ? <p className="text-sm text-slate-500">Yükleniyor...</p> : (
          <Table
            headers={["Tarih", "İşlem", "Tablo", "Kayıt", "Kullanıcı"]}
            rows={logs.map((log) => [
              toTR(log.created_at, true),
              log.action,
              log.entity_type,
              log.entity_name || "-",
              log.user_email || "-",
            ])}
          />
        )}
      </Card>
    </div>
  );
}


type SaleType = "Normal satış" | "Fire/Bozuk" | "İç Kullanım";
type Seller = string;

type AppUser = {
  id: string;
  email: string;
  name: string;
  role: "admin" | "ortak" | "satici";
  active: boolean;
  created_at: string;
};

type PreorderItem = {
  id: string;
  preorder_id: string;
  product_id: string;
  qty: number;
};

type Preorder = {
  id: string;
  customer_id: string;
  created_by: string;
  created_at: string;
  note: string;
  status: string;
  items?: PreorderItem[];
};

type ProductType = {
  id: string;
  name: string;
  active: boolean;
};

type Product = {
  id: string;
  name: string;
  code: string;
  image_url: string | null;
  passive: boolean;
  type_id: string | null;
  barcode: string | null;
};

type Customer = {
  id: string;
  name: string;
  passive: boolean;
};

type Batch = {
  id: string;
  name: string;
};

type BatchItem = {
  id: string;
  batch_id: string;
  product_id: string;
  bought: number;
  buy_price: number;
  sale_price: number;
  depo?: string;
  barcode?: string;
};

type Sale = {
  id: string;
  customer_id: string;
  product_id: string;
  batch_id: string;
  batch_item_id?: string | null;
  seller: Seller;
  sale_type: SaleType;
  qty: number;
  total: number;
  cost: number;
  paid: boolean;
  paid_amount: number;
  cancelled: boolean;
  created_at: string;
};

type Payment = {
  id: string;
  customer_id: string;
  amount: number;
  cancelled?: boolean;
  note?: string | null;
  created_at: string;
  user_email?: string | null;
};

type PartnerRow = {
  id: string;
  partner_name: "56Kasa" | "Rabia" | "Harun";
  role: string;
  contribution: number;
  receivable: number;
  debt: number;
  profit_share: number;
};

type BatchCost = {
  id: string;
  batch_id: string;
  kasa_alti: number;
  kasaAlti?: number;
  rabia: number;
  harun: number;
  kasa: number;
  kargo: number;
  diger: number;
  aciklama: string;
};

type Period = {
  id: string;
  name: string;
  sponsor_contribution: number;
  rabia_contribution: number;
  harun_contribution: number;
  net_odeme?: number;
  rabia_net_odeme?: number;
  mihri_net_odeme?: number;
  product_cost: number;
  shipping_cost: number;
  closing_cash?: number | null;
  rabia_distribution?: number | null;
  harun_distribution?: number | null;
  urun_maliyeti?: number | null;
  diger_maliyetler?: number | null;
  toplam_tahsilat?: number | null;
  donem_kari?: number | null;
  closed: boolean;
  created_at: string;
  closed_at: string | null;
};

type AuditLog = {
  id: string;
  action: string;
  entity_type: string;
  entity_name: string | null;
  user_email: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
};

const money = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));

const today = () => new Date().toISOString().slice(0, 10);

const toTR = (isoStr?: string | null, withTime = false) => {
  if (!isoStr) return "-";
  const d = new Date(isoStr);
  d.setHours(d.getHours() + 3);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  if (!withTime) return `${dd}.${mm}.${yyyy}`;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const min = String(d.getUTCMinutes()).padStart(2, "0");
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
};
const toNum = (v: unknown) => Number(v || 0);

function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white p-5 shadow-sm">
      {title ? <h3 className="mb-4 text-lg font-semibold">{title}</h3> : null}
      {children}
    </section>
  );
}

function StatCard({ title, value, note }: { title: string; value: ReactNode; note?: string }) {
  return (
    <section className="rounded-xl border bg-white shadow-sm" style={{padding:"12px 16px"}}>
      <p className="text-xs text-slate-500">{title}</p>
      <p className="text-xl font-semibold" style={{marginTop:2}}>{value}</p>
      {note ? <p className="text-xs text-slate-400" style={{marginTop:2}}>{note}</p> : null}
    </section>
  );
}

function Table({ headers, rows }: { headers: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead className="bg-slate-100">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className="whitespace-nowrap p-3 text-left font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, i) => (
              <tr key={i} className="border-t">
                {row.map((cell, j) => (
                  <td key={j} className="whitespace-nowrap p-3 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td className="p-3 text-slate-500" colSpan={headers.length}>
                Kayıt yok.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AppContent({ onLogout }: { onLogout: () => void }) {
  const [active, setActive] = useState("dashboard");
  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [currentUserEmail, setCurrentUserEmail] = useState<string>("");
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "ortak" | "satici">("satici");
  const [currentUserName, setCurrentUserName] = useState<string>("");
  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  // Admin panel state
  const [newUserForm, setNewUserForm] = useState({ email: "", name: "", role: "satici" as AppUser["role"] });
  const [userMessage, setUserMessage] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [partners, setPartners] = useState<PartnerRow[]>([]);
  const [batchCosts, setBatchCosts] = useState<BatchCost[]>([]);
  const [costInputs, setCostInputs] = useState<Record<string, Record<string, string>>>({});
  const [periods, setPeriods] = useState<Period[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [preorders, setPreorders] = useState<Preorder[]>([]);
  const [preorderItems, setPreorderItems] = useState<PreorderItem[]>([]);
  const [paymentAllocations, setPaymentAllocations] = useState<{id:string; payment_id:string; sale_id:string; amount:number; created_at:string}[]>([]);
  const [preorderForm, setPreorderForm] = useState<{ customerId: string; note: string; items: { productId: string; qty: string }[] }>({ customerId: "", note: "", items: [{ productId: "", qty: "1" }] });
  const [editingPreorderId, setEditingPreorderId] = useState<string | null>(null);
  const [convertModal, setConvertModal] = useState<{ preorder: Preorder; item: PreorderItem } | null>(null);
  const [convertPrices, setConvertPrices] = useState<Record<string, string>>({});
  const [convertPaid, setConvertPaid] = useState<string>("false");

  const [search, setSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({});
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<string>("");
  const [showKarDetay, setShowKarDetay] = useState(false);
  const [showTahsilatDetay, setShowTahsilatDetay] = useState(false);
  const [saleLoading, setSaleLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [editingNetOdemeId, setEditingNetOdemeId] = useState<string | null>(null);
  const [editingNetOdemeVal, setEditingNetOdemeVal] = useState<string>("");
  const [salesSort, setSalesSort] = useState<{col: string; dir: "asc"|"desc"}>({col: "created_at", dir: "desc"});
  const [saleStatusFilter, setSaleStatusFilter] = useState<string>("Tümü");
  const [splitModal, setSplitModal] = useState<{item: BatchItem; newDepo: string} | null>(null);
  const [splitQty, setSplitQty] = useState<string>("");
  const [saleDrafts, setSaleDrafts] = useState<Record<string, { qty: string; total: string; cost: string; seller: Seller; sale_type: SaleType; paid: boolean }>>({});
  const [editingBatchItemId, setEditingBatchItemId] = useState<string | null>(null);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [productDrafts, setProductDrafts] = useState<Record<string, Partial<Product>>>({});
  const pendingImageRef = useRef<Record<string, string>>({});
  const [salesModalProductId, setSalesModalProductId] = useState<string | null>(null);
  const [customerDrafts, setCustomerDrafts] = useState<Record<string, Partial<Customer>>>({});
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const [newProduct, setNewProduct] = useState({ name: "", image: "", typeId: "" });
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [newProductTypeName, setNewProductTypeName] = useState("");
  const [productTypeMessage, setProductTypeMessage] = useState("");
  const [newCustomerName, setNewCustomerName] = useState("");
  const [newBatchName, setNewBatchName] = useState("");
  const [batchReportFilter, setBatchReportFilter] = useState("Tümü");
  // Barkod modal state
  const [barcodeModal, setBarcodeModal] = useState<{
    item: BatchItem;
    productName: string;
    batchName: string;
  } | null>(null);
  const [barcodeQty, setBarcodeQty] = useState("");
  const [barcodeMode, setBarcodeMode] = useState<"yeni" | "tekrar">("yeni");
  const [subMenuOpen, setSubMenuOpen] = useState(false);
  // Kamera/tarama state
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState("");
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  // QR önizleme ve barkod kontrol
  const [qrPreview, setQrPreview] = useState<{ productName: string; barcode: string; dataUrl: string } | null>(null);
  const [barcodeCheckOpen, setBarcodeCheckOpen] = useState(false);
  const [barcodeCheckResult, setBarcodeCheckResult] = useState<{ found: boolean; productName?: string; batchName?: string; depo?: string; barcode?: string } | null>(null);
  const barcodeCheckVideoRef = useRef<HTMLVideoElement>(null);
  const barcodeCheckControlsRef = useRef<{ stop: () => void } | null>(null);
  // Kameradan resim çek
  const [photoCaptureTarget, setPhotoCaptureTarget] = useState<"newProduct" | string | null>(null); // string = productId
  const photoCaptureRef = useRef<HTMLInputElement>(null);
  const photoVideoRef = useRef<HTMLVideoElement>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);
  const [batchReportSort, setBatchReportSort] = useState<{col: string; dir: "asc"|"desc"}>({col: "batch", dir: "asc"});
  const [batchForm, setBatchForm] = useState({ batchId: "", productId: "", bought: "", buyPrice: "", salePrice: "", depo: "56salon" });
  const [saleForm, setSaleForm] = useState({ customerId: "", productId: "", batchId: "", qty: "1", seller: "Rabia" as Seller, saleType: "Normal satış" as SaleType, customSalePrice: "", depo: "56salon" });
  const [periodForm, setPeriodForm] = useState({ name: `Dönem ${today()}`, sponsor: "0", rabia: "0", harun: "0", productCost: "0", shippingCost: "0" });

  const activeSales = sales.filter((sale) => !sale.cancelled);
  const activePayments = payments.filter((payment) => !payment.cancelled);

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const batchMap = useMemo(() => new Map(batches.map((b) => [b.id, b])), [batches]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [products]
  );
  const sortedActiveProducts = useMemo(
    () => sortedProducts.filter((p) => !p.passive),
    [sortedProducts]
  );
  const sortedCustomers = useMemo(
    () => [...customers].sort((a, b) => a.name.localeCompare(b.name, "tr")),
    [customers]
  );
  const sortedActiveCustomers = useMemo(
    () => sortedCustomers.filter((c) => !c.passive),
    [sortedCustomers]
  );
  const sortedBatches = useMemo(
    () => [...batches].sort((a, b) => a.name.localeCompare(b.name, "tr", { numeric: true })),
    [batches]
  );

  const showError = (error: unknown) => {
    let msg = "Bilinmeyen hata";
    if (error instanceof Error) {
      msg = error.message;
    } else if (error && typeof error === "object") {
      const e = error as Record<string, unknown>;
      msg = String(e.message || e.error_description || e.details || JSON.stringify(error));
    } else if (error) {
      msg = String(error);
    }
    showToast("Hata: " + msg, "error");
  };

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setMessage(msg);
    setToastType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const loadAll = async () => {
    setLoadingData(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || "";
      setCurrentUserEmail(email);

      // app_users tablosundan rol ve isim çek
      const { data: appUsersData } = await supabase.from("app_users").select("*").order("name", { ascending: true });
      const allAppUsers = (appUsersData || []) as AppUser[];
      setAppUsers(allAppUsers);
      const currentAppUser = allAppUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      const role = currentAppUser?.role || "satici";
      const name = currentAppUser?.name || email.split("@")[0];
      setCurrentUserRole(role);
      setCurrentUserName(name);

      const defaultDepo = email.includes("harun") ? "Türkiş-salon" : "56salon";
      const defaultSeller: Seller = name;
      setSaleForm((prev) => ({ ...prev, depo: defaultDepo, seller: defaultSeller }));
      setBatchForm((prev) => ({ ...prev, depo: defaultDepo }));

      const [productsRes, customersRes, batchesRes, batchItemsRes, salesRes, paymentsRes, partnersRes, periodsRes, batchCostsRes, preordersRes, preorderItemsRes, paymentAllocationsRes, productTypesRes] = await Promise.all([
        supabase.from("products").select("id,name,code,image_url,passive,type_id,barcode").order("created_at", { ascending: true }),
        supabase.from("customers").select("*").order("created_at", { ascending: true }),
        supabase.from("batches").select("*").order("created_at", { ascending: true }),
        supabase.from("batch_items").select("*").order("created_at", { ascending: true }),
        supabase.from("sales").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(500),
        supabase.from("partner_ledger").select("*").order("partner_name", { ascending: true }),
        supabase.from("periods").select("*").order("created_at", { ascending: false }),
        supabase.from("batch_costs").select("*"),
        supabase.from("preorders").select("*").order("created_at", { ascending: false }),
        supabase.from("preorder_items").select("*"),
        supabase.from("payment_allocations").select("*").order("created_at", { ascending: true }),
        supabase.from("product_types").select("*").order("name", { ascending: true }),
      ]);

      for (const res of [productsRes, customersRes, batchesRes, batchItemsRes, salesRes, paymentsRes, partnersRes, periodsRes, batchCostsRes]) {
        if (res.error) throw res.error;
      }

      setProducts((productsRes.data || []) as Product[]);
      setCustomers((customersRes.data || []) as Customer[]);
      setBatches((batchesRes.data || []) as Batch[]);
      setBatchItems((batchItemsRes.data || []) as BatchItem[]);
      setSales((salesRes.data || []) as Sale[]);
      setPayments((paymentsRes.data || []) as Payment[]);
      setPartners((partnersRes.data || []) as PartnerRow[]);
      setPeriods((periodsRes.data || []) as Period[]);
      setProductTypes((productTypesRes.data || []) as ProductType[]);
      setBatchCosts((batchCostsRes.data || []) as BatchCost[]);
      setPreorders((preordersRes.data || []) as Preorder[]);
      setPreorderItems((preorderItemsRes.data || []) as PreorderItem[]);
      setPaymentAllocations((paymentAllocationsRes.data || []) as {id:string; payment_id:string; sale_id:string; amount:number; created_at:string}[]);
      // Initialize costInputs from loaded data - merge with existing to not lose unsaved changes
      const inputs: Record<string, Record<string, string>> = {};
      for (const c of (batchCostsRes.data || []) as BatchCost[]) {
        inputs[c.batch_id] = {
          kasaAlti: String(c.kasa_alti || 0),
          rabia: String(c.rabia || 0),
          harun: String(c.harun || 0),
          kasa: String(c.kasa || 0),
          kargo: String(c.kargo || 0),
          diger: String(c.diger || 0),
          aciklama: c.aciklama || "",
        };
      }
      setCostInputs((prev) => ({ ...inputs, ...prev }));
    } catch (err) {
      showError(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    setProcessing(false);
    loadAll();
  }, []);

  const logAction = async (
    action: string,
    entityType: string,
    entityName?: string,
    details?: Record<string, unknown>
  ) => {
    try {
      const { data } = await supabase.auth.getUser();
      await supabase.from("audit_log").insert({
        action,
        entity_type: entityType,
        entity_name: entityName || "",
        user_email: data.user?.email || "",
        details: details || {},
      });
    } catch (err) {
      console.warn("Audit log yazılamadı", err);
    }
  };

  const batchItemsForProduct = (productId: string) => batchItems.filter((item) => item.product_id === productId);

  const getBatchSoldQty = (productId: string, batchId: string) => {
    // Find all batch_items for this product+batch combination
    const items = batchItems.filter((i) => i.product_id === productId && i.batch_id === batchId);
    if (items.length <= 1) {
      // Only one row — normal calculation
      return activeSales.filter((sale) => sale.product_id === productId && sale.batch_id === batchId).reduce((sum, sale) => sum + sale.qty, 0);
    }
    // Multiple rows (split depo) — assign sales only to the first/oldest row
    // We identify "this" item by checking if it's the one with the most bought (original row)
    // Sales are assigned to the row with the highest bought count (the original)
    return 0; // Will be overridden below
  };

  const getBatchSoldQtyForItem = (item: BatchItem) => {
    // First try exact match by batch_item_id (new sales)
    const byItemId = activeSales.filter((s) => s.batch_item_id === item.id).reduce((sum, s) => sum + s.qty, 0);
    // Also count sales without batch_item_id (old sales) using old batch_id method
    const oldSales = activeSales.filter((s) => !s.batch_item_id && s.product_id === item.product_id && s.batch_id === item.batch_id);
    if (oldSales.length === 0) return byItemId;
    // For old sales, distribute among siblings proportionally (greedy by bought desc)
    const siblings = batchItems.filter((i) => i.product_id === item.product_id && i.batch_id === item.batch_id);
    const oldTotal = oldSales.reduce((sum, s) => sum + s.qty, 0);
    if (siblings.length <= 1) return byItemId + oldTotal;
    const sorted = [...siblings].sort((a, b) => b.bought - a.bought);
    let remaining = oldTotal;
    for (const sib of sorted) {
      const assign = Math.min(sib.bought, remaining);
      if (sib.id === item.id) return byItemId + assign;
      remaining -= assign;
    }
    return byItemId;
  };

  const getProductTotalBought = (productId: string) => batchItemsForProduct(productId).reduce((sum, item) => sum + item.bought, 0);
  const getProductSoldQty = (productId: string) => activeSales.filter((sale) => sale.product_id === productId).reduce((sum, sale) => sum + sale.qty, 0);
  const getProductStock = (productId: string) => getProductTotalBought(productId) - getProductSoldQty(productId);
  const getCustomerSalesTotal = (customerId: string) =>
    activeSales
      .filter((sale) => sale.customer_id === customerId)
      .reduce((sum, sale) => sum + toNum(sale.total), 0);

  const getCustomerUnpaidSalesTotal = (customerId: string) =>
    activeSales
      .filter((sale) => sale.customer_id === customerId && !sale.paid)
      .reduce((sum, sale) => sum + toNum(sale.total), 0);

  const getCustomerPaidSalesTotal = (customerId: string) =>
    activeSales
      .filter((sale) => sale.customer_id === customerId && sale.paid)
      .reduce((sum, sale) => sum + toNum(sale.total), 0);

  const getCustomerManualPaymentsTotal = (customerId: string) =>
    activePayments
      .filter((payment) => payment.customer_id === customerId)
      .reduce((sum, payment) => sum + toNum(payment.amount), 0);

  const getCustomerCollectedTotal = (customerId: string) =>
    getCustomerPaidSalesTotal(customerId) + getCustomerManualPaymentsTotal(customerId);

  const getCustomerBalance = (customerId: string) =>
    Math.max(getCustomerSalesTotal(customerId) - getCustomerCollectedTotal(customerId), 0);

  const EK_MALIYET = 38.4;
  const EK_MALIYET_PARTILER = ["1.parti","2.parti","3.parti","4.parti","5.parti","6.parti"];

  const anlıkKar = useMemo(() => {
    const lastClosed = periods
      .filter((p) => p.closed && p.closed_at)
      .sort((a, b) => new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime())[0];
    const sinceDate = lastClosed ? new Date(lastClosed.closed_at!) : new Date(0);

    // Son kapanıştan sonra gelen allocation'lar
    const recentAllocs = paymentAllocations.filter((a) => new Date(a.created_at) > sinceDate);

    // Sale map
    const saleMap = new Map(activeSales.map((s) => [s.id, s]));

    return recentAllocs.reduce((toplam, alloc) => {
      const sale = saleMap.get(alloc.sale_id);
      if (!sale) return toplam;
      if (sale.sale_type === "Fire/Bozuk") return toplam;

      const cost = toNum(sale.cost);
      const batchName = batchMap.get(sale.batch_id)?.name || "";
      const normalizedBatch = batchName.toLowerCase().replace(/\s/g, "");
      const hasEkMaliyet = EK_MALIYET_PARTILER.some(p => normalizedBatch === p);
      const ekMaliyet = hasEkMaliyet ? EK_MALIYET : 0;

      if (sale.sale_type === "İç Kullanım") {
        return toplam - (cost + ekMaliyet);
      }

      const total = toNum(sale.total);
      if (total <= 0) return toplam;
      const oran = alloc.amount / total;
      return toplam + alloc.amount - (cost + ekMaliyet) * oran;
    }, 0);
  }, [paymentAllocations, activeSales, batchMap, periods]);

  const karDetay = useMemo(() => {
    const lastClosed = periods
      .filter((p) => p.closed && p.closed_at)
      .sort((a, b) => new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime())[0];
    const sinceDate = lastClosed ? new Date(lastClosed.closed_at!) : new Date(0);
    const recentAllocs = paymentAllocations.filter((a) => new Date(a.created_at) > sinceDate);
    const saleMap = new Map(activeSales.map((s) => [s.id, s]));

    return recentAllocs
      .filter((alloc) => {
        const sale = saleMap.get(alloc.sale_id);
        return sale && sale.sale_type !== "Fire/Bozuk";
      })
      .map((alloc) => {
        const sale = saleMap.get(alloc.sale_id)!;
        const cost = toNum(sale.cost);
        const total = toNum(sale.total);
        const batchName = batchMap.get(sale.batch_id)?.name || "";
        const normalizedBatch = batchName.toLowerCase().replace(/\s/g, "");
        const hasEkMaliyet = EK_MALIYET_PARTILER.some(p => normalizedBatch === p);
        const ekMaliyet = hasEkMaliyet ? EK_MALIYET : 0;
        const oran = sale.sale_type === "İç Kullanım" ? 1 : (total > 0 ? alloc.amount / total : 1);
        const gercekMaliyet = (cost + ekMaliyet) * oran;
        const kar = sale.sale_type === "İç Kullanım" ? -(cost + ekMaliyet) : alloc.amount - gercekMaliyet;
        return {
          tarih: alloc.created_at,
          cari: customerMap.get(sale.customer_id)?.name || "-",
          urun: productMap.get(sale.product_id)?.name || "-",
          adet: sale.qty,
          satisFiyati: total,
          tahsilat: alloc.amount,
          maliyet: cost,
          ekMaliyet: hasEkMaliyet ? EK_MALIYET : 0,
          kar,
          saleType: sale.sale_type,
        };
      })
      .sort((a, b) => b.kar - a.kar);
  }, [paymentAllocations, activeSales, batchMap, periods, customerMap, productMap]);

  const totals = useMemo(() => {
    const customerDebt = customers.reduce((sum, c) => sum + getCustomerBalance(c.id), 0);
    const stockValue = batchItems.reduce((sum, item) => sum + Math.max(item.bought - getBatchSoldQtyForItem(item), 0) * item.buy_price, 0);
    const totalStock = products.filter((p) => !p.passive).reduce((sum, p) => sum + getProductStock(p.id), 0);
    const lastClosedAt = periods.filter((p) => p.closed && p.closed_at).sort((a, b) => new Date(b.closed_at!).getTime() - new Date(a.closed_at!).getTime())[0]?.closed_at;
    const sinceDate = lastClosedAt ? new Date(lastClosedAt) : new Date(0);
    const recentPayments = activePayments.filter((p) => new Date(p.created_at) > sinceDate);
    const grossCash = recentPayments.reduce((sum, item) => sum + item.amount, 0);
    const distributedCash = periods
      .filter((period) => period.closed)
      .reduce((sum, period) => sum + Number(period.rabia_distribution || 0) + Number(period.harun_distribution || 0), 0);
    const cash = Math.max(grossCash - distributedCash, 0);
    const revenue = cash + customerDebt + distributedCash;
    const profit = activeSales.reduce((sum, item) => sum + (item.total - item.cost), 0);
    return { revenue, profit, customerDebt, stockValue, totalStock, grossCash, distributedCash, cash, recentPayments };
  }, [products, customers, batchItems, activeSales, activePayments, periods]);


  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase();
    if (!query) return sortedCustomers;
    return sortedCustomers.filter((customer) => customer.name.toLowerCase().includes(query));
  }, [sortedCustomers, customerSearch]);

  const recentMovements = useMemo(() => {
    const shortUser = (email?: string, seller?: string) => {
      if (seller) return seller;
      if (!email) return "-";
      const appUser = appUsers.find((u) => u.email.toLowerCase() === email?.toLowerCase());
      if (appUser) return appUser.name;
      return email.split("@")[0];
    };

    const saleRows = activeSales.map((sale) => ({
      id: `sale-${sale.id}`,
      date: sale.created_at,
      type: sale.sale_type === "Fire/Bozuk" ? "Fire/Bozuk" : "Peşin satış",
      customer: customerMap.get(sale.customer_id)?.name || "-",
      detail: `${productMap.get(sale.product_id)?.name || "-"} / ${batchMap.get(sale.batch_id)?.name || "-"} / ${sale.qty} adet`,
      amount: toNum(sale.total),
      user: shortUser(undefined, sale.seller),
    }));

    // Peşin satışlara otomatik eklenen payment'ları filtrele (aynı müşteri, aynı tutar, aynı dakika)
    const pesinSaleKeys = new Set(
      activeSales
        .filter((s) => s.paid && s.sale_type === "Normal satış")
        .map((s) => `${s.customer_id}-${s.total}-${s.created_at?.slice(0,16)}`)
    );

    const paymentRows = activePayments
      .filter((payment) => {
        const key = `${payment.customer_id}-${payment.amount}-${payment.created_at?.slice(0,16)}`;
        return !pesinSaleKeys.has(key);
      })
      .map((payment) => ({
        id: `payment-${payment.id}`,
        date: payment.created_at,
        type: "Tahsilat",
        customer: customerMap.get(payment.customer_id)?.name || "-",
        detail: "Cari ödeme",
        amount: toNum(payment.amount),
        user: shortUser(payment.user_email ?? undefined),
      }));

    const auditRows = auditLogs.map((log) => ({
      id: `audit-${log.id}`,
      date: log.created_at,
      type: log.action,
      customer: log.entity_type,
      detail: log.entity_name || "-",
      amount: 0,
      user: shortUser(log.user_email ?? undefined),
    }));

    return [...saleRows, ...paymentRows, ...auditRows]
      .sort((a, b) => new Date(b.date || "").getTime() - new Date(a.date || "").getTime())
      .slice(0, 100);
  }, [activeSales, activePayments, auditLogs, customerMap, productMap, batchMap]);

  // Resmi max 100KB olacak şekilde sıkıştır
  const resizeImage = (base64: string, maxKB = 100): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        // Max 800px ile başla
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
          else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        // Kaliteyi düşürerek hedef boyuta ulaş
        let quality = 0.85;
        let result = canvas.toDataURL("image/jpeg", quality);
        while (result.length > maxKB * 1024 * 1.37 && quality > 0.1) {
          quality -= 0.1;
          result = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(result);
      };
      img.src = base64;
    });
  };

  const uploadImageToStorage = async (base64: string, fileName: string): Promise<string | null> => {
    try {
      // Önce resize et
      const resized = await resizeImage(base64, 100);
      const res = await fetch(resized);
      const blob = await res.blob();
      const path = `${fileName}-${Date.now()}.jpg`;
      const { error } = await supabase.storage.from("product-images").upload(path, blob, { upsert: true, contentType: "image/jpeg" });
      if (error) { showError(error); return null; }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      return data.publicUrl;
    } catch (err) {
      showError(err);
      return null;
    }
  };

  const addProductDefinition = async () => {
    if (processing) return;
    setProcessing(true);
    const name = newProduct.name.trim();
    if (!name || name.length > 50) return showToast("Ürün adı zorunlu ve en fazla 50 karakter olmalı.", "error");
    if (!newProduct.typeId) return showToast("Ürün türü seçimi zorunludur.", "error");
    if (products.some((p) => p.name.toLowerCase() === name.toLowerCase())) return showToast("Bu kaynak ürün zaten kayıtlı.", "error");

    const idTail = Date.now().toString().slice(-6);
    const code = `URN-${idTail}`;

    let imageUrl: string | null = null;
    if (newProduct.image) {
      showToast("Resim yükleniyor...", "info");
      imageUrl = await uploadImageToStorage(newProduct.image, code);
    }

    const { error } = await supabase.from("products").insert({
      name,
      code,
      image_url: imageUrl,
      type_id: newProduct.typeId,
      barcode: generateBarcode(),
    });
    if (error) return showError(error);
    await logAction("Ürün eklendi", "products", name, { code });
    setNewProduct({ name: "", image: "", typeId: "" });
    showToast("Kaynak ürün kaydedildi.", "success");
    setProcessing(false);
    loadAll();
  };

  const updateProduct = async (productId: string, patch: Partial<Product>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.code !== undefined) dbPatch.code = patch.code;
    if (patch.image_url !== undefined) dbPatch.image_url = patch.image_url;
    if (patch.passive !== undefined) dbPatch.passive = patch.passive;
    if (patch.type_id !== undefined) dbPatch.type_id = patch.type_id;
    const { error } = await supabase.from("products").update(dbPatch).eq("id", productId);
    if (error) return showError(error);
    // Exclude image_url from log to avoid storing large base64/URL data
    const { image_url: _img, ...logPatch } = dbPatch as Record<string, unknown> & { image_url?: unknown };
    await logAction("Ürün değiştirildi", "products", products.find((p) => p.id === productId)?.name || productId, logPatch);
    setProcessing(false);
    loadAll();
  };

  const deleteProduct = async (productId: string) => {

    const product = products.find((p) => p.id === productId);
    if (!product) return;


    const hasSales = activeSales.some((sale) => sale.product_id === productId);
    if (hasSales) {
      await updateProduct(productId, { passive: true });
      await logAction("Ürün pasife alındı", "products", product.name);
      return showToast("Ürün satışlarda kullanıldığı için silinmedi, pasife alındı.", "success");
    }
    const hasBatch = batchItems.some((item) => item.product_id === productId);
    if (hasBatch) return showToast("Bu ürüne bağlı parti girişi var. Önce parti satırlarını silin.", "info");
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) return showError(error);
    await logAction("Ürün silindi", "products", product.name);
    showToast("Ürün silindi.", "success");
    setProcessing(false);
    loadAll();
  };

  const addCustomer = async () => {
    if (processing) return;
    setProcessing(true);
    const name = newCustomerName.trim();
    if (!name || name.length > 50) return showToast("Cari adı zorunlu ve en fazla 50 karakter olmalı.", "error");
    if (customers.some((c) => c.name.toLowerCase() === name.toLowerCase())) return showToast("Bu cari zaten kayıtlı.", "error");
    const { error } = await supabase.from("customers").insert({ name });
    if (error) return showError(error);
    await logAction("Cari eklendi", "customers", name);
    setNewCustomerName("");
    setProcessing(false);
    loadAll();
  };

  const updateCustomerName = async (customerId: string, name: string) => {
    if (name.length > 50) return;
    const oldName = customers.find((c) => c.id === customerId)?.name || customerId;
    const { error } = await supabase.from("customers").update({ name }).eq("id", customerId);
    if (error) return showError(error);
    await logAction("Cari değiştirildi", "customers", oldName, { yeni_ad: name });
    setProcessing(false);
    loadAll();
  };

  const deleteCustomer = async (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (!customer) return;	
    const hasSales = activeSales.some((sale) => sale.customer_id === customerId);
    const hasPayments = activePayments.some((p) => p.customer_id === customerId);
    if (hasSales || hasPayments) {
      const { error } = await supabase.from("customers").update({ passive: true }).eq("id", customerId);
      if (error) return showError(error);
      await logAction("Cari pasife alındı", "customers", customer.name);
      showToast("Cari hareket gördüğü için silinmedi, pasife alındı.", "success");
      return loadAll();
    }
    const { error } = await supabase.from("customers").delete().eq("id", customerId);
    if (error) return showError(error);
    await logAction("Cari silindi", "customers", customer.name);
    showToast("Cari silindi.", "success");
    setProcessing(false);
    loadAll();
  };

  const addBatchName = async () => {
    if (processing) return;
    setProcessing(true);
    const name = newBatchName.trim();
    if (!name) return showToast("Parti adı boş olamaz.", "error");
    if (batches.some((b) => b.name === name)) return showToast("Bu parti zaten kayıtlı.", "error");
    const { error } = await supabase.from("batches").insert({ name });
    if (error) return showError(error);
    await logAction("Parti eklendi", "batches", name);
    setNewBatchName("");
    showToast("Yeni parti adı kaynak listeye eklendi.", "success");
    setProcessing(false);
    loadAll();
  };

  const deleteBatchName = async (batchId: string) => {
    const used = batchItems.some((item) => item.batch_id === batchId) || activeSales.some((sale) => sale.batch_id === batchId);
    if (used) return showToast("Bu parti kullanıldığı için silinemez.", "error");
    const batchName = batches.find((b) => b.id === batchId)?.name || batchId;
    const { error } = await supabase.from("batches").delete().eq("id", batchId);
    if (error) return showError(error);
    await logAction("Parti silindi", "batches", batchName);
    setProcessing(false);
    loadAll();
  };

  const renameBatchName = async (batchId: string, newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    if (batches.some((b) => b.name === clean && b.id !== batchId)) return showToast("Bu parti adı zaten var.", "error");
    const oldName = batches.find((b) => b.id === batchId)?.name || batchId;
    const { error } = await supabase.from("batches").update({ name: clean }).eq("id", batchId);
    if (error) return showError(error);
    await logAction("Parti değiştirildi", "batches", oldName, { yeni_ad: clean });
    setProcessing(false);
    loadAll();
  };

  const addBatchProduct = async () => {
    if (processing) return;
    setProcessing(true);
    const productId = batchForm.productId;
    const batchId = batchForm.batchId;
    const bought = Number(batchForm.bought || 0);
    const buyPrice = Number(batchForm.buyPrice || 0);
    const salePrice = Number(batchForm.salePrice || 0);
    if (!productId) return showToast("Parti kaydı için kaynak ürün seçmelisiniz.", "error");
    if (!batchId) return showToast("Parti adı zorunlu.", "error");
    if (bought <= 0 || buyPrice <= 0) return showToast("Adet ve alış fiyatı 0'dan büyük olmalı.", "error");

    const { error } = await supabase.from("batch_items").insert({
      product_id: productId,
      batch_id: batchId,
      bought,
      buy_price: buyPrice,
      sale_price: salePrice,
      depo: batchForm.depo || "Belirsiz",
    });
    if (error) return showError(error);
    await logAction("Partiye ürün eklendi", "batch_items", `${productMap.get(productId)?.name || productId} / ${batchMap.get(batchId)?.name || batchId}`, { adet: bought, alis: buyPrice, satis: salePrice, depo: batchForm.depo });
    setBatchForm({ batchId, productId: "", bought: "", buyPrice: "", salePrice: "", depo: "56salon" });
    showToast("Parti ürün kaydı eklendi.", "success");
    setProcessing(false);
    loadAll();
  };

  // Kameradan fotoğraf çekme
  const openPhotoCapture = async (target: "newProduct" | string) => {
    setPhotoCaptureTarget(target);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      photoStreamRef.current = stream;
      setTimeout(() => {
        if (photoVideoRef.current) {
          photoVideoRef.current.srcObject = stream;
          photoVideoRef.current.play();
        }
      }, 100);
    } catch {
      showToast("Kamera açılamadı. İzin verdiğinizden emin olun.", "info");
      setPhotoCaptureTarget(null);
    }
  };

  const capturePhoto = async () => {
    if (!photoVideoRef.current || !photoCaptureTarget) return;
    const video = photoVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.9);
    const resized = await resizeImage(base64);
    if (photoCaptureTarget === "newProduct") {
      setNewProduct((prev) => ({ ...prev, image: resized }));
    } else {
      pendingImageRef.current[photoCaptureTarget] = resized;
      setProductDrafts((prev) => ({ ...prev, [photoCaptureTarget]: { ...(prev[photoCaptureTarget] || {}), image_url: resized } }));
    }
    closePhotoCapture();
  };

  const closePhotoCapture = () => {
    photoStreamRef.current?.getTracks().forEach((t) => t.stop());
    photoStreamRef.current = null;
    setPhotoCaptureTarget(null);
  };

  // QR önizleme göster
  const showQrPreview = async (productName: string, barcode: string) => {
    const QRCode = (await import("qrcode")).default;
    const canvas = document.createElement("canvas");
    await QRCode.toCanvas(canvas, barcode, { width: 300, margin: 2 });
    setQrPreview({ productName, barcode, dataUrl: canvas.toDataURL("image/png") });
  };

  // Barkod kontrol tarayıcısını başlat
  const startBarcodeCheck = async () => {
    setBarcodeCheckResult(null);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const codeReader = new BrowserMultiFormatReader();
      const videoEl = barcodeCheckVideoRef.current;
      if (!videoEl) return;
      const controls = await codeReader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoEl,
        (result) => {
          if (result) {
            const barcodeValue = result.getText();
            const product = products.find((p) => p.barcode === barcodeValue);
            if (product) {
              const item = batchItems.find((i) => i.product_id === product.id);
              setBarcodeCheckResult({
                found: true,
                productName: product.name,
                batchName: item ? batchMap.get(item.batch_id)?.name || "-" : "-",
                depo: item?.depo || "-",
                barcode: barcodeValue,
              });
            } else {
              setBarcodeCheckResult({ found: false, barcode: barcodeValue });
            }
            controls.stop();
            barcodeCheckControlsRef.current = null;
          }
        }
      );
      barcodeCheckControlsRef.current = controls;
    } catch {
      setBarcodeCheckResult({ found: false, barcode: "Kamera açılamadı" });
    }
  };

  const stopBarcodeCheck = () => {
    try { barcodeCheckControlsRef.current?.stop(); } catch {}
    barcodeCheckControlsRef.current = null;
    if (barcodeCheckVideoRef.current?.srcObject) {
      const stream = barcodeCheckVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((t) => t.stop());
      barcodeCheckVideoRef.current.srcObject = null;
    }
    setBarcodeCheckOpen(false);
    setBarcodeCheckResult(null);
  };

  // Kamera tarayıcıyı başlat
  const startScanner = async () => {
    setScannerError("");
    setScanning(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const codeReader = new BrowserMultiFormatReader();
      const videoEl = videoRef.current;
      if (!videoEl) return;

      const controls = await codeReader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoEl,
        (result, err) => {
          if (result) {
            const barcodeValue = result.getText();
            // Önce kamerayı kapat
            try { controls.stop(); } catch {}
            if (videoEl.srcObject) {
              const stream = videoEl.srcObject as MediaStream;
              stream.getTracks().forEach((t) => t.stop());
              videoEl.srcObject = null;
            }
            scannerControlsRef.current = null;
            setScannerOpen(false);
            setScanning(false);
            // Sonra barkodu işle
            handleBarcodeScanned(barcodeValue);
          }
        }
      );
      scannerControlsRef.current = controls;
    } catch (err) {
      setScannerError("Kamera açılamadı. Tarayıcı iznini kontrol edin.");
      setScanning(false);
    }
  };

  const stopScanner = () => {
    try { scannerControlsRef.current?.stop(); } catch {}
    scannerControlsRef.current = null;
    // Video stream'i de kapat
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setScannerOpen(false);
    setScanning(false);
    setScannerError("");
  };

  // Taranan barkodu işle
  const handleBarcodeScanned = (barcodeValue: string) => {
    const product = products.find((p) => p.barcode === barcodeValue);
    if (!product) {
      showToast(`Barkod bulunamadı: ${barcodeValue}`, "error");
      return;
    }
    // Stoklu batch_item bul
    const item = batchItems.find((i) => i.product_id === product.id && (i.bought - getBatchSoldQtyForItem(i)) > 0);
    setSaleForm((prev) => ({
      ...prev,
      productId: product.id,
      batchId: item?.batch_id || "",  // batch_id kullan, item.id değil
      depo: item?.depo || prev.depo,
    }));
    showToast(`✅ ${product.name} seçildi — adet ve müşteri girin.`, "error");
  };

  // Benzersiz barkod üret
  const generateBarcode = () => {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `RL-${ts}-${rand}`;
  };

  // QR kodlu PDF oluştur ve yazdır (30x30mm, Phomemo M110)
  const printBarcodePDF = async (barcodeValue: string, productName: string, qty: number) => {
    const QRCode = (await import("qrcode")).default;
    const { jsPDF } = await import("jspdf");

    // 30x30mm @ 10px/mm = 300px per etiket
    const pxPerMm = 10;
    const labelPx = 30 * pxPerMm; // 300px

    const doc = new jsPDF({ unit: "mm", format: [30, 30], orientation: "portrait" });

    for (let i = 0; i < qty; i++) {
      if (i > 0) doc.addPage([30, 30]);

      // Canvas ile etiket çiz
      const canvas = document.createElement("canvas");
      canvas.width = labelPx;
      canvas.height = labelPx;
      const ctx = canvas.getContext("2d")!;

      // Beyaz zemin
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, labelPx, labelPx);

      // QR kod üret
      const qrCanvas = document.createElement("canvas");
      await QRCode.toCanvas(qrCanvas, barcodeValue, {
        width: 190, margin: 2,
        errorCorrectionLevel: "H",
        color: { dark: "#000000", light: "#ffffff" },
      });

      // QR'ı ortala — üstte
      const qrSize = 185;
      const qrX = (labelPx - qrSize) / 2;
      const qrY = 18;
      ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

      // Ürün adı — çok satırlı, tüm alanı kullan
      ctx.font = "bold 20px Arial, sans-serif";
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      
      // Kelime kelime satır sar
      const words = productName.split(" ");
      const maxWidth = labelPx - 20;
      const lineHeight = 24;
      const lines: string[] = [];
      let currentLine = "";
      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const textStartY = qrY + qrSize + 22;
      lines.forEach((line, idx) => {
        ctx.fillText(line, labelPx / 2, textStartY + idx * lineHeight);
      });

      // Canvas'ı PDF'e ekle
      const imgData = canvas.toDataURL("image/png", 1.0);
      doc.addImage(imgData, "PNG", 0, 0, 30, 30);
    }

    const pdfBlob = doc.output("blob");
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barkod-${productName.substring(0, 15)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  // Barkod bas butonu handler
  const handleBarcodePrint = async () => {
    if (processing) return;
    setProcessing(true);
    if (!barcodeModal) return;
    const qty = Number(barcodeQty);
    if (!qty || qty <= 0 || qty > 500) return showToast("Geçerli bir adet girin (1-500).", "error");

    const { item, productName, batchName } = barcodeModal;

    // Ürünün barkodunu products tablosundan al
    const product = products.find((p) => p.id === item.product_id);
    let barcodeValue = product?.barcode || "";

    if (!barcodeValue) {
      // Barkod yoksa üret ve products tablosuna kaydet
      barcodeValue = generateBarcode();
      await supabase.from("products").update({ barcode: barcodeValue }).eq("id", item.product_id);
      setProducts((prev) => prev.map((p) => p.id === item.product_id ? { ...p, barcode: barcodeValue } : p));
    }

    if (barcodeMode === "yeni") {
      // Yeni stok girişi: sadece stoğu güncelle (barkod products'ta)
      const { error } = await supabase.from("batch_items")
        .update({ bought: item.bought + qty })
        .eq("id", item.id);
      if (error) return showError(error);
      await logAction("Barkod basıldı (yeni stok)", "batch_items", `${productName} / ${batchName}`, { adet: qty, barcode: barcodeValue });
    } else {
      await logAction("Barkod tekrar basıldı", "batch_items", `${productName} / ${batchName}`, { adet: qty, barcode: barcodeValue });
    }

    await printBarcodePDF(barcodeValue, productName, qty);
    setBarcodeModal(null);
    setBarcodeQty("");
    setBarcodeMode("yeni");
    setProcessing(false);
    loadAll();
  };

  const updateBatchItem = async (itemId: string, patch: Partial<BatchItem>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.batch_id !== undefined) dbPatch.batch_id = patch.batch_id;
    if (patch.bought !== undefined) dbPatch.bought = patch.bought;
    if (patch.buy_price !== undefined) dbPatch.buy_price = patch.buy_price;
    if (patch.sale_price !== undefined) dbPatch.sale_price = patch.sale_price;
    if (patch.depo !== undefined) dbPatch.depo = patch.depo;
    const { error } = await supabase.from("batch_items").update(dbPatch).eq("id", itemId);
    if (error) return showError(error);
    await logAction("Parti ürün satırı değiştirildi", "batch_items", itemId, dbPatch);
    setProcessing(false);
    loadAll();
  };

  const deleteBatchItem = async (item: BatchItem) => {
    const sold = getBatchSoldQtyForItem(item);
    if (sold > 0) return showToast("Bu parti satırına bağlı aktif satış var. Önce ilgili satışları iptal edin.", "info");
    const { error } = await supabase.from("batch_items").delete().eq("id", item.id);
    if (error) return showError(error);
    await logAction("Parti ürün satırı silindi", "batch_items", `${productMap.get(item.product_id)?.name || item.product_id} / ${batchMap.get(item.batch_id)?.name || item.batch_id}`);
    setProcessing(false);
    loadAll();
  };

  const addSaleFromForm = async () => {
    if (saleLoading) return;
    setSaleLoading(true);
    try {
    const customer = customers.find((c) => c.id === saleForm.customerId);
    const product = products.find((p) => p.id === saleForm.productId);
    const qty = Number(saleForm.qty || 0);
    if (!customer || !product || qty <= 0) return showToast("Cari, ürün ve adet zorunlu.", "error");
    
    // Normal satışta fiyat 0 olamaz
    const isZeroType = saleForm.saleType === "İç Kullanım" || saleForm.saleType === "Fire/Bozuk";
    if (!isZeroType && (!saleForm.customSalePrice || Number(saleForm.customSalePrice) <= 0)) {
      return showToast("Normal satışta fiyat 0 olamaz.", "error");
    }
    // Depo bazlı stok kontrolü
    const depoStock = batchItemsForProduct(product.id)
      .filter((i) => i.depo === saleForm.depo)
      .reduce((s, i) => s + Math.max(i.bought - getBatchSoldQtyForItem(i), 0), 0);
    if (depoStock < qty) return showToast(`Yetersiz stok. ${saleForm.depo} deposunda bu üründen sadece ${depoStock} adet var.`, "info");

    let remainingQty = qty;
    const rows: Record<string, unknown>[] = [];

    // Filter by depo and batch if selected - strictly match depo
    const availableItems = batchItemsForProduct(product.id).filter((item) => {
      const matchDepo = saleForm.depo ? item.depo === saleForm.depo : true;
      const matchBatch = !saleForm.batchId || item.batch_id === saleForm.batchId;
      return matchDepo && matchBatch;
    });

    for (const item of availableItems) {
      if (remainingQty <= 0) break;
      const available = Math.max(item.bought - getBatchSoldQtyForItem(item), 0);
      const take = Math.min(available, remainingQty);
      if (take <= 0) continue;
      const isZeroPrice = saleForm.saleType === "İç Kullanım" || saleForm.saleType === "Fire/Bozuk";
      const totalPrice = isZeroPrice ? 0 : Number(saleForm.customSalePrice || 0);
      rows.push({
        customer_id: customer.id,
        product_id: product.id,
        batch_id: item.batch_id,
        batch_item_id: item.id,
        seller: saleForm.seller,
        sale_type: saleForm.saleType,
        qty: take,
        total: totalPrice,
        cost: item.buy_price * take,
        paid: true,
        paid_amount: totalPrice,
        cancelled: false,
      });
      remainingQty -= take;
    }

    if (remainingQty > 0) return showToast("Parti stokları yetersiz.", "error");
    const { data: insertedSales, error } = await supabase.from("sales").insert(rows).select();
    if (error) return showError(error);
    await logAction("Satış eklendi", "sales", `${customer.name} - ${product.name}`, { adet: qty, toplam: rows.reduce((sum, row) => sum + Number(row.total || 0), 0), satir_sayisi: rows.length });

    // Peşin satışlarda otomatik ödeme kaydı oluştur
    if (insertedSales && insertedSales.length > 0) {
      const totalPaid = rows.reduce((sum, row) => sum + Number(row.total || 0), 0);
      if (totalPaid > 0) {
        const { data: userData } = await supabase.auth.getUser();
        const { error: payErr } = await supabase.from("payments").insert({
          customer_id: customer.id,
          amount: totalPaid,
          user_email: userData.user?.email || null,
          note: `Peşin satış - ${product.name}`,
        });
        if (payErr) return showError(payErr);
      }
    }

    try { await allocatePaymentsForCustomer(customer.id); } catch (err) { return showError(err); }
    setSaleForm((prev) => ({ customerId: "", productId: "", batchId: "", qty: "1", seller: prev.seller, saleType: "Normal satış", customSalePrice: "", depo: prev.depo }));
    showToast("Satış kaydedildi.", "success");
    setProcessing(false);
    loadAll();
    } finally {
      setSaleLoading(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    const { error } = await supabase.from("sales").update({ cancelled: true }).eq("id", saleId);
    if (error) return showError(error);
    if (sale) {
      try {
        await allocatePaymentsForCustomer(sale.customer_id);
      } catch (err) {
        return showError(err);
      }
    }
    await logAction("Satış iptal edildi", "sales", sale ? `${customerMap.get(sale.customer_id)?.name || sale.customer_id} - ${productMap.get(sale.product_id)?.name || sale.product_id}` : saleId, { tutar: sale?.total || 0 });
    showToast("Satış iptal edildi. Kayıt silinmez, iptal olarak saklanır.", "success");
    setProcessing(false);
    loadAll();
  };

  const updateSale = async (saleId: string, patch: Partial<Sale>) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.seller !== undefined) dbPatch.seller = patch.seller;
    if (patch.sale_type !== undefined) dbPatch.sale_type = patch.sale_type;
    if (patch.paid !== undefined) {
      dbPatch.paid = patch.paid;
      // paid=false yapılınca paid_amount sıfırla, paid=true yapılınca total'e eşitle
      const sale = sales.find((s) => s.id === saleId);
      const total = patch.total !== undefined ? Number(patch.total) : (sale?.total ?? 0);
      dbPatch.paid_amount = patch.paid ? total : 0;
    }
    if (patch.qty !== undefined) dbPatch.qty = patch.qty;
    if (patch.total !== undefined) dbPatch.total = patch.total;
    if (patch.cost !== undefined) dbPatch.cost = patch.cost;
    const { error } = await supabase.from("sales").update(dbPatch).eq("id", saleId);
    if (error) return showError(error);
    const updatedSale = sales.find((sale) => sale.id === saleId);
    if (updatedSale && patch.paid !== undefined) {
      try {
        await allocatePaymentsForCustomer(updatedSale.customer_id);
      } catch (err) {
        return showError(err);
      }
    }
    await logAction("Satış değiştirildi", "sales", saleId, dbPatch);
    setProcessing(false);
    loadAll();
  };

  const startSaleEdit = (sale: Sale) => {
    setSaleDrafts((prev) => ({
      ...prev,
      [sale.id]: { qty: String(sale.qty), total: String(sale.total), cost: String(sale.cost), seller: sale.seller, sale_type: sale.sale_type, paid: sale.paid },
    }));
    setEditingSaleId(sale.id);
  };

  const saveSaleEdit = async (saleId: string) => {
    const draft = saleDrafts[saleId];
    if (!draft) return;
    await updateSale(saleId, {
      qty: Number(draft.qty || 0),
      total: Number(draft.total || 0),
      cost: Number(draft.cost || 0),
      seller: draft.seller,
      sale_type: draft.sale_type,
      paid: draft.paid,
    });
    setEditingSaleId(null);
    const next = { ...saleDrafts };
    delete next[saleId];
    setSaleDrafts(next);
  };

  const cancelSaleEdit = (saleId: string) => {
    setEditingSaleId(null);
    const next = { ...saleDrafts };
    delete next[saleId];
    setSaleDrafts(next);
  };

  const getSalePaidAmount = (sale: Sale) => {
    if (sale.paid) return toNum(sale.total);
    return Math.min(toNum(sale.total), Math.max(toNum(sale.paid_amount), 0));
  };

  const getSaleStatus = (sale: Sale) => {
    if (sale.paid) return "Peşin";
    const paidAmount = getSalePaidAmount(sale);
    if (paidAmount >= toNum(sale.total)) return "Ödendi";
    if (paidAmount > 0) return `Kısmi (${money(paidAmount)})`;
    return "Cari borç";
  };

  const allocatePaymentsForCustomer = async (customerId: string) => {
    const [salesRes, paymentsRes] = await Promise.all([
      supabase
        .from("sales")
        .select("id,total,paid,paid_amount,cancelled,created_at")
        .eq("customer_id", customerId)
        .eq("cancelled", false)
        .order("created_at", { ascending: true }),
      supabase
        .from("payments")
        .select("id,amount,cancelled,created_at")
        .eq("customer_id", customerId)
        .order("created_at", { ascending: true }),
    ]);

    if (salesRes.error) throw salesRes.error;
    if (paymentsRes.error) throw paymentsRes.error;

    const activePays = (paymentsRes.data || []).filter((p) => !p.cancelled);
    const salesToAlloc = (salesRes.data || []);

    // Her satış için paid_amount hesapla (mevcut mantık)
    let remainingManualPayments = activePays.reduce((sum, p) => sum + toNum(p.amount), 0);
    const saleUpdates = salesToAlloc.map((sale) => {
      const total = toNum(sale.total);
      let paidAmount = 0;
      if (sale.paid) {
        paidAmount = total;
      } else {
        paidAmount = Math.max(0, Math.min(total, remainingManualPayments));
        remainingManualPayments -= paidAmount;
      }
      return { id: sale.id, total, paidAmount, paid: !!sale.paid };
    });

    // payment_allocations: önce bu müşterinin mevcut allocation'larını sil
    await supabase.from("payment_allocations").delete().in(
      "payment_id",
      activePays.map((p) => p.id)
    );

    // Her ödemeyi satışlara dağıt — tarih sırasıyla
    const allocations: { payment_id: string; sale_id: string; amount: number; created_at: string }[] = [];
    const saleRemaining: Record<string, number> = {};
    saleUpdates.forEach((s) => { saleRemaining[s.id] = s.paidAmount; });

    // Satışları sırayla doldur, her ödeme sıradaki satışa gider
    let saleQueue = [...saleUpdates];
    for (const pay of activePays) {
      let payRemaining = toNum(pay.amount);
      for (const sale of saleQueue) {
        if (payRemaining <= 0) break;
        const alreadyAllocated = allocations
          .filter((a) => a.sale_id === sale.id)
          .reduce((s, a) => s + a.amount, 0);
        const remaining = sale.paidAmount - alreadyAllocated;
        const thisAlloc = Math.min(payRemaining, Math.max(remaining, 0));
        if (thisAlloc > 0) {
          allocations.push({ payment_id: pay.id, sale_id: sale.id, amount: thisAlloc, created_at: pay.created_at });
          payRemaining -= thisAlloc;
        }
      }
    }

    // Toplu insert
    if (allocations.length > 0) {
      await supabase.from("payment_allocations").insert(allocations);
    }

    // sales tablosunu güncelle
    const results = await Promise.all(
      saleUpdates.map((s) => supabase.from("sales").update({ paid_amount: s.paidAmount }).eq("id", s.id))
    );
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) throw firstError;
  };

  const addCustomerPayment = async (customerId: string) => {
    if (processing) return;
    setProcessing(true);
    const amount = Number(paymentInputs[customerId] || 0);
    if (!amount || amount <= 0) return;
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData.user?.email || null;
    const { error } = await supabase.from("payments").insert({ customer_id: customerId, amount, user_email: userEmail });
    if (error) return showError(error);
    try {
      await allocatePaymentsForCustomer(customerId);
    } catch (err) {
      return showError(err);
    }
    await logAction("Ödeme eklendi", "payments", customerMap.get(customerId)?.name || customerId, { tutar: amount });
    setPaymentInputs({ ...paymentInputs, [customerId]: "" });
    setProcessing(false);
    loadAll();
  };

  const updatePayment = async (paymentId: string, newAmount: number, customerId: string) => {
    if (!newAmount || newAmount <= 0) return showToast("Tutar 0'dan büyük olmalı.", "error");
    const { error } = await supabase.from("payments").update({ amount: newAmount }).eq("id", paymentId);
    if (error) return showError(error);
    try { await allocatePaymentsForCustomer(customerId); } catch (err) { return showError(err); }
    await logAction("Ödeme güncellendi", "payments", customerMap.get(customerId)?.name || customerId, { tutar: newAmount });
    setEditingPaymentId(null);
    setEditingPaymentAmount("");
    setProcessing(false);
    loadAll();
  };

  const deletePayment = async (paymentId: string, customerId: string, amount: number) => {
    if (!confirm(`${money(amount)} tutarındaki ödeme silinecek. Emin misiniz?`)) return;
    const { error } = await supabase.from("payments").delete().eq("id", paymentId);
    if (error) return showError(error);
    try { await allocatePaymentsForCustomer(customerId); } catch (err) { return showError(err); }
    await logAction("Ödeme silindi", "payments", customerMap.get(customerId)?.name || customerId, { tutar: amount });
    setProcessing(false);
    loadAll();
  };

  const savePreorder = async () => {
    if (!preorderForm.customerId) return showToast("Cari seçin.", "info");
    const validItems = preorderForm.items.filter((i) => i.productId && Number(i.qty) > 0);
    if (!validItems.length) return showToast("En az bir ürün ekleyin.", "info");
    const customer = customers.find((c) => c.id === preorderForm.customerId);
    if (editingPreorderId) {
      const { error } = await supabase.from("preorders").update({ customer_id: preorderForm.customerId, note: preorderForm.note }).eq("id", editingPreorderId);
      if (error) return showError(error);
      await supabase.from("preorder_items").delete().eq("preorder_id", editingPreorderId);
      const { error: itemErr } = await supabase.from("preorder_items").insert(validItems.map((i) => ({ preorder_id: editingPreorderId, product_id: i.productId, qty: Number(i.qty) })));
      if (itemErr) return showError(itemErr);
      await logAction("Ön sipariş güncellendi", "preorders", customer?.name || "", { items: validItems.length });
      setEditingPreorderId(null);
    } else {
      const { data: newPO, error } = await supabase.from("preorders").insert({ customer_id: preorderForm.customerId, note: preorderForm.note, created_by: currentUserEmail, status: "bekliyor" }).select().single();
      if (error || !newPO) return showError(error);
      const { error: itemErr } = await supabase.from("preorder_items").insert(validItems.map((i) => ({ preorder_id: newPO.id, product_id: i.productId, qty: Number(i.qty) })));
      if (itemErr) return showError(itemErr);
      await logAction("Ön sipariş oluşturuldu", "preorders", customer?.name || "", { items: validItems.length, oluşturan: currentUserEmail });
    }
    setPreorderForm({ customerId: "", note: "", items: [{ productId: "", qty: "1" }] });
    setProcessing(false);
    loadAll();
  };

  const deletePreorder = async (id: string) => {
    const po = preorders.find((p) => p.id === id);
    if (!confirm("Bu ön sipariş silinecek. Emin misiniz?")) return;
    await supabase.from("preorder_items").delete().eq("preorder_id", id);
    const { error } = await supabase.from("preorders").delete().eq("id", id);
    if (error) return showError(error);
    await logAction("Ön sipariş silindi", "preorders", customerMap.get(po?.customer_id || "")?.name || "");
    setProcessing(false);
    loadAll();
  };

  const startEditPreorder = (po: Preorder) => {
    const items = preorderItems.filter((i) => i.preorder_id === po.id);
    setPreorderForm({ customerId: po.customer_id, note: po.note || "", items: items.map((i) => ({ productId: i.product_id, qty: String(i.qty) })) });
    setEditingPreorderId(po.id);
    setActive("preorders");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openConvertModal = (po: Preorder, item: PreorderItem) => {
    setConvertPrices({ [item.id]: "" });
    setConvertPaid("false");
    setConvertModal({ preorder: po, item });
  };

  const convertToSales = async () => {
    if (!convertModal) return;
    const { preorder: po, item } = convertModal;
    const price = Number(convertPrices[item.id] || 0);
    if (!price) return showToast("Fiyat girin.", "error");
    const product = productMap.get(item.product_id);
    if (!product) return;
    const userDepo = currentUserEmail.includes("harun") ? "Türkiş-salon" : "56salon";
    const otherDepo = userDepo === "56salon" ? "Türkiş-salon" : "56salon";
    const userDepoStock = batchItemsForProduct(product.id).filter((bi) => bi.depo === userDepo).reduce((s, bi) => s + Math.max(bi.bought - getBatchSoldQtyForItem(bi), 0), 0);
    const depo = userDepoStock >= item.qty ? userDepo : otherDepo;
    const seller: Seller = depo === "56salon" ? "Rabia" : "Harun";
    const depoBatchItems = batchItemsForProduct(product.id).filter((bi) => bi.depo === depo && Math.max(bi.bought - getBatchSoldQtyForItem(bi), 0) > 0);
    if (!depoBatchItems.length) return showToast(`${product.name} için yeterli stok yok (${depo}).`, "error");
    const batchItem = depoBatchItems[0];
    const { error } = await supabase.from("sales").insert({ customer_id: po.customer_id, product_id: product.id, batch_item_id: batchItem.id, qty: item.qty, total: price * item.qty, cost: batchItem.buy_price * item.qty, seller, sale_type: "Normal satış", paid: true, paid_amount: price * item.qty, depo, user_email: currentUserEmail });
    if (error) return showError(error);
    // Bu item'ı sil
    await supabase.from("preorder_items").delete().eq("id", item.id);
    // Kalan item var mı kontrol et, yoksa ön siparişi tamamlandı yap
    const remaining = preorderItems.filter((i) => i.preorder_id === po.id && i.id !== item.id);
    if (remaining.length === 0) {
      await supabase.from("preorders").update({ status: "tamamlandı" }).eq("id", po.id);
    }
    await allocatePaymentsForCustomer(po.customer_id);
    await logAction("Ön sipariş satır satışa dönüştürüldü", "preorders", customerMap.get(po.customer_id)?.name || "", { ürün: product.name, adet: item.qty });
    setConvertModal(null);
    showToast("", "info");
    setProcessing(false);
    loadAll();
  };

  const markPayment = async (customerId: string) => {
    const balance = getCustomerBalance(customerId);
    if (balance <= 0) return;
    const { data: userData } = await supabase.auth.getUser();
    const userEmail = userData.user?.email || null;
    const { error } = await supabase.from("payments").insert({ customer_id: customerId, amount: balance, user_email: userEmail });
    if (error) return showError(error);
    try {
      await allocatePaymentsForCustomer(customerId);
    } catch (err) {
      return showError(err);
    }
    await logAction("Tamamı ödendi", "payments", customerMap.get(customerId)?.name || customerId, { tutar: balance });
    setPaymentInputs({ ...paymentInputs, [customerId]: "" });
    setProcessing(false);
    loadAll();
  };

  const updatePartner = async (id: string, field: keyof PartnerRow, value: number | string) => {
    const partner = partners.find((p) => p.id === id);
    const { error } = await supabase.from("partner_ledger").update({ [field]: value }).eq("id", id);
    if (error) return showError(error);
    await logAction("Ortaklık kaydı değiştirildi", "partner_ledger", partner?.partner_name || id, { alan: field, deger: value });
    setProcessing(false);
    loadAll();
  };

  const applyPeriodOpening = async () => {
    const productCost = Number(periodForm.productCost || 0);
    const shippingCost = Number(periodForm.shippingCost || 0);
    const sponsor = Number(periodForm.sponsor || 0);
    const rabiaContribution = Number(periodForm.rabia || 0);
    const harunContribution = Number(periodForm.harun || 0);
    const eachResponsibility = productCost / 2 + shippingCost / 2;

    const { error: periodError } = await supabase.from("periods").insert({
      name: periodForm.name || `Dönem ${today()}`,
      sponsor_contribution: sponsor,
      rabia_contribution: rabiaContribution,
      harun_contribution: harunContribution,
      product_cost: productCost,
      shipping_cost: shippingCost,
      closed: false,
    });
    if (periodError) return showError(periodError);

    const kasaAltiPartner = partners.find((p) => p.partner_name === "56Kasa");
    const rabia = partners.find((p) => p.partner_name === "Rabia");
    const harun = partners.find((p) => p.partner_name === "Harun");

    const updates = [];
    if (kasaAltiPartner) updates.push(supabase.from("partner_ledger").update({ contribution: kasaAltiPartner.contribution + sponsor, receivable: kasaAltiPartner.receivable + sponsor }).eq("id", kasaAltiPartner.id));
    if (rabia) updates.push(supabase.from("partner_ledger").update({ contribution: rabia.contribution + rabiaContribution, debt: Math.max(rabia.debt + eachResponsibility - rabiaContribution, 0) }).eq("id", rabia.id));
    if (harun) updates.push(supabase.from("partner_ledger").update({ contribution: harun.contribution + harunContribution, debt: Math.max(harun.debt + eachResponsibility - harunContribution, 0) }).eq("id", harun.id));
    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) return showError(firstError);
    await logAction("Dönem açıldı", "periods", periodForm.name || `Dönem ${today()}`, { sponsor, rabiaContribution, harunContribution, productCost, shippingCost });
    showToast("Yeni dönem açılışı ve katkılar işlendi.", "info");
    setProcessing(false);
    loadAll();
  };

  const closePeriod = async () => {
    const distributableCash = Number(totals.cash || 0);
    if (distributableCash <= 0) {
      showToast("Kasada dağıtılacak para yok.", "error");
      return;
    }

    const half = distributableCash / 2;
    const closedAt = new Date().toISOString();
    const rabia = partners.find((p) => p.partner_name === "Rabia");
    const harun = partners.find((p) => p.partner_name === "Harun");
    const updates = [];

    if (rabia) updates.push(supabase.from("partner_ledger").update({ debt: Math.max(rabia.debt - half, 0), profit_share: rabia.profit_share + half }).eq("id", rabia.id));
    if (harun) updates.push(supabase.from("partner_ledger").update({ debt: Math.max(harun.debt - half, 0), profit_share: harun.profit_share + half }).eq("id", harun.id));

    const openPeriod = periods.find((p) => !p.closed);
    const periodPayload = {
      closed: true,
      closed_at: closedAt,
      closing_cash: distributableCash,
      rabia_distribution: half,
      harun_distribution: half,
      donem_kari: Math.round(anlıkKar * 100) / 100,
    };

    if (openPeriod) {
      updates.push(supabase.from("periods").update(periodPayload).eq("id", openPeriod.id));
    } else {
      updates.push(
        supabase.from("periods").insert({
          name: `Kapanış ${today()}`,
          sponsor_contribution: 0,
          rabia_contribution: 0,
          harun_contribution: 0,
          product_cost: 0,
          shipping_cost: 0,
          ...periodPayload,
        })
      );
    }

    const results = await Promise.all(updates);
    const firstError = results.find((r) => r.error)?.error;
    if (firstError) return showError(firstError);
    await logAction("Dönem kapatıldı", "periods", openPeriod?.name || `Kapanış ${today()}`, { dagitilan_kasa: distributableCash, rabia_payi: half, harun_payi: half });
    showToast(`Dönem kapatıldı; ${money(distributableCash)} kasa Rabia ve Harun arasında %50/%50 dağıtıldı.`, "info");
    setProcessing(false);
    loadAll();
  };

  const openProductDetail = (product: Product) => {
    const nextId = expandedProductId === product.id ? null : product.id;
    setExpandedProductId(nextId);
    setEditingProductId(null);
  };

  const startProductEdit = (product: Product) => {
    setProductDrafts({
      ...productDrafts,
      [product.id]: {
        name: product.name,
        image_url: product.image_url,
      },
    });
    setEditingProductId(product.id);
  };

  const cancelProductEdit = (productId: string) => {
    const next = { ...productDrafts };
    delete next[productId];
    setProductDrafts(next);
    setEditingProductId(null);
  };

  const saveProductEdit = async (productId: string) => {
    if (processing) return;
    setProcessing(true);
    const draft = productDrafts[productId] || {};
    const product = products.find((p) => p.id === productId);

    // Read image from ref (most reliable) or fall back to draft/existing
    let imageUrl: string | null = pendingImageRef.current[productId] || (draft.image_url as string | undefined) || product?.image_url || null;

    if (imageUrl && imageUrl.startsWith("data:")) {
      showToast("Resim yükleniyor...", "info");
      imageUrl = await uploadImageToStorage(imageUrl, product?.code || productId);
      delete pendingImageRef.current[productId];
    }

    await updateProduct(productId, {
      name: String(draft.name || product?.name || "").trim(),
      image_url: imageUrl,
    });
    cancelProductEdit(productId);
  };

  const openCustomerDetail = (customer: Customer) => {
    const nextId = expandedCustomerId === customer.id ? null : customer.id;
    setExpandedCustomerId(nextId);
    setEditingCustomerId(null);
  };

  const startCustomerEdit = (customer: Customer) => {
    setCustomerDrafts({
      ...customerDrafts,
      [customer.id]: {
        name: customer.name,
        passive: customer.passive,
      },
    });
    setEditingCustomerId(customer.id);
  };

  const cancelCustomerEdit = (customerId: string) => {
    const next = { ...customerDrafts };
    delete next[customerId];
    setCustomerDrafts(next);
    setEditingCustomerId(null);
  };

  const saveCustomerEdit = async (customerId: string) => {
    if (processing) return;
    setProcessing(true);
    const draft = customerDrafts[customerId] || {};
    const name = String(draft.name || "").trim();
    if (!name || name.length > 50) {
      showToast("Cari adı zorunlu ve en fazla 50 karakter olmalı.", "error");
      return;
    }
    const oldName = customers.find((c) => c.id === customerId)?.name || customerId;
    const { error } = await supabase
      .from("customers")
      .update({ name, passive: Boolean(draft.passive) })
      .eq("id", customerId);
    if (error) return showError(error);
    await logAction("Cari değiştirildi", "customers", oldName, { yeni_ad: name, passive: Boolean(draft.passive) });
    cancelCustomerEdit(customerId);
    setProcessing(false);
    loadAll();
  };

  const subMenuItems: [string, string][] = [
    ["preorders", "Ön Siparişler"],
    ["batchEntry", "Parti/Ürün Girişi"],
    ["partners", "Parti Maliyet Kaydı"],
    ["period", "Dönem Kapanışı"],
    ["admin", "Kullanıcı Yönetimi"],
    ["audit", "İşlem Geçmişi"],
  ];

  const mainMenuItems: [string, string][] = [
    ["dashboard", "Özet Tablo"],
    ["products", "Ürünler"],
    ["customers", "Müşteriler"],
    ["sales", "Satışlar"],
  ];

  const allMenuItems: [string, string][] = [
    ...mainMenuItems,
    ...subMenuItems,
    ["gallery", "Toplu Ürün Resimleri"],
  ];

  const menu = mainMenuItems.filter(([key]) => {
    if (currentUserRole === "admin" || currentUserRole === "ortak") return true;
    return ["sales"].includes(key);
  });

  const subMenu = subMenuItems.filter(([key]) => {
    if (currentUserRole === "admin") return true;
    if (currentUserRole === "ortak") return key !== "admin";
    return ["preorders"].includes(key);
  });

  const filteredProducts = sortedProducts.filter((p) => `${p.name} ${p.code}`.toLowerCase().includes(search.toLowerCase()));

  const handleSalesSort = (col: string) => setSalesSort((s) => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
  const salesSortArr = (col: string) => salesSort.col === col ? (salesSort.dir === "asc" ? " ▲" : " ▼") : " ↕";
  const sortedSales = [...activeSales].filter((sale) => {
    if (saleStatusFilter === "Tümü") return true;
    const status = getSaleStatus(sale);
    if (typeof status === "string") return status === saleStatusFilter;
    return false;
  }).sort((a, b) => {
    let av: string|number = "", bv: string|number = "";
    if (salesSort.col === "created_at") { av = a.created_at||""; bv = b.created_at||""; }
    else if (salesSort.col === "customer") { av = customerMap.get(a.customer_id)?.name||""; bv = customerMap.get(b.customer_id)?.name||""; }
    else if (salesSort.col === "product") { av = productMap.get(a.product_id)?.name||""; bv = productMap.get(b.product_id)?.name||""; }
    else if (salesSort.col === "batch") { av = batchMap.get(a.batch_id)?.name||""; bv = batchMap.get(b.batch_id)?.name||""; }
    else if (salesSort.col === "seller") { av = a.seller||""; bv = b.seller||""; }
    else if (salesSort.col === "sale_type") { av = a.sale_type||""; bv = b.sale_type||""; }
    else if (salesSort.col === "qty") { av = a.qty; bv = b.qty; }
    else if (salesSort.col === "total") { av = a.total; bv = b.total; }
    else if (salesSort.col === "cost") { av = a.cost; bv = b.cost; }
    else if (salesSort.col === "profit") { av = a.total-a.cost; bv = b.total-b.cost; }
    else if (salesSort.col === "status") { av = getSaleStatus(a) as string||""; bv = getSaleStatus(b) as string||""; }
    const cmp = typeof av === "number" ? av-(bv as number) : String(av).localeCompare(String(bv),"tr");
    return salesSort.dir === "asc" ? cmp : -cmp;
  });
  const salesTh = (col: string, label: string) => (
    <button type="button" onClick={() => handleSalesSort(col)} style={{fontWeight:700,background:"none",border:"none",cursor:"pointer",padding:0,whiteSpace:"nowrap"}}>{label}{salesSortArr(col)}</button>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Lightbox */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{position:"fixed",inset:0,zIndex:999999,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"zoom-out"}}
        >
          <img src={lightboxImg} alt="Tam ekran" style={{maxWidth:"95vw",maxHeight:"92vh",borderRadius:12,objectFit:"contain",boxShadow:"0 8px 40px rgba(0,0,0,0.5)"}} onClick={(e) => e.stopPropagation()} />
          <button onClick={() => setLightboxImg(null)} style={{position:"absolute",top:16,right:16,background:"white",border:"none",borderRadius:"50%",width:36,height:36,fontSize:20,lineHeight:1,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>✕</button>
        </div>
      )}

      {/* Split Depo Modal */}
      {splitModal && (() => {
        const { item, newDepo } = splitModal;
        const kalan = item.bought - getBatchSoldQtyForItem(item);
        const mevcutDepo = item.depo || "Belirsiz";
        const qty = Math.min(Math.max(Number(splitQty)||1, 1), kalan);
        const kalanDiger = kalan - qty;
        const handleSplit = async () => {
          if (qty >= kalan) {
            // Tümü yeni depoya — sadece depo güncelle
            await updateBatchItem(item.id, { depo: newDepo });
          } else {
            // Mevcut satırın bought'unu kalan - qty kadar azalt (satılanlar korunur)
            const yeniBought = item.bought - qty;
            await updateBatchItem(item.id, { bought: yeniBought });
            // Yeni satır: sadece taşınan kadar, satış yok
            await supabase.from("batch_items").insert({
              product_id: item.product_id,
              batch_id: item.batch_id,
              bought: qty,
              buy_price: item.buy_price,
              sale_price: item.sale_price,
              depo: newDepo,
            });
            setProcessing(false);
    loadAll();
          }
          setSplitModal(null);
          setSplitQty("");
        };
        return (
          <div onClick={() => setSplitModal(null)} style={{position:"fixed",inset:0,zIndex:999998,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div onClick={(e) => e.stopPropagation()} style={{background:"white",borderRadius:18,width:"100%",maxWidth:400,padding:24,boxShadow:"0 8px 40px rgba(0,0,0,0.3)"}}>
              <div style={{fontWeight:700,fontSize:"1rem",marginBottom:8}}>{productMap.get(item.product_id)?.name} — {batchMap.get(item.batch_id)?.name}</div>
              <div style={{fontSize:"0.875rem",color:"#64748b",marginBottom:16}}>
                Stokta <b>{kalan}</b> adet var. Kaçını <b>{newDepo}</b>'ya taşımak istiyorsunuz?
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                <input className="input" type="number" min="1" max={kalan} value={splitQty} onChange={(e) => setSplitQty(e.target.value)} style={{width:100,textAlign:"center",fontSize:"1.25rem",fontWeight:700}} />
                <div style={{fontSize:"0.8rem",color:"#64748b"}}>
                  <div>{newDepo}: <b>{qty}</b> adet</div>
                  {kalanDiger > 0 && <div>{mevcutDepo}: <b>{kalanDiger}</b> adet kalır</div>}
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button type="button" className="btn" onClick={handleSplit}>Taşı</button>
                <button type="button" className="btn-secondary" onClick={() => setSplitModal(null)}>İptal</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sales Detail Modal */}
      {salesModalProductId && (() => {
        const product = products.find((p) => p.id === salesModalProductId);
        const productSales = activeSales.filter((s) => s.product_id === salesModalProductId);
        return (
          <div onClick={() => setSalesModalProductId(null)} style={{position:"fixed",inset:0,zIndex:999998,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
            <div onClick={(e) => e.stopPropagation()} style={{background:"white",borderRadius:18,width:"100%",maxWidth:560,maxHeight:"80vh",overflow:"auto",boxShadow:"0 8px 40px rgba(0,0,0,0.3)"}}>
              <div style={{padding:"18px 20px 12px",borderBottom:"1.5px solid #f1f5f9",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:"1rem",color:"#0f172a"}}>{product?.name}</div>
                  <div style={{fontSize:"0.75rem",color:"#94a3b8",marginTop:2}}>Satış Detayları</div>
                </div>
                <button onClick={() => setSalesModalProductId(null)} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:"#64748b",lineHeight:1}}>✕</button>
              </div>
              <div style={{padding:"0 0 8px"}}>
                {productSales.length === 0 ? (
                  <div style={{padding:24,textAlign:"center",color:"#94a3b8",fontSize:"0.875rem"}}>Satış kaydı yok.</div>
                ) : (
                  <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8125rem"}}>
                    <thead>
                      <tr style={{background:"#f8fafc"}}>
                        <th style={{padding:"10px 16px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.04em"}}>Parti</th>
                        <th style={{padding:"10px 16px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.04em"}}>Cari</th>
                        <th style={{padding:"10px 16px",textAlign:"center",fontWeight:700,color:"#64748b",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.04em"}}>Adet</th>
                        <th style={{padding:"10px 16px",textAlign:"right",fontWeight:700,color:"#64748b",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.04em"}}>Tutar</th>
                        <th style={{padding:"10px 16px",textAlign:"left",fontWeight:700,color:"#64748b",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.04em"}}>Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {productSales.map((sale) => (
                        <tr key={sale.id} style={{borderTop:"1px solid #f1f5f9"}}>
                          <td style={{padding:"10px 16px",color:"#334155",fontWeight:600}}>{batchMap.get(sale.batch_id)?.name || "-"}</td>
                          <td style={{padding:"10px 16px",color:"#0f172a"}}>{customerMap.get(sale.customer_id)?.name || "-"}</td>
                          <td style={{padding:"10px 16px",textAlign:"center",color:"#334155"}}>{sale.qty}</td>
                          <td style={{padding:"10px 16px",textAlign:"right",color:"#334155"}}>{money(sale.total)}</td>
                          <td style={{padding:"10px 16px",color:"#94a3b8",fontSize:"0.75rem"}}>{toTR(sale.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        );
      })()}
      <aside className="fixed left-0 top-0 hidden h-full w-72 border-r bg-white p-5 lg:block">
        <div className="mb-8">
          <h1 className="text-lg font-bold">Ticari Takip</h1>
          <p className="text-xs text-slate-500">Supabase bağlı sürüm</p>
          {currentUserEmail && (
            <div className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700">
              👤 {currentUserName}
            </div>
          )}
        </div>
        <nav className="space-y-2">
          {menu.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setActive(key)} className={`w-full rounded-xl px-4 py-3 text-left ${active === key ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>
              {label}
            </button>
          ))}
          {subMenu.length > 0 && (
            <div>
              <button type="button" onClick={() => setSubMenuOpen((v) => !v)} className={`w-full rounded-xl px-4 py-3 text-left flex items-center justify-between ${subMenu.some(([k]) => k === active) ? "bg-slate-900 text-white" : "hover:bg-slate-100"}`}>
                <span>Alt İşlemler</span>
                <span>{subMenuOpen ? "▲" : "▼"}</span>
              </button>
              {subMenuOpen && (
                <div className="ml-3 mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
                  {subMenu.map(([key, label]) => (
                    <button key={key} type="button" onClick={() => { setActive(key); setSubMenuOpen(false); }} className={`w-full rounded-xl px-3 py-2 text-left text-sm ${active === key ? "bg-slate-800 text-white" : "hover:bg-slate-100"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button type="button" onClick={onLogout} className="w-full rounded-xl px-4 py-3 text-left text-red-600 hover:bg-red-50 font-semibold">
            Çıkış
          </button>
        </nav>
      </aside>

      <section className="p-5 lg:ml-72 lg:p-8">
        {/* Scroll to top button - top right */}
        <div style={{position:"fixed", right:"16px", top:"16px", zIndex:99999}}>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-xl border-2 border-slate-400 bg-white px-4 py-2 text-sm font-bold text-black shadow-2xl">
            ↑ En Üste
          </button>
        </div>

        {loadingData && (
          <div style={{position:"fixed",top:0,left:0,right:0,height:3,zIndex:99998,background:"linear-gradient(90deg,#0f172a 0%,#64748b 50%,#0f172a 100%)",backgroundSize:"200% 100%",animation:"loadbar 1.2s linear infinite"}} />
        )}

        {message ? (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border bg-white p-3 text-sm shadow-sm">
            <span>{message}</span>
            <button type="button" className="btn-secondary" onClick={() => showToast("")}>Kapat</button>
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 pr-28">
          <div>
            <h2 className="text-3xl font-bold">{menu.find((m) => m[0] === active)?.[1]}</h2>
            <p className="text-slate-500">Ürün satış, cari, stok ve dönem bazlı ortaklık takibi</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-2 lg:hidden">
          {currentUserEmail && (
            <div className="col-span-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 text-center">
              👤 {currentUserName}
            </div>
          )}
          {menu.map(([key, label]) => (
            <button key={key} type="button" onClick={() => setActive(key)} className={`rounded-xl px-3 py-2 ${active === key ? "bg-slate-900 text-white" : "bg-white"}`}>
              {label}
            </button>
          ))}
          {subMenu.length > 0 && (
            <button type="button" onClick={() => setSubMenuOpen((v) => !v)} className={`rounded-xl px-3 py-2 col-span-2 ${subMenu.some(([k]) => k === active) ? "bg-slate-900 text-white" : "bg-white"}`}>
              Alt İşlemler {subMenuOpen ? "▲" : "▼"}
            </button>
          )}
          {subMenuOpen && subMenu.map(([key, label]) => (
            <button key={key} type="button" onClick={() => { setActive(key); setSubMenuOpen(false); }} className={`rounded-xl px-3 py-2 text-sm ${active === key ? "bg-slate-800 text-white" : "bg-slate-50"}`}>
              {label}
            </button>
          ))}
          <button type="button" onClick={onLogout} className="rounded-xl px-3 py-2 bg-white text-red-600 font-semibold col-span-1">
            Çıkış
          </button>
          <button type="button" onClick={() => { setScannerOpen(true); setTimeout(startScanner, 300); }} className="rounded-xl px-3 py-2 bg-blue-50 text-blue-600 font-semibold col-span-1">
            📷 QR Tara
          </button>
        </div>

        {active === "dashboard" && (
          <div className="space-y-4">
            <div className="stat-grid">
              <StatCard title="Toplam Satış" value={money(activeSales.reduce((s,sale) => s + toNum(sale.total), 0))} note="Aktif satış toplamı" />
              <div onClick={() => setShowTahsilatDetay(true)} style={{cursor:"pointer"}}>
                <StatCard title="Dönem Tahsilatları" value={money(totals.grossCash)} note="Detay için tıklayın ↗" />
              </div>
              <div onClick={() => setShowKarDetay(true)} style={{cursor:"pointer"}}>
                <StatCard title="Dönem Net Karı" value={money(anlıkKar)} note="Detay için tıklayın ↗" />
              </div>
              <StatCard title="Mevcut Stok" value={totals.totalStock} />
            </div>
            <Card title="Son Hareketler">
              <Table
                headers={["Tarih", "Tür", "Cari", "Detay", "Tutar", "Kim"]}
                rows={recentMovements.map((movement) => [
                  toTR(movement.date, true),
                  movement.type,
                  movement.customer,
                  movement.detail,
                  money(movement.amount),
                  movement.user,
                ])}
              />
            </Card>
          </div>
        )}


        {active === "recent" && (
          <div className="space-y-4">
            <Card title="Son Hareketler">
              <Table
                headers={["Tarih", "Tür", "Cari", "Detay", "Tutar", "Kim"]}
                rows={recentMovements.map((movement) => [
                  toTR(movement.date, true),
                  movement.type,
                  movement.customer,
                  movement.detail,
                  money(movement.amount),
                  movement.user,
                ])}
              />
            </Card>
          </div>
        )}

        {active === "audit" && (
          <AuditSection supabase={supabase} />
        )}

        {active === "admin" && currentUserRole === "admin" && (
          <div className="space-y-4">
            <Card title="Kullanıcı Yönetimi">
              {userMessage && <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{userMessage}</div>}
              <Table
                headers={["İsim", "Email", "Rol", "Durum", "İşlem"]}
                rows={appUsers.map((u) => [
                  u.name,
                  u.email,
                  u.role === "admin" ? "Admin" : u.role === "ortak" ? "Ortak" : "Satıcı",
                  u.active ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Aktif</span> : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Pasif</span>,
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={async () => {
                      await supabase.from("app_users").update({ active: !u.active }).eq("id", u.id);
                      setAppUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, active: !u.active } : x));
                      setUserMessage(`${u.name} ${u.active ? "pasife alındı" : "aktife alındı"}.`);
                      setTimeout(() => setUserMessage(""), 3000);
                    }}>{u.active ? "Pasife Al" : "Aktife Al"}</button>
                    <select className="input text-xs py-1" value={u.role} onChange={async (e) => {
                      const newRole = e.target.value as AppUser["role"];
                      await supabase.from("app_users").update({ role: newRole }).eq("id", u.id);
                      setAppUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, role: newRole } : x));
                      setUserMessage(`${u.name} rolü güncellendi.`);
                      setTimeout(() => setUserMessage(""), 3000);
                    }}>
                      <option value="admin">Admin</option>
                      <option value="ortak">Ortak</option>
                      <option value="satici">Satıcı</option>
                    </select>
                  </div>
                ])}
              />
            </Card>
            <Card title="Ürün Türleri">
              {productTypeMessage && <div className="mb-3 rounded-lg bg-green-50 p-3 text-sm text-green-700">{productTypeMessage}</div>}
              <div className="flex gap-2 mb-4">
                <input className="input flex-1" placeholder="Yeni tür adı (örn: Şampuan, Boya, Manikür)" value={newProductTypeName} onChange={(e) => setNewProductTypeName(e.target.value)} />
                <button type="button" className="btn-primary" onClick={async () => {
                  const name = newProductTypeName.trim();
                  if (!name) return;
                  if (productTypes.some((t) => t.name.toLowerCase() === name.toLowerCase())) { setProductTypeMessage("Bu tür zaten mevcut."); return; }
                  const { data, error } = await supabase.from("product_types").insert({ name, active: true }).select().single();
                  if (error) { setProductTypeMessage("Hata: " + error.message); return; }
                  setProductTypes((prev) => [...prev, data as ProductType]);
                  setNewProductTypeName("");
                  setProductTypeMessage(`"${name}" türü eklendi.`);
                  setTimeout(() => setProductTypeMessage(""), 3000);
                }}>Ekle</button>
              </div>
              <Table
                headers={["Tür Adı", "Durum", "İşlem"]}
                rows={productTypes.map((t) => [
                  t.name,
                  t.active ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Aktif</span> : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Pasif</span>,
                  <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={async () => {
                    await supabase.from("product_types").update({ active: !t.active }).eq("id", t.id);
                    setProductTypes((prev) => prev.map((x) => x.id === t.id ? { ...x, active: !t.active } : x));
                    setProductTypeMessage(`"${t.name}" ${t.active ? "pasife alındı" : "aktife alındı"}.`);
                    setTimeout(() => setProductTypeMessage(""), 3000);
                  }}>{t.active ? "Pasife Al" : "Aktife Al"}</button>
                ])}
              />
            </Card>
            <Card title="Yeni Kullanıcı Ekle">
              <div className="grid gap-3 md:grid-cols-4">
                <input className="input" placeholder="İsim" value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} />
                <input className="input" placeholder="Email" type="email" value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} />
                <select className="input" value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as AppUser["role"] })}>
                  <option value="admin">Admin</option>
                  <option value="ortak">Ortak</option>
                  <option value="satici">Satıcı</option>
                </select>
                <button type="button" className="btn-primary" onClick={async () => {
                  if (!newUserForm.name || !newUserForm.email) return;
                  const { data, error } = await supabase.from("app_users").insert({ name: newUserForm.name, email: newUserForm.email, role: newUserForm.role, active: true }).select().single();
                  if (error) { setUserMessage("Hata: " + error.message); return; }
                  setAppUsers((prev) => [...prev, data as AppUser]);
                  setNewUserForm({ email: "", name: "", role: "satici" });
                  setUserMessage(`${(data as AppUser).name} eklendi. Supabase Authentication'da kullanıcı oluşturmayı unutma!`);
                  setTimeout(() => setUserMessage(""), 5000);
                }}>Ekle</button>
              </div>
              <p className="mt-2 text-xs text-slate-400">⚠️ Kullanıcı ekledikten sonra Supabase Authentication &gt; Users kısmında aynı email ile hesap oluşturman gerekiyor.</p>
            </Card>
          </div>
        )}

        {active === "products" && (
          <div className="space-y-0">
            {/* Mobile-first product page */}
            <div className="product-page">
              <div className="product-page-header">
                <h2 className="product-page-title">Ürün Listesi ve Stok Özeti</h2>
                <div style={{display:"flex", gap:8}}>
                  <button type="button" className="btn-secondary" style={{fontSize:"0.8rem", padding:"6px 12px"}} onClick={() => { setBarcodeCheckOpen(true); setTimeout(startBarcodeCheck, 300); }}>🔍 Barkod Kontrol</button>
                  <button type="button" className="btn-secondary" style={{fontSize:"0.8rem", padding:"6px 12px"}} onClick={() => setActive("gallery")}>🖼 Toplu Resimler</button>
                  <a href="/galeri" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{fontSize:"0.8rem", padding:"6px 12px", textDecoration:"none"}}>🔗 Paylaşım Linki</a>
                </div>
              </div>
              <div className="product-add-wrap product-add-wrap--top">
                <details className="w-full">
                  <summary className="product-add-btn" style={{listStyle:"none", cursor:"pointer"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Yeni Ürün Ekle
                  </summary>
                  <div className="product-add-form-panel">
                    <div className="grid gap-3 md:grid-cols-4">
                      <input className="input" maxLength={50} placeholder="Ürün adı (max 50)" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                      <select className="input" value={newProduct.typeId} onChange={(e) => setNewProduct({ ...newProduct, typeId: e.target.value })}>
                        <option value="">-- Ürün Türü Seç * --</option>
                        {productTypes.filter((t) => t.active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <div className="flex flex-col gap-2">
                        <label className="input cursor-pointer text-center text-sm">📁 Dosya Seç<input type="file" accept="image/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = async () => { const resized = await resizeImage(String(reader.result || "")); setNewProduct((prev) => ({ ...prev, image: resized })); }; reader.readAsDataURL(file); }} /></label>
                        <button type="button" className="input cursor-pointer text-center text-sm" onClick={() => openPhotoCapture("newProduct")}>📷 Kameradan Çek</button>
                      </div>
                      <button type="button" className="btn" disabled={processing} onClick={addProductDefinition}>{processing ? "..." : "Kaynak Ürün Ekle"}</button>
                    </div>
                    {newProduct.image ? <img src={newProduct.image} alt="Önizleme" className="mt-4 h-24 w-24 rounded-xl border object-cover" /> : null}
                  </div>
                </details>
              </div>
              <div className="product-search-wrap">
                <div className="product-search-inner">
                  <svg className="product-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input className="product-search-input" placeholder="Ürün ara" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </div>
              <div className="product-list">
                {filteredProducts.length ? filteredProducts.map((p) => {
                  const isOpen = expandedProductId === p.id;
                  const isEditing = editingProductId === p.id;
                  const draft = productDrafts[p.id] || {};
                  const totalBought = getProductTotalBought(p.id);
                  const totalSold = getProductSoldQty(p.id);
                  const stock = getProductStock(p.id);
                  const isLowStock = stock === 0;
                  return (
                    <div key={p.id} className={`product-card ${isOpen ? "product-card--open" : ""}`}>
                      <button type="button" className="product-row" onClick={() => openProductDetail(p)}>
                        <div className="product-row-left">
                          <div className="product-name">{p.name}</div>
                          <div className="product-meta">{p.code}{p.type_id ? ` • ${productTypes.find((t) => t.id === p.type_id)?.name || ""}` : ""}</div>
                        </div>
                        <div className="product-row-stats">
                          <div className="product-stat-chip">
                            <span className="product-stat-label">Alınan</span>
                            <b className="product-stat-val">{totalBought}</b>
                          </div>
                          <div className="product-stat-chip">
                            <span className="product-stat-label">Satılan</span>
                            <b className="product-stat-val">{totalSold}</b>
                          </div>
                          <div className={`product-stat-chip ${isLowStock ? "product-stat-chip--low" : ""}`}>
                            <span className={`product-stat-label ${isLowStock ? "product-stat-label--stock" : ""}`}>Stok</span>
                            <b className={`product-stat-val ${isLowStock ? "product-stat-val--stock" : ""}`}>{stock}</b>
                          </div>
                        </div>
                        <span className="product-chevron">
                          {isOpen
                            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="m18 15-6-6-6 6"/></svg>
                            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="m9 18 6-6-6-6"/></svg>}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="product-detail">
                          {isEditing ? (
                            <div className="product-edit-form">
                              <div className="product-edit-image-row">
                                <div className="product-img-box">
                                  {draft.image_url ? <img src={String(draft.image_url)} alt={p.name} className="product-img" /> : (
                                    <div className="product-img-placeholder">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                                      <span>Resim yok</span>
                                    </div>
                                  )}
                                </div>
                                <label className="product-img-change-btn">
                                  📁 Dosya
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    const reader = new FileReader();
                                    reader.onload = async () => {
                                      const b64 = await resizeImage(String(reader.result || ""));
                                      pendingImageRef.current[p.id] = b64;
                                      setProductDrafts((prev) => ({ ...prev, [p.id]: { ...(prev[p.id] || {}), image_url: b64 } }));
                                    };
                                    reader.readAsDataURL(file);
                                  }} />
                                </label>
                                <button type="button" className="product-img-change-btn" onClick={() => openPhotoCapture(p.id)}>
                                  📷 Kameradan Çek
                                </button>
                              </div>
                              <div className="product-edit-fields">
                                <label className="field-label"><span>Ürün adı</span><input className="input" maxLength={50} value={String(draft.name ?? p.name)} onChange={(e) => setProductDrafts({ ...productDrafts, [p.id]: { ...(productDrafts[p.id] || {}), name: e.target.value } })} /></label>
                                <label className="field-label"><span>Ürün Türü</span><select className="input" value={String(draft.type_id ?? p.type_id ?? "")} onChange={(e) => setProductDrafts({ ...productDrafts, [p.id]: { ...(productDrafts[p.id] || {}), type_id: e.target.value } })}><option value="">-- Seçiniz --</option>{productTypes.filter((t) => t.active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
                              </div>
                              {/* Parti satırları düzenleme */}
                              {batchItemsForProduct(p.id).length > 0 && (
                                <div>
                                  <div className="product-batch-title" style={{marginBottom:8}}>Parti / Stok Düzenleme</div>
                                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                                    {batchItemsForProduct(p.id).map((item) => (
                                      <div key={item.id} style={{background:"#f8fafc",borderRadius:12,padding:"10px 12px",display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
                                        <span style={{fontWeight:600,fontSize:"0.8rem",color:"#0f172a",minWidth:60}}>{batchMap.get(item.batch_id)?.name || "-"}</span>
                                        <label style={{display:"flex",flexDirection:"column",gap:2,fontSize:"0.7rem",color:"#64748b"}}>
                                          Adet
                                          <input className="input" style={{width:70}} type="number" min="0" defaultValue={item.bought} onBlur={(e) => { const v = Number(e.target.value); if (v !== item.bought) updateBatchItem(item.id, { bought: v }); }} />
                                        </label>
                                        <label style={{display:"flex",flexDirection:"column",gap:2,fontSize:"0.7rem",color:"#64748b"}}>
                                          Alış
                                          <input className="input" style={{width:80}} type="number" min="0" defaultValue={item.buy_price} onBlur={(e) => { const v = Number(e.target.value); if (v !== item.buy_price) updateBatchItem(item.id, { buy_price: v }); }} />
                                        </label>
                                        <label style={{display:"flex",flexDirection:"column",gap:2,fontSize:"0.7rem",color:"#64748b"}}>
                                          Satış
                                          <input className="input" style={{width:80}} type="number" min="0" defaultValue={item.sale_price} onBlur={(e) => { const v = Number(e.target.value); if (v !== item.sale_price) updateBatchItem(item.id, { sale_price: v }); }} />
                                        </label>
                                        <label style={{display:"flex",flexDirection:"column",gap:2,fontSize:"0.7rem",color:"#64748b"}}>
                                          Depo
                                          <select className="input" style={{width:110}} value={item.depo || "Belirsiz"} onChange={(e) => {
                                            const newDepo = e.target.value;
                                            const kalan = item.bought - getBatchSoldQtyForItem(item);
                                            if (kalan > 1) {
                                              setSplitModal({ item, newDepo });
                                              setSplitQty(String(kalan));
                                            } else {
                                              updateBatchItem(item.id, { depo: newDepo });
                                            }
                                          }}>
                                            <option value="56salon">56salon</option>
                                            <option value="Türkiş-salon">Türkiş-salon</option>
                                            <option value="Ana-depo">Ana-depo</option>
                                            <option value="Belirsiz">Belirsiz</option>
                                          </select>
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="product-action-row">
                                <button type="button" className="product-btn product-btn--secondary" onClick={() => saveProductEdit(p.id)}>Kaydet</button>
                                <button type="button" className="product-btn product-btn--secondary" onClick={() => cancelProductEdit(p.id)}>Vazgeç</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="product-info-row">
                                <div className="product-img-box">
                                  {p.image_url ? (
                                    <img
                                      src={p.image_url}
                                      alt={p.name}
                                      className="product-img"
                                      style={{cursor:"zoom-in"}}
                                      onClick={() => setLightboxImg(p.image_url)}
                                    />
                                  ) : (
                                    <div className="product-img-placeholder">
                                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
                                      <span>Resim yok</span>
                                    </div>
                                  )}
                                </div>
                                <div className="product-info-chips product-info-chips--sm">
                                  <div className="product-info-chip product-info-chip--sm"><div className="product-info-chip-label">Kod</div><div className="product-info-chip-val">{p.code}</div></div>
                                  
                                  <div className="product-info-chip product-info-chip--sm"><div className="product-info-chip-label">Durum</div><div className={`product-info-chip-val ${p.passive ? "product-info-chip-val--passive" : "product-info-chip-val--active"}`}>{p.passive ? "Pasif" : "Aktif"}</div></div>
                                </div>
                              </div>
                              <div className="product-batch-section">
                                <h4 className="product-batch-title">Parti Detayları</h4>
                                <div className="product-batch-table">
                                  <div className="product-batch-thead"><div>Parti</div><div>Depo</div><div>Alındı</div><div>Satıldı</div><div>Kalan</div><div>Alış</div><div>Satış</div></div>
                                  {batchItemsForProduct(p.id).length ? batchItemsForProduct(p.id).map((item) => {
                                    const sold = getBatchSoldQtyForItem(item);
                                    return (
                                      <div key={item.id} className="product-batch-row">
                                        <div className="product-batch-cell product-batch-cell--name">{batchMap.get(item.batch_id)?.name || "-"}</div>
                                        <div className="product-batch-cell" style={{fontSize:"0.72rem",color:"#64748b"}}>{item.depo || "Belirsiz"}</div>
                                        <div className="product-batch-cell">{item.bought}</div>
                                        <div className="product-batch-cell">{sold}</div>
                                        <div className="product-batch-cell">{item.bought - sold}</div>
                                        <div className="product-batch-cell">{money(item.buy_price)}</div>
                                        <div className="product-batch-cell">{money(item.sale_price)}</div>
                                      </div>
                                    );
                                  }) : <div className="product-batch-empty">Kayıt yok.</div>}
                                </div>
                              </div>
                              <div className="product-action-row">
                                <button type="button" className="product-btn product-btn--secondary" onClick={() => startProductEdit(p)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                  Düzenle
                                </button>
                                <button type="button" className="product-btn product-btn--secondary" onClick={() => setSalesModalProductId(p.id)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                                  Satış Detayı
                                </button>
                                <button type="button" className="product-btn product-btn--secondary" onClick={async () => {
                                  if (!p.barcode) return showToast("Bu ürüne ait barkod yok.", "error");
                                  await showQrPreview(p.name, p.barcode);
                                }}>
                                  🔳 QR Göster
                                </button>
                                <button type="button" className="product-btn product-btn--secondary" onClick={() => {
                                  const items = batchItems.filter((i) => i.product_id === p.id);
                                  if (!items.length) return showToast("Bu ürüne ait parti kaydı yok.", "error");
                                  if (items.length === 1) {
                                    const item = items[0];
                                    setBarcodeModal({ item, productName: p.name, batchName: batchMap.get(item.batch_id)?.name || "-" });
                                    setBarcodeQty(String(item.bought));
                                    setBarcodeMode("yeni");
                                  } else {
                                    // Birden fazla parti var, kullanıcıya seçtir
                                    const options = items.map((i) => `${batchMap.get(i.batch_id)?.name || i.batch_id} (${i.depo || "?"}, ${i.bought} adet)`).join("\n");
                                    const idx = items.findIndex((i) => {
                                      const name = prompt(`Hangi parti?\n\n${items.map((i2, n) => `${n+1}. ${batchMap.get(i2.batch_id)?.name || "-"} - ${i2.depo} (${i2.bought} adet)`).join("\n")}\n\nNumara girin:`);
                                      return name !== null;
                                    });
                                    const chosen = (() => {
                                      const name = prompt(`Parti seçin (numara girin):\n${items.map((i2, n) => `${n+1}. ${batchMap.get(i2.batch_id)?.name || "-"} - ${i2.depo} (${i2.bought} adet)`).join("\n")}`);
                                      const n = Number(name);
                                      return items[n - 1] || items[items.length - 1];
                                    })();
                                    setBarcodeModal({ item: chosen, productName: p.name, batchName: batchMap.get(chosen.batch_id)?.name || "-" });
                                    setBarcodeQty(String(chosen.bought));
                                    setBarcodeMode("yeni");
                                  }
                                }}>
                                  🖨 Barkod Bas
                                </button>
                                <button type="button" className="product-btn product-btn--danger" onClick={() => deleteProduct(p.id)}>
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                  Pasife Al
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                }) : <p className="px-4 py-8 text-center text-sm text-slate-500">Kayıt yok.</p>}
              </div>
            </div>
          </div>
        )}

        {active === "gallery" && (() => {
          const activeTypes = productTypes.filter((t) => t.active);
          const groups = [
            ...activeTypes.map((t) => ({ label: t.name, typeId: t.id })),
            { label: "Türsüz", typeId: null as string | null },
          ];
          return (
            <div>
              <div style={{display:"flex", alignItems:"center", gap:12, marginBottom:20}}>
                <button type="button" className="btn-secondary" style={{fontSize:"0.8rem", padding:"6px 12px"}} onClick={() => setActive("products")}>← Ürünlere Dön</button>
                <h2 style={{fontSize:"1.1rem", fontWeight:600}}>Toplu Ürün Resimleri</h2>
              </div>
              {groups.map((g) => {
                const groupProducts = sortedProducts.filter((p) => !p.passive && p.type_id === g.typeId && p.image_url);
                if (!groupProducts.length) return null;
                return (
                  <div key={g.typeId ?? "no-type"} style={{marginBottom: 32}}>
                    <div style={{fontSize:"0.75rem", fontWeight:700, color:"var(--color-text-secondary)", textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10, paddingBottom:6, borderBottom:"1.5px solid var(--color-border-tertiary)"}}>
                      {g.label} — {groupProducts.length} ürün
                    </div>
                    <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:8}}>
                      {groupProducts.map((p) => (
                        <div key={p.id} style={{display:"flex", flexDirection:"column", alignItems:"center", gap:4}}>
                          <div style={{width:"100%", aspectRatio:"1/1", borderRadius:10, overflow:"hidden", background:"#f8fafc", border:"1px solid #e2e8f0", cursor:"pointer"}}
                            onClick={() => setLightboxImg(p.image_url)}>
                            <img src={p.image_url!} alt={p.name} style={{width:"100%", height:"100%", objectFit:"cover"}} />
                          </div>
                          <div style={{fontSize:"0.65rem", textAlign:"center", color:"var(--color-text-secondary)", lineHeight:1.2, wordBreak:"break-word", maxWidth:"100%"}}>
                            {p.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}

        {active === "batchEntry" && (
          <div className="space-y-4">
            <Card title="Parti Bazlı Ürün Girişi">
              <p className="mb-5 text-slate-500">Önce kaynak ürün ve parti adı oluşturulur. Sonra partiye ürün, adet, alış fiyatı ve hedef satış fiyatı girilir.</p>
              <div className="mb-5 flex flex-wrap gap-3">
                <input className="input max-w-sm" placeholder="Yeni parti adı" value={newBatchName} onChange={(e) => setNewBatchName(e.target.value)} />
                <button type="button" className="btn-secondary" disabled={processing} onClick={addBatchName}>{processing ? "..." : "Parti Adı Ekle"}</button>
              </div>
              <div className="mb-5 flex flex-wrap gap-2">
                {sortedBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center gap-2 rounded-xl border bg-slate-50 px-3 py-2 text-sm">
                    <span>{batch.name}</span>
                    <button type="button" className="text-red-600" onClick={() => deleteBatchName(batch.id)}>Sil</button>
                    <button type="button" className="underline" onClick={() => {
                      const next = prompt("Yeni parti adı", batch.name);
                      if (next) renameBatchName(batch.id, next);
                    }}>Değiştir</button>
                  </div>
                ))}
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <select className="input" value={batchForm.batchId} onChange={(e) => setBatchForm({ ...batchForm, batchId: e.target.value })}>
                  <option value="">Parti seçin</option>
                  {sortedBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </select>
                <select className="input" value={batchForm.productId} onChange={(e) => setBatchForm({ ...batchForm, productId: e.target.value })}>
                  <option value="">Kaynak ürün seçin</option>
                  {sortedActiveProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input className="input" type="number" placeholder="Toplam sipariş/adet" value={batchForm.bought} onChange={(e) => setBatchForm({ ...batchForm, bought: e.target.value })} />
                <input className="input" type="number" placeholder="Alış fiyatı" value={batchForm.buyPrice} onChange={(e) => setBatchForm({ ...batchForm, buyPrice: e.target.value })} />
                <input className="input" type="number" placeholder="Hedef satış fiyatı" value={batchForm.salePrice} onChange={(e) => setBatchForm({ ...batchForm, salePrice: e.target.value })} />
                <select className="input" value={batchForm.depo} onChange={(e) => setBatchForm({ ...batchForm, depo: e.target.value })}>
                  <option value="56salon">56salon</option>
                  <option value="Türkiş-salon">Türkiş-salon</option>
                  <option value="Ana-depo">Ana-depo</option>
                </select>
                <button type="button" className="btn" onClick={addBatchProduct}>Partiye Ürün Ekle</button>
              </div>
            </Card>

            <Card title="Parti Bazlı Ürün / Stok Raporu">
              <div className="mb-5 flex items-center gap-2">
                <select className="input flex-1" value={batchReportFilter} onChange={(e) => setBatchReportFilter(e.target.value)}>
                  <option value="Tümü">Tüm Partiler</option>
                  {sortedBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </select>

              {(() => {
                const filtered = batchItems.filter((item) => batchReportFilter === "Tümü" || item.batch_id === batchReportFilter);
                const totalAlinan = filtered.reduce((s, item) => s + item.bought, 0);
                const totalSatilan = filtered.reduce((s, item) => s + getBatchSoldQtyForItem(item), 0);
                const totalKalan = totalAlinan - totalSatilan;
                return (
                  <div className="rounded-xl bg-slate-100 flex divide-x divide-slate-300 flex-shrink-0">
                    <div className="px-3 py-2 text-center">
                      <div className="text-xs text-slate-500 font-semibold mb-1">Toplam<br/>Alınan</div>
                      <div className="text-lg font-bold text-slate-900">{totalAlinan}</div>
                    </div>
                    <div className="px-3 py-2 text-center">
                      <div className="text-xs text-slate-500 font-semibold mb-1">Toplam<br/>Satılan</div>
                      <div className="text-lg font-bold text-slate-900">{totalSatilan}</div>
                    </div>
                    <div className="px-3 py-2 text-center">
                      <div className="text-xs text-slate-500 font-semibold mb-1">Toplam<br/>Kalan</div>
                      <div className="text-lg font-bold text-slate-900">{totalKalan}</div>
                    </div>
                  </div>
                );
              })()}
              </div>

              {(() => {
                const handleBRSort = (col: string) => setBatchReportSort((s) => ({ col, dir: s.col === col && s.dir === "asc" ? "desc" : "asc" }));
                const brArr = (col: string) => batchReportSort.col === col ? (batchReportSort.dir === "asc" ? " ▲" : " ▼") : " ↕";
                const brTh = (col: string, label: string) => (
                  <button type="button" onClick={() => handleBRSort(col)} style={{fontWeight:700,background:"none",border:"none",cursor:"pointer",padding:0,whiteSpace:"nowrap"}}>{label}{brArr(col)}</button>
                );
                const filteredItems = batchItems.filter((item) => batchReportFilter === "Tümü" || item.batch_id === batchReportFilter);
                const sortedItems = [...filteredItems].sort((a, b) => {
                  let av: string|number = "", bv: string|number = "";
                  if (batchReportSort.col === "batch") { av = batchMap.get(a.batch_id)?.name||""; bv = batchMap.get(b.batch_id)?.name||""; }
                  else if (batchReportSort.col === "depo") { av = a.depo||""; bv = b.depo||""; }
                  else if (batchReportSort.col === "product") { av = productMap.get(a.product_id)?.name||""; bv = productMap.get(b.product_id)?.name||""; }
                  else if (batchReportSort.col === "bought") { av = a.bought; bv = b.bought; }
                  else if (batchReportSort.col === "sold") { av = getBatchSoldQtyForItem(a); bv = getBatchSoldQtyForItem(b); }
                  else if (batchReportSort.col === "kalan") { av = a.bought - getBatchSoldQtyForItem(a); bv = b.bought - getBatchSoldQtyForItem(b); }
                  else if (batchReportSort.col === "buy_price") { av = a.buy_price; bv = b.buy_price; }
                  else if (batchReportSort.col === "sale_price") { av = a.sale_price; bv = b.sale_price; }
                  const cmp = typeof av === "number" ? av-(bv as number) : String(av).localeCompare(String(bv),"tr");
                  return batchReportSort.dir === "asc" ? cmp : -cmp;
                });
                return (
                  <Table
                    headers={[brTh("batch","Parti"), brTh("depo","Depo"), brTh("product","Ürün"), brTh("bought","Alınan"), brTh("sold","Satılan"), brTh("kalan","Kalan"), brTh("buy_price","Alış"), brTh("sale_price","Satış"), "Barkod", "İşlem"]}
                    rows={sortedItems.map((item) => {
                      const key = item.id;
                      const p = productMap.get(item.product_id);
                      return [
                        editingBatchItemId === key ? (
                          <select className="input" value={item.batch_id} onChange={(e) => updateBatchItem(item.id, { batch_id: e.target.value })}>
                            {sortedBatches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                          </select>
                        ) : batchMap.get(item.batch_id)?.name || "-",
                        editingBatchItemId === key ? (
                          <select className="input" value={item.depo || "Belirsiz"} onChange={(e) => updateBatchItem(item.id, { depo: e.target.value })}>
                            <option value="56salon">56salon</option>
                            <option value="Türkiş-salon">Türkiş-salon</option>
                            <option value="Ana-depo">Ana-depo</option>
                            <option value="Belirsiz">Belirsiz</option>
                          </select>
                        ) : item.depo || "Belirsiz",
                        p?.name || "-",
                        editingBatchItemId === key ? <input className="input w-24" type="number" value={item.bought} onChange={(e) => updateBatchItem(item.id, { bought: Number(e.target.value || 0) })} /> : item.bought,
                        getBatchSoldQtyForItem(item),
                        item.bought - getBatchSoldQtyForItem(item),
                        editingBatchItemId === key ? <input className="input w-24" type="number" value={item.buy_price} onChange={(e) => updateBatchItem(item.id, { buy_price: Number(e.target.value || 0) })} /> : money(item.buy_price),
                        editingBatchItemId === key ? <input className="input w-24" type="number" value={item.sale_price} onChange={(e) => updateBatchItem(item.id, { sale_price: Number(e.target.value || 0) })} /> : money(item.sale_price),
                        <div key={`bc-${key}`} className="flex flex-col gap-1">
                          {item.barcode ? <span className="text-xs text-slate-400 font-mono">{item.barcode.substring(0, 12)}...</span> : <span className="text-xs text-slate-300">—</span>}
                          <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={() => {
                            setBarcodeModal({ item, productName: p?.name || "-", batchName: batchMap.get(item.batch_id)?.name || "-" });
                            setBarcodeQty(String(item.bought));
                            setBarcodeMode("yeni");
                          }}>🖨 Barkod Bas</button>
                        </div>,
                        <div key={key} className="flex gap-2">
                          <button type="button" className="btn-secondary" onClick={() => setEditingBatchItemId(editingBatchItemId === key ? null : key)}>Değiştir</button>
                          <button type="button" className="btn-danger" onClick={() => deleteBatchItem(item)}>Sil</button>
                        </div>,
                      ];
                    })}
                  />
                );
              })()}
            </Card>
          </div>
        )}

        {/* Toast Popup */}
        {message && (
          <div
            className="fixed left-1/2 z-[99999] -translate-x-1/2"
            style={{ bottom: 32, maxWidth: "90vw", minWidth: 280 }}
            onClick={() => setMessage("")}
          >
            <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl text-sm font-medium cursor-pointer ${
              toastType === "error" ? "bg-red-600 text-white" :
              toastType === "success" ? "bg-green-600 text-white" :
              "bg-slate-800 text-white"
            }`}>
              <span>
                {toastType === "error" ? "❌" : toastType === "success" ? "✅" : "ℹ️"}
              </span>
              <span className="flex-1">{message}</span>
              <span className="opacity-60 text-xs">×</span>
            </div>
          </div>
        )}

        {/* Fotoğraf Çekme Modalı */}
        {photoCaptureTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-sm rounded-2xl bg-black p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">📷 Fotoğraf Çek</h3>
                <button type="button" className="rounded-full bg-white/20 px-3 py-1 text-sm text-white" onClick={closePhotoCapture}>Kapat</button>
              </div>
              <div className="relative overflow-hidden rounded-xl" style={{aspectRatio:"4/3"}}>
                <video ref={photoVideoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
              </div>
              <button type="button" className="mt-3 w-full rounded-xl bg-white py-3 text-lg font-bold text-black" onClick={capturePhoto}>
                📸 Çek
              </button>
            </div>
          </div>
        )}

        {/* QR Önizleme Modalı */}
        {qrPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setQrPreview(null)}>
            <div className="w-full max-w-xs rounded-2xl bg-white p-6 shadow-xl text-center" onClick={(e) => e.stopPropagation()}>
              <h3 className="mb-1 font-bold text-lg">{qrPreview.productName}</h3>
              <p className="mb-4 text-xs text-slate-400 font-mono">{qrPreview.barcode}</p>
              <img src={qrPreview.dataUrl} alt="QR" className="mx-auto rounded-xl" style={{width:240, height:240}} />
              <p className="mt-3 text-xs text-slate-400">Ekrandan okutabilir veya barkod bas butonunu kullanabilirsiniz</p>
              <button type="button" className="btn-secondary mt-4 w-full" onClick={() => setQrPreview(null)}>Kapat</button>
            </div>
          </div>
        )}

        {/* Barkod Kontrol Modalı */}
        {barcodeCheckOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-sm rounded-2xl bg-black p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">🔍 Barkod Kontrol</h3>
                <button type="button" className="rounded-full bg-white/20 px-3 py-1 text-sm text-white" onClick={stopBarcodeCheck}>Kapat</button>
              </div>
              {!barcodeCheckResult ? (
                <div className="relative overflow-hidden rounded-xl" style={{aspectRatio:"1/1"}}>
                  <video ref={barcodeCheckVideoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-48 w-48 rounded-2xl border-4 border-white/60" style={{boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)"}} />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/80">QR kodu çerçeve içine alın...</div>
                </div>
              ) : (
                <div className={`rounded-xl p-5 ${barcodeCheckResult.found ? "bg-green-900/50" : "bg-red-900/50"}`}>
                  {barcodeCheckResult.found ? (
                    <>
                      <div className="text-2xl text-center mb-3">✅</div>
                      <div className="text-white font-bold text-lg text-center mb-2">{barcodeCheckResult.productName}</div>
                      <div className="text-green-300 text-sm text-center">Parti: {barcodeCheckResult.batchName}</div>
                      <div className="text-green-300 text-sm text-center">Depo: {barcodeCheckResult.depo}</div>
                      <div className="text-green-200/50 text-xs text-center mt-2 font-mono">{barcodeCheckResult.barcode}</div>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl text-center mb-3">❌</div>
                      <div className="text-red-300 text-center">Sistemde kayıtlı barkod bulunamadı</div>
                      <div className="text-red-200/50 text-xs text-center mt-2 font-mono">{barcodeCheckResult.barcode}</div>
                    </>
                  )}
                  <button type="button" className="mt-4 w-full rounded-xl bg-white/20 py-2 text-white text-sm" onClick={() => { setBarcodeCheckResult(null); setTimeout(startBarcodeCheck, 300); }}>Tekrar Tara</button>
                  <button type="button" className="mt-2 w-full rounded-xl bg-white/10 py-2 text-white/70 text-sm" onClick={stopBarcodeCheck}>Kapat</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Kamera Tarama Modalı */}
        {scannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-sm rounded-2xl bg-black p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">📷 Barkod Tara</h3>
                <button type="button" className="rounded-full bg-white/20 px-3 py-1 text-sm text-white" onClick={stopScanner}>Kapat</button>
              </div>
              {scannerError ? (
                <div className="rounded-xl bg-red-900/50 p-4 text-center text-sm text-red-300">{scannerError}</div>
              ) : (
                <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: "1/1" }}>
                  <video ref={videoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                  {/* Hedef kare */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-48 w-48 rounded-2xl border-4 border-white/60" style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)" }} />
                  </div>
                  {scanning && (
                    <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/80">
                      QR kodu çerçeve içine alın...
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Barkod Modal */}
        {barcodeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="mb-1 text-lg font-bold">🖨 Barkod Bas</h3>
              <p className="mb-4 text-sm text-slate-500">{barcodeModal.productName} / {barcodeModal.batchName}</p>
              
              <div className="mb-4 flex gap-3">
                <button type="button"
                  className={`flex-1 rounded-xl border-2 p-3 text-sm font-medium transition ${barcodeMode === "yeni" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
                  onClick={() => setBarcodeMode("yeni")}>
                  📦 Yeni Stok Girişi<br />
                  <span className="text-xs font-normal opacity-70">Stok adedi artar + barkod üretilir</span>
                </button>
                <button type="button"
                  className={`flex-1 rounded-xl border-2 p-3 text-sm font-medium transition ${barcodeMode === "tekrar" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
                  onClick={() => setBarcodeMode("tekrar")}>
                  🔄 Sadece Tekrar Baskı<br />
                  <span className="text-xs font-normal opacity-70">Stok değişmez, mevcut barkod yeniden basılır</span>
                </button>
              </div>

              <div className="mb-4">
                <label className="mb-1 block text-sm font-medium text-slate-700">Kaç adet etiket basılsın?</label>
                <input className="input w-full" type="number" min="1" max="500" placeholder="Adet girin" value={barcodeQty} onChange={(e) => setBarcodeQty(e.target.value)} />
              </div>

              {barcodeModal.item.barcode && (
                <div className="mb-4 rounded-lg bg-slate-50 p-2 text-xs text-slate-500">
                  Mevcut barkod: <span className="font-mono">{barcodeModal.item.barcode}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button type="button" className="btn-secondary flex-1" onClick={() => { setBarcodeModal(null); setBarcodeQty(""); }}>İptal</button>
                <button type="button" className="btn-primary flex-1" disabled={processing} onClick={handleBarcodePrint}>{processing ? "..." : "Yazdır"}</button>
              </div>
            </div>
          </div>
        )}

        {active === "customers" && (
          <div className="space-y-0">
            <div className="product-page">
              <div className="product-page-header">
                <h2 className="product-page-title">Cari Listesi</h2>
              </div>

              {/* Add Customer */}
              <div className="product-add-wrap product-add-wrap--top">
                <details className="w-full">
                  <summary className="product-add-btn" style={{listStyle:"none", cursor:"pointer"}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Yeni Cari Ekle
                  </summary>
                  <div className="product-add-form-panel">
                    <div className="flex flex-wrap gap-3">
                      <input className="input max-w-md" maxLength={50} placeholder="Cari adı (max 50 karakter)" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} />
                      <button type="button" className="btn" disabled={processing} onClick={addCustomer}>{processing ? "..." : "Cari Ekle"}</button>
                    </div>
                  </div>
                </details>
              </div>

              {/* Search */}
              <div className="product-search-wrap">
                <div className="product-search-inner">
                  <svg className="product-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input className="product-search-input" placeholder="Cari adı yazın; yazdıkça liste filtrelenir" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
                </div>
              </div>

              {/* Customer List */}
              <div className="product-list">
                {filteredCustomers.length ? filteredCustomers.map((c) => {
                  const isOpen = expandedCustomerId === c.id;
                  const isEditing = editingCustomerId === c.id;
                  const draft = customerDrafts[c.id] || {};
                  const balance = getCustomerBalance(c.id);
                  const customerSales = activeSales.filter((sale) => sale.customer_id === c.id);
                  const customerPayments = activePayments.filter((p) => p.customer_id === c.id);
                  const totalSales = getCustomerSalesTotal(c.id);
                  const collected = getCustomerCollectedTotal(c.id);
                  const status = c.passive ? "Pasif" : balance <= 0 ? "Ödendi" : "Borç Açık";
                  const statusColor = c.passive ? "#64748b" : balance <= 0 ? "#16a34a" : "#dc2626";

                  return (
                    <div key={c.id} id={`cari-card-${c.id}`} className={`product-card ${isOpen ? "product-card--open" : ""}`}>
                      {/* Row */}
                      <button
                        type="button"
                        className="product-row"
                        onClick={() => {
                          const nextId = expandedCustomerId === c.id ? null : c.id;
                          setExpandedCustomerId(nextId);
                          setEditingCustomerId(null);
                          if (nextId) {
                            setTimeout(() => {
                              const el = document.getElementById(`cari-card-${nextId}`);
                              if (el) {
                                const y = el.getBoundingClientRect().top + window.scrollY - 16;
                                window.scrollTo({ top: y, behavior: "smooth" });
                              }
                            }, 80);
                          }
                        }}
                      >
                        <div className="product-row-left">
                          <div className="product-name">{c.name}</div>
                          <div className="product-meta" style={{color: statusColor, fontWeight: 600}}>{status}</div>
                        </div>
                        <div className="product-row-stats">
                          <div className="product-stat-chip">
                            <span className="product-stat-label">Satış</span>
                            <b className="product-stat-val" style={{fontSize:"0.7rem"}}>{money(totalSales)}</b>
                          </div>
                          <div className="product-stat-chip">
                            <span className="product-stat-label">Ödeme</span>
                            <b className="product-stat-val" style={{fontSize:"0.7rem"}}>{money(collected)}</b>
                          </div>
                          <div className={`product-stat-chip ${balance > 0 ? "product-stat-chip--low" : ""}`}>
                            <span className={`product-stat-label ${balance > 0 ? "product-stat-label--stock" : ""}`}>Kalan</span>
                            <b className={`product-stat-val ${balance > 0 ? "product-stat-val--stock" : ""}`} style={{fontSize:"0.7rem"}}>{money(balance)}</b>
                          </div>
                        </div>
                        <span className="product-chevron">
                          {isOpen
                            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="m18 15-6-6-6 6"/></svg>
                            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="18" height="18"><path d="m9 18 6-6-6-6"/></svg>}
                        </span>
                      </button>

                      {/* Expanded */}
                      {isOpen && (
                        <div className="product-detail">
                          {isEditing ? (
                            <div className="product-edit-fields" style={{marginBottom: 14}}>
                              <label className="field-label">
                                <span>Cari adı</span>
                                <input className="input" maxLength={50} value={String(draft.name ?? c.name)} onChange={(e) => setCustomerDrafts({ ...customerDrafts, [c.id]: { ...(customerDrafts[c.id] || {}), name: e.target.value } })} />
                              </label>
                              <label className="field-label">
                                <span>Durum</span>
                                <select className="input" value={String(draft.passive ?? c.passive)} onChange={(e) => setCustomerDrafts({ ...customerDrafts, [c.id]: { ...(customerDrafts[c.id] || {}), passive: e.target.value === "true" } })}>
                                  <option value="false">Aktif</option>
                                  <option value="true">Pasif</option>
                                </select>
                              </label>
                              <div className="product-action-row">
                                <button type="button" className="product-btn product-btn--secondary" onClick={() => saveCustomerEdit(c.id)}>Kaydet</button>
                                <button type="button" className="product-btn product-btn--secondary" onClick={() => cancelCustomerEdit(c.id)}>Vazgeç</button>
                              </div>
                            </div>
                          ) : (
                            <div className="product-action-row" style={{marginBottom: 14}}>
                              <div className="cari-payment-row">
                                <input className="input" style={{maxWidth: 160}} type="number" min="0" placeholder="Ödeme tutarı" value={paymentInputs[c.id] || ""} onChange={(e) => setPaymentInputs({ ...paymentInputs, [c.id]: e.target.value })} />
                                <button type="button" className="product-btn product-btn--secondary" onClick={() => addCustomerPayment(c.id)}>Ödeme Ekle</button>
                              </div>
                              <button type="button" className="product-btn product-btn--secondary" onClick={() => startCustomerEdit(c)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Düzenle
                              </button>
                              <button type="button" className="product-btn product-btn--danger" onClick={() => deleteCustomer(c.id)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                                Sil / Pasife Al
                              </button>
                            </div>
                          )}

                          {/* Sales movements */}
                          <div className="product-batch-section">
                            <h4 className="product-batch-title">Satış Hareketleri</h4>
                            <div className="product-batch-table">
                              <div className="cari-sales-thead">
                                <div>Tarih</div><div>Ürün</div><div>Parti</div><div>Ad</div><div>Tutar</div><div>Durum</div>
                              </div>
                              {customerSales.length ? customerSales.map((sale) => {
                                return (
                                  <div key={sale.id} className="cari-sales-row">
                                    <div className="product-batch-cell" style={{fontSize:"0.68rem"}}>{toTR(sale.created_at)}</div>
                                    <div className="product-batch-cell product-batch-cell--name" style={{fontSize:"0.68rem"}}>{productMap.get(sale.product_id)?.name || "-"}</div>
                                    <div className="product-batch-cell" style={{fontSize:"0.68rem"}}>{batchMap.get(sale.batch_id)?.name || "-"}</div>
                                    <div className="product-batch-cell" style={{fontSize:"0.68rem"}}>{sale.qty}</div>
                                    <div className="product-batch-cell" style={{fontSize:"0.68rem"}}>{money(sale.total)}</div>
                                    <div className="product-batch-cell" style={{fontSize:"0.68rem"}}>{getSaleStatus(sale)}</div>
                                  </div>
                                );
                              }) : <div className="product-batch-empty">Satış yok.</div>}
                            </div>
                          </div>

                          {/* Payment movements */}
                          <div className="product-batch-section">
                            <h4 className="product-batch-title">Ödeme Hareketleri</h4>
                            <div className="product-batch-table">
                              <div className="cari-pay-thead">
                                <div>Tarih</div><div>Tutar</div><div></div>
                              </div>
                              {customerPayments.length ? customerPayments.map((pay) => {
                                const isEditingPay = editingPaymentId === pay.id;
                                return (
                                  <div key={pay.id} className="cari-pay-row">
                                    <div className="product-batch-cell" style={{fontSize:"0.8rem"}}>{toTR(pay.created_at)}</div>
                                    <div className="product-batch-cell" style={{fontSize:"0.8rem"}}>
                                      {isEditingPay
                                        ? <input className="input" style={{width:90, padding:"2px 6px", fontSize:"0.8rem"}} type="number" min="1" value={editingPaymentAmount} onChange={(e) => setEditingPaymentAmount(e.target.value)} />
                                        : money(pay.amount)}
                                    </div>
                                    <div className="product-batch-cell" style={{display:"flex", gap:4}}>
                                      {isEditingPay ? (<>
                                        <button type="button" className="btn" style={{fontSize:"0.7rem", padding:"2px 8px"}} onClick={() => updatePayment(pay.id, Number(editingPaymentAmount), c.id)}>Kaydet</button>
                                        <button type="button" className="btn-secondary" style={{fontSize:"0.7rem", padding:"2px 8px"}} onClick={() => { setEditingPaymentId(null); setEditingPaymentAmount(""); }}>Vazgeç</button>
                                      </>) : (<>
                                        <button type="button" className="btn-secondary" style={{fontSize:"0.7rem", padding:"2px 8px"}} onClick={() => { setEditingPaymentId(pay.id); setEditingPaymentAmount(String(pay.amount)); }}>Düzenle</button>
                                        <button type="button" className="btn-danger" style={{fontSize:"0.7rem", padding:"2px 8px"}} onClick={() => deletePayment(pay.id, c.id, pay.amount)}>Sil</button>
                                      </>)}
                                    </div>
                                  </div>
                                );
                              }) : <div className="product-batch-empty">Ödeme yok.</div>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }) : <p className="px-4 py-8 text-center text-sm text-slate-500">Kayıt yok.</p>}
              </div>
            </div>
          </div>
        )}

        {active === "preorders" && (
          <div className="space-y-6">
            {/* Form */}
            <Card title={editingPreorderId ? "Ön Sipariş Düzenle" : "Yeni Ön Sipariş"}>
              <div className="space-y-3">
                <div>
                  <label className="label">Cari</label>
                  <select className="input" value={preorderForm.customerId} onChange={(e) => setPreorderForm({ ...preorderForm, customerId: e.target.value })}>
                    <option value="">Cari seçin</option>
                    {sortedActiveCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Not (opsiyonel)</label>
                  <input className="input" value={preorderForm.note} onChange={(e) => setPreorderForm({ ...preorderForm, note: e.target.value })} placeholder="Sipariş notu..." />
                </div>
                <div>
                  <label className="label">Ürünler</label>
                  <div className="space-y-2">
                    {preorderForm.items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select className="input" style={{flex:3}} value={item.productId} onChange={(e) => { const items = [...preorderForm.items]; items[idx].productId = e.target.value; setPreorderForm({ ...preorderForm, items }); }}>
                          <option value="">Ürün seçin</option>
                          {sortedActiveProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                        <input className="input" style={{flex:1, minWidth:60}} type="number" min="1" value={item.qty} onChange={(e) => { const items = [...preorderForm.items]; items[idx].qty = e.target.value; setPreorderForm({ ...preorderForm, items }); }} placeholder="Adet" />
                        {preorderForm.items.length > 1 && (
                          <button type="button" className="btn-danger" style={{padding:"6px 10px", flexShrink:0}} onClick={() => { const items = preorderForm.items.filter((_, i) => i !== idx); setPreorderForm({ ...preorderForm, items }); }}>✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" className="btn-secondary text-sm" onClick={() => setPreorderForm({ ...preorderForm, items: [...preorderForm.items, { productId: "", qty: "1" }] })}>+ Ürün Ekle</button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="btn" onClick={savePreorder}>{editingPreorderId ? "Güncelle" : "Kaydet"}</button>
                  {editingPreorderId && <button type="button" className="btn-secondary" onClick={() => { setEditingPreorderId(null); setPreorderForm({ customerId: "", note: "", items: [{ productId: "", qty: "1" }] }); }}>Vazgeç</button>}
                </div>
                
              </div>
            </Card>

            {/* Bekleyen Ön Siparişler */}
            <Card title="Bekleyen Ön Siparişler">
              {preorders.filter((po) => po.status === "bekliyor").length === 0
                ? <p className="text-sm text-slate-500">Bekleyen ön sipariş yok.</p>
                : preorders.filter((po) => po.status === "bekliyor").map((po) => {
                  const items = preorderItems.filter((i) => i.preorder_id === po.id);
                  const customer = customerMap.get(po.customer_id);
                  return (
                    <div key={po.id} className="border rounded-xl p-4 mb-3 bg-white">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <div className="font-semibold text-slate-800">{customer?.name || "—"}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{toTR(po.created_at, true)} · {po.created_by} {po.note ? `· ${po.note}` : ""}</div>
                          <ul className="mt-2 space-y-1">
                            {items.map((item) => (
                              <li key={item.id} className="flex items-center gap-2 text-sm text-slate-700">
                                <span>• {productMap.get(item.product_id)?.name || "—"} — {item.qty} adet</span>
                                <button type="button" className="btn" style={{fontSize:"0.7rem", padding:"2px 8px"}} onClick={() => openConvertModal(po, item)}>Satışa Dönüştür</button>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <button type="button" className="btn-secondary" style={{fontSize:"0.8rem", padding:"6px 12px"}} onClick={() => startEditPreorder(po)}>Düzenle</button>
                          <button type="button" className="btn-danger" style={{fontSize:"0.8rem", padding:"6px 12px"}} onClick={() => deletePreorder(po.id)}>Sil</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </Card>

            {/* Tamamlanan Ön Siparişler */}
            <Card title="Tamamlanan Ön Siparişler">
              {preorders.filter((po) => po.status === "tamamlandı").length === 0
                ? <p className="text-sm text-slate-500">Tamamlanan ön sipariş yok.</p>
                : preorders.filter((po) => po.status === "tamamlandı").map((po) => {
                  const items = preorderItems.filter((i) => i.preorder_id === po.id);
                  const customer = customerMap.get(po.customer_id);
                  return (
                    <div key={po.id} className="border rounded-xl p-4 mb-3 bg-slate-50">
                      <div className="flex justify-between items-start flex-wrap gap-2">
                        <div>
                          <div className="font-semibold text-slate-500">{customer?.name || "—"} <span className="text-xs text-green-600 font-semibold ml-1">✓ Tamamlandı</span></div>
                          <div className="text-xs text-slate-400 mt-0.5">{toTR(po.created_at, true)} · {po.created_by}</div>
                          <ul className="mt-1 space-y-0.5">
                            {items.map((item) => (
                              <li key={item.id} className="text-xs text-slate-500">• {productMap.get(item.product_id)?.name || "—"} — {item.qty} adet</li>
                            ))}
                          </ul>
                        </div>
                        <button type="button" className="btn-danger" style={{fontSize:"0.75rem", padding:"4px 10px"}} onClick={() => deletePreorder(po.id)}>Sil</button>
                      </div>
                    </div>
                  );
                })}
            </Card>
          </div>
        )}

        {showTahsilatDetay && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={() => setShowTahsilatDetay(false)}>
            <div style={{background:"white",borderRadius:16,padding:24,width:"100%",maxWidth:700,maxHeight:"90vh",overflowY:"auto"}} onClick={(e) => e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 style={{fontSize:"1.1rem",fontWeight:700}}>Dönem Tahsilatları Detayı</h2>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <span style={{fontSize:"0.85rem",color:"#64748b"}}>{totals.recentPayments.length} ödeme · Toplam: <strong>{money(totals.grossCash)}</strong></span>
                  <button type="button" className="btn-secondary" style={{padding:"4px 12px"}} onClick={() => setShowTahsilatDetay(false)}>Kapat</button>
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                  <thead>
                    <tr style={{background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0"}}>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b"}}>Tarih</th>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b"}}>Cari</th>
                      <th style={{padding:"8px 10px",textAlign:"left",fontWeight:600,color:"#64748b"}}>Ekleyen</th>
                      <th style={{padding:"8px 10px",textAlign:"right",fontWeight:600,color:"#64748b"}}>Tutar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {totals.recentPayments.sort((a,b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).map((pay) => (
                      <tr key={pay.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                        <td style={{padding:"7px 10px"}}>{toTR(pay.created_at, true)}</td>
                        <td style={{padding:"7px 10px"}}>{customerMap.get(pay.customer_id)?.name || "-"}</td>
                        <td style={{padding:"7px 10px",color:"#64748b"}}>{pay.user_email?.split("@")[0] || "-"}</td>
                        <td style={{padding:"7px 10px",textAlign:"right",fontWeight:500}}>{money(pay.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:"2px solid #e2e8f0",background:"#f8fafc"}}>
                      <td colSpan={3} style={{padding:"8px 10px",fontWeight:600}}>Toplam</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700}}>{money(totals.grossCash)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {showKarDetay && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={() => setShowKarDetay(false)}>
            <div style={{background:"white",borderRadius:16,padding:24,width:"100%",maxWidth:900,maxHeight:"90vh",overflowY:"auto"}} onClick={(e) => e.stopPropagation()}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
                <h2 style={{fontSize:"1.1rem",fontWeight:700}}>Net Kar Detayı</h2>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <span style={{fontSize:"0.85rem",color:"#64748b"}}>{karDetay.length} satır · Toplam: <strong>{money(anlıkKar)}</strong></span>
                  <button type="button" className="btn-secondary" style={{padding:"4px 12px"}} onClick={() => setShowKarDetay(false)}>Kapat</button>
                </div>
              </div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                  <thead>
                    <tr style={{background:"#f8fafc",borderBottom:"1.5px solid #e2e8f0"}}>
                      {["Tarih","Cari","Ürün","Ad.","Satış","Tahsilat","Maliyet","Ek Maliyet","Kar"].map((h) => (
                        <th key={h} style={{padding:"8px 10px",textAlign:h==="Cari"||h==="Ürün"||h==="Tarih"?"left":"right",fontWeight:600,color:"#64748b",whiteSpace:"nowrap"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...karDetay].sort((a,b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()).map((row, i) => (
                      <tr key={i} style={{borderBottom:"1px solid #f1f5f9",background:row.saleType==="İç Kullanım"?"#fef9c3":"white"}}>
                        <td style={{padding:"7px 10px",whiteSpace:"nowrap"}}>{toTR(row.tarih, true)}</td>
                        <td style={{padding:"7px 10px",maxWidth:130,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.cari}</td>
                        <td style={{padding:"7px 10px",maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.urun} {row.saleType==="İç Kullanım"?<span style={{fontSize:"0.7rem",color:"#92400e"}}>(İç Kullanım)</span>:null}</td>
                        <td style={{padding:"7px 10px",textAlign:"right"}}>{row.adet}</td>
                        <td style={{padding:"7px 10px",textAlign:"right"}}>{money(row.satisFiyati)}</td>
                        <td style={{padding:"7px 10px",textAlign:"right"}}>{money(row.tahsilat)}</td>
                        <td style={{padding:"7px 10px",textAlign:"right"}}>{money(row.maliyet)}</td>
                        <td style={{padding:"7px 10px",textAlign:"right"}}>{row.ekMaliyet > 0 ? money(row.ekMaliyet) : "—"}</td>
                        <td style={{padding:"7px 10px",textAlign:"right",fontWeight:500,color:row.kar<0?"#dc2626":"#16a34a"}}>{money(row.kar)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{borderTop:"1.5px solid #e2e8f0",background:"#f8fafc"}}>
                      <td colSpan={5} style={{padding:"8px 10px",fontWeight:600,color:"#64748b"}}>Toplam Tahsilat</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:600}}>{money(karDetay.reduce((s,r) => s + r.tahsilat, 0))}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:600}}>{money(karDetay.reduce((s,r) => s + r.maliyet, 0))}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:600}}>{money(karDetay.reduce((s,r) => s + r.ekMaliyet, 0))}</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:600}}></td>
                    </tr>
                    <tr style={{borderTop:"2px solid #e2e8f0",background:"#f8fafc"}}>
                      <td colSpan={8} style={{padding:"8px 10px",fontWeight:600}}>Toplam Net Kar</td>
                      <td style={{padding:"8px 10px",textAlign:"right",fontWeight:700,color:anlıkKar<0?"#dc2626":"#16a34a"}}>{money(anlıkKar)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {convertModal && (() => {
          const { preorder: po, item } = convertModal;
          const customer = customerMap.get(po.customer_id);
          const product = productMap.get(item.product_id);
          return (
            <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:"16px"}}>
              <div style={{background:"white",borderRadius:"16px",padding:"24px",width:"100%",maxWidth:"400px"}}>
                <h2 className="text-lg font-bold mb-1">Satışa Dönüştür</h2>
                <p className="text-sm text-slate-500 mb-4">{customer?.name} · {product?.name} × {item.qty}</p>
                <div className="space-y-3">
                  <div>
                    <label className="label">Birim Fiyat</label>
                    <input className="input" type="number" min="0" placeholder="Birim fiyat" value={convertPrices[item.id] || ""} onChange={(e) => setConvertPrices({ [item.id]: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Ödeme Türü</label>
                    <select className="input" value={convertPaid} onChange={(e) => setConvertPaid(e.target.value)}>
                      <option value="false">Cari borç</option>
                      <option value="true">Peşin / Ödendi</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <button type="button" className="btn" onClick={convertToSales}>Satışa Dönüştür</button>
                  <button type="button" className="btn-secondary" onClick={() => { setConvertModal(null); showToast("", "info"); }}>Vazgeç</button>
                </div>
              </div>
            </div>
          );
        })()}

        {active === "sales" && (
          <div className="space-y-4">
            <Card title="Yeni Satış Girişi">
              <div className="mb-4 flex items-center gap-3">
                <p className="flex-1 text-slate-500">Satış girebilmek için önce cari kaydı ve ürün kaydı var olmalıdır.</p>
                <button type="button" className="btn-secondary flex items-center gap-2 whitespace-nowrap" onClick={() => { setScannerOpen(true); setTimeout(startScanner, 300); }}>
                  📷 Barkod Tara
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <select className="input" value={saleForm.customerId} onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}>
                  <option value="">Cari seçin</option>
                  {sortedActiveCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="input" value={saleForm.productId} onChange={(e) => setSaleForm({ ...saleForm, productId: e.target.value, batchId: "" })}>
                  <option value="">Ürün seçin</option>
                  {sortedActiveProducts
                    .filter((p) => {
                      const totalStock = batchItemsForProduct(p.id).reduce((s, i) => s + Math.max(i.bought - getBatchSoldQtyForItem(i), 0), 0);
                      return totalStock > 0;
                    })
                    .map((p) => {
                      const totalStock = batchItemsForProduct(p.id).reduce((s, i) => s + Math.max(i.bought - getBatchSoldQtyForItem(i), 0), 0);
                      const typeName = productTypes.find((t) => t.id === p.type_id)?.name || "Türsüz";
                      return <option key={p.id} value={p.id}>[{typeName}] {p.name}  Stok: {totalStock}</option>;
                    })}
                </select>
                {/* Depo: her zaman göster, kullanıcıya göre default */}
                <select className="input" value={saleForm.depo} onChange={(e) => setSaleForm({ ...saleForm, depo: e.target.value, productId: "", batchId: "" })}>
                  <option value="56salon">56salon</option>
                  <option value="Türkiş-salon">Türkiş-salon</option>
                  <option value="Ana-depo">Ana-depo</option>
                </select>
                {/* Parti: seçili depoda birden fazla stoklu parti varsa göster */}
                {saleForm.productId && (() => {
                  const partiler = batchItemsForProduct(saleForm.productId).filter((i) => {
                    const kalan = i.bought - getBatchSoldQtyForItem(i);
                    return kalan > 0 && i.depo === saleForm.depo;
                  });
                  const uniqueBatches = [...new Map(partiler.map((i) => [i.batch_id, i])).values()];
                  if (uniqueBatches.length <= 1) return null;
                  return (
                    <select className="input" value={saleForm.batchId} onChange={(e) => setSaleForm({ ...saleForm, batchId: e.target.value })}>
                      <option value="">Tüm partiler</option>
                      {uniqueBatches.map((item) => (
                        <option key={item.batch_id} value={item.batch_id}>
                          {batchMap.get(item.batch_id)?.name || "-"}
                        </option>
                      ))}
                    </select>
                  );
                })()}
                <input className="input" type="number" min="1" placeholder="Adet" value={saleForm.qty} onChange={(e) => setSaleForm({ ...saleForm, qty: e.target.value })} />
                <select className="input" value={saleForm.seller} onChange={(e) => setSaleForm({ ...saleForm, seller: e.target.value as Seller })}>
                  {appUsers.filter((u) => u.active && u.role !== "admin").map((u) => <option key={u.id}>{u.name}</option>)}
                </select>
                <select className="input" value={saleForm.saleType} onChange={(e) => {
                  const t = e.target.value as SaleType;
                  setSaleForm({ ...saleForm, saleType: t, customSalePrice: (t === "Fire/Bozuk" || t === "İç Kullanım") ? "0" : saleForm.customSalePrice });
                }}>
                  <option>Normal satış</option><option>Fire/Bozuk</option><option>İç Kullanım</option>
                </select>
                {saleForm.saleType === "Normal satış" && (
                  <input className="input" type="number" min="0" placeholder="Satış fiyatı" value={saleForm.customSalePrice} onChange={(e) => setSaleForm({ ...saleForm, customSalePrice: e.target.value })} />
                )}
                <button type="button" className="btn" onClick={addSaleFromForm} disabled={saleLoading}>{saleLoading ? "Kaydediliyor..." : "Satışı Kaydet"}</button>
              </div>
            </Card>

            <Card title="Satış Listesi">
              <div style={{marginBottom:12, display:"flex", alignItems:"center", gap:8}}>
                <label style={{fontSize:"0.8rem", color:"var(--color-text-secondary)"}}>Durum:</label>
                <select className="input" style={{width:"auto", fontSize:"0.8rem", padding:"4px 10px"}} value={saleStatusFilter} onChange={(e) => setSaleStatusFilter(e.target.value)}>
                  <option>Tümü</option>
                  <option>Peşin</option>
                  <option>Ödendi</option>
                  <option>Cari borç</option>
                  <option>Kısmi</option>
                </select>
                {saleStatusFilter !== "Tümü" && <span style={{fontSize:"0.75rem", color:"var(--color-text-secondary)"}}>{sortedSales.length} kayıt</span>}
              </div>
              <Table
                headers={[salesTh("created_at","Tarih"), salesTh("customer","Müşteri"), salesTh("product","Ürün"), salesTh("batch","Parti"), salesTh("seller","Satıcı"), salesTh("sale_type","Tip"), salesTh("qty","Adet"), salesTh("total","Tutar"), salesTh("cost","Maliyet"), salesTh("profit","Kâr/Zarar"), salesTh("status","Durum"), "İşlem"]}
                rows={sortedSales.map((sale) => {
                  const isEditing = editingSaleId === sale.id;
                  const draft = saleDrafts[sale.id];
                  return [
                    toTR(sale.created_at),
                    customerMap.get(sale.customer_id)?.name || "-",
                    productMap.get(sale.product_id)?.name || "-",
                    batchMap.get(sale.batch_id)?.name || "-",
                    isEditing ? <select key="seller" className="input" value={draft.seller} onChange={(e) => setSaleDrafts((p) => ({ ...p, [sale.id]: { ...p[sale.id], seller: e.target.value as Seller } }))}>
                        {appUsers.filter((u) => u.active && u.role !== "admin").map((u) => <option key={u.id}>{u.name}</option>)}
                      </select> : sale.seller,
                    isEditing ? <select key="type" className="input" value={draft.sale_type} onChange={(e) => { const t = e.target.value as SaleType; setSaleDrafts((p) => ({ ...p, [sale.id]: { ...p[sale.id], sale_type: t, total: (t === "Fire/Bozuk" || t === "İç Kullanım") ? "0" : p[sale.id].total } })); }}><option>Normal satış</option><option>Fire/Bozuk</option><option>İç Kullanım</option></select> : sale.sale_type,
                    isEditing ? <input key="qty" className="input" style={{width:64}} type="number" min="1" value={draft.qty} onChange={(e) => setSaleDrafts((p) => ({ ...p, [sale.id]: { ...p[sale.id], qty: e.target.value } }))} /> : sale.qty,
                    isEditing ? <input key="total" className="input" style={{width:100}} type="number" min="0" value={draft.total} onChange={(e) => setSaleDrafts((p) => ({ ...p, [sale.id]: { ...p[sale.id], total: e.target.value } }))} /> : money(sale.total),
                    isEditing ? <input key="cost" className="input" style={{width:100}} type="number" min="0" value={draft.cost} onChange={(e) => setSaleDrafts((p) => ({ ...p, [sale.id]: { ...p[sale.id], cost: e.target.value } }))} /> : money(sale.cost),
                    isEditing
                      ? <span key="profit" className={(Number(draft.total||0) - Number(draft.cost||0)) < 0 ? "text-red-600" : ""}>{money(Number(draft.total||0) - Number(draft.cost||0))}</span>
                      : <span key={sale.id} className={sale.total - sale.cost < 0 ? "text-red-600" : ""}>{money(sale.total - sale.cost)}</span>,
                    getSaleStatus(sale),
                    isEditing
                      ? <div key="actions" className="flex gap-2"><button type="button" className="btn" onClick={() => saveSaleEdit(sale.id)}>Kaydet</button><button type="button" className="btn-secondary" onClick={() => cancelSaleEdit(sale.id)}>Vazgeç</button></div>
                      : <div key="actions" className="flex gap-2"><button type="button" className="btn-secondary" onClick={() => startSaleEdit(sale)}>Değiştir</button><button type="button" className="btn-danger" onClick={() => deleteSale(sale.id)}>Sil</button></div>,
                  ];
                })}
              />
            </Card>
          </div>
        )}

        {active === "partners" && (
          <div className="space-y-4">
            <Card title="Parti Maliyet Kaydı">
              <p className="mb-4 text-sm text-slate-500">Her parti satırındaki değerleri doldurun ve "Kaydet" butonuna basın. Yeni parti eklendiğinde otomatik alt satıra eklenir.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="p-3 text-left font-semibold border border-slate-200">Parti</th>
                      <th className="p-3 text-right font-semibold border border-slate-200">56Kasa</th>
                      <th className="p-3 text-right font-semibold border border-slate-200">Rabia</th>
                      <th className="p-3 text-right font-semibold border border-slate-200">Harun</th>
                      <th className="p-3 text-right font-semibold border border-slate-200">Kasa</th>
                      <th className="p-3 text-right font-semibold border border-slate-200">Kargo</th>
                      <th className="p-3 text-right font-semibold border border-slate-200">Diğer</th>
                      <th className="p-3 text-left font-semibold border border-slate-200">Açıklama</th>
                      <th className="p-3 text-right font-semibold border border-slate-200 bg-slate-200">Toplam Maliyet</th>
                      <th className="p-3 border border-slate-200"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedBatches.map((batch) => {
                      const row = costInputs[batch.id] || { kasaAlti: "0", rabia: "0", harun: "0", kasa: "0", kargo: "0", diger: "0", aciklama: "" };
                      const setRow = (field: string, val: string) => setCostInputs((prev) => ({ ...prev, [batch.id]: { ...(prev[batch.id] || { kasaAlti:"0", rabia:"0", harun:"0", kasa:"0", kargo:"0", diger:"0", aciklama:"" }), [field]: val } }));
                      const total = (Number(row.kasaAlti)||0) + (Number(row.rabia)||0) + (Number(row.harun)||0) + (Number(row.kasa)||0) + (Number(row.diger)||0);
                      const saveCost = async () => {
                        const existing = batchCosts.find((c) => c.batch_id === batch.id);
                        const data = { batch_id: batch.id, kasa_alti: Number(row.kasaAlti)||0, rabia: Number(row.rabia)||0, harun: Number(row.harun)||0, kasa: Number(row.kasa)||0, kargo: Number(row.kargo)||0, diger: Number(row.diger)||0, aciklama: row.aciklama || "" };
                        let saveError = null;
                        if (existing) {
                          const { error } = await supabase.from("batch_costs").update(data).eq("id", existing.id);
                          saveError = error;
                          if (!error) setBatchCosts((prev) => prev.map((c) => c.batch_id === batch.id ? { ...c, ...data, id: existing.id } : c));
                        } else {
                          const { data: inserted, error } = await supabase.from("batch_costs").insert(data).select();
                          saveError = error;
                          if (!error && inserted && inserted[0]) setBatchCosts((prev) => [...prev, inserted[0] as BatchCost]);
                        }
                        if (saveError) { showError(saveError); return; }
                        showToast(`${batch.name} maliyeti kaydedildi.`, "success");
                      };
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50">
                          <td className="p-3 font-semibold border border-slate-200">{batch.name}</td>
                          {(["kasaAlti","rabia","harun","kasa","kargo","diger"] as const).map((f) => (
                            <td key={f} className="p-1 border border-slate-200">
                              <input
                                className="w-full text-right p-2 bg-transparent hover:bg-blue-50 focus:bg-white focus:outline-none rounded"
                                type="number"
                                min="0"
                                value={row[f] === "0" ? "" : row[f]}
                                placeholder="0"
                                onChange={(e) => setRow(f, e.target.value || "0")}
                              />
                            </td>
                          ))}
                          <td className="p-1 border border-slate-200">
                            <input
                              className="w-full p-2 bg-transparent hover:bg-blue-50 focus:bg-white focus:outline-none rounded text-sm"
                              type="text"
                              value={row.aciklama || ""}
                              placeholder="—"
                              onChange={(e) => setRow("aciklama", e.target.value)}
                            />
                          </td>
                          <td className="p-3 text-right font-bold border border-slate-200 bg-slate-50">{total > 0 ? total.toLocaleString("tr-TR") : "-"}</td>
                          <td className="p-2 border border-slate-200">
                            <button type="button" className="btn-secondary text-xs px-3 py-1" onClick={saveCost}>Kaydet</button>
                          </td>
                        </tr>
                      );
                    })}
                    {/* Totals row */}
                    {sortedBatches.length > 0 && (
                      <tr className="bg-slate-200 font-bold">
                        <td className="p-3 border border-slate-300">Toplam</td>
                        {(["kasaAlti","rabia","harun","kasa","kargo","diger"] as const).map((f) => (
                          <td key={f} className="p-3 text-right border border-slate-300">
                            {batchCosts.reduce((s,c) => s + Number(c[f]||0), 0).toLocaleString("tr-TR")}
                          </td>
                        ))}
                        <td className="p-3 border border-slate-300"></td>
                        <td className="p-3 text-right border border-slate-300">
                          {batchCosts.reduce((s,c) => s + Number(c.kasa_alti||0) + Number(c.rabia||0) + Number(c.harun||0) + Number(c.kasa||0) + Number(c.diger||0), 0).toLocaleString("tr-TR")}
                        </td>
                        <td className="border border-slate-300"></td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {active === "period" && (
          <div className="space-y-4">

            <Card title="Dönem Kapanışı">
              <p className="mb-5 text-slate-500">Kasadaki para eşit dağıtılır; borcu olan ortağın payı önce borcundan düşülür.</p>
              <div className="mb-5 grid gap-4 text-sm md:grid-cols-5">
                <div className="rounded-xl bg-slate-100 p-4">Toplam tahsilat<br /><b>{money(totals.grossCash)}</b></div>
                <div className="rounded-xl bg-slate-100 p-4">Önceki dağıtımlar<br /><b>{money(totals.distributedCash)}</b></div>
                <div className="rounded-xl bg-slate-100 p-4">Kasadaki para<br /><b>{money(totals.cash)}</b></div>
                <div className="rounded-xl bg-slate-100 p-4">Rabia payı<br /><b>{money(totals.cash / 2)}</b></div>
                <div className="rounded-xl bg-slate-100 p-4">Harun payı<br /><b>{money(totals.cash / 2)}</b></div>
              </div>
              <button type="button" className="btn" onClick={closePeriod}>Dönemi Kapat ve Mahsuplaştır</button>
            </Card>

            <Card title="Dönem Geçmişi">
                  <div style={{overflowX:"auto"}}>
                    <table style={{width:"100%", borderCollapse:"collapse", fontSize:"0.85rem"}}>
                      <thead>
                        <tr style={{background:"#f8fafc", borderBottom:"1.5px solid #e2e8f0"}}>
                          <th style={{padding:"10px 12px", textAlign:"left", fontWeight:600, color:"#64748b"}}>Dönem</th>
                          <th style={{padding:"10px 12px", textAlign:"right", fontWeight:600, color:"#64748b"}}>Ürün Maliyeti</th>
                          <th style={{padding:"10px 12px", textAlign:"right", fontWeight:600, color:"#64748b"}}>Diğer Maliyetler</th>
                          <th style={{padding:"10px 12px", textAlign:"right", fontWeight:600, color:"#64748b"}}>Dönem Karı</th>
                          <th style={{padding:"10px 12px", textAlign:"right", fontWeight:600, color:"#64748b"}}>Toplam Tahsilat</th>
                          <th style={{padding:"10px 12px", textAlign:"right", fontWeight:600, color:"#64748b"}}>Rabia Net Ödeme</th>
                          <th style={{padding:"10px 12px", textAlign:"right", fontWeight:600, color:"#64748b"}}>Harun Net Ödeme</th>
                          <th style={{padding:"10px 12px", textAlign:"left", fontWeight:600, color:"#64748b"}}>Durum</th>
                          <th style={{padding:"10px 12px", textAlign:"left", fontWeight:600, color:"#64748b"}}>Kapanış</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periods.map((p) => (
                          <tr key={p.id} style={{borderBottom:"1px solid #f1f5f9"}}>
                            <td style={{padding:"10px 12px"}}>{p.name}</td>
                            {(["urun_maliyeti","diger_maliyetler","donem_kari"] as const).map((field) => (
                              <td key={field} style={{padding:"10px 12px", textAlign:"right"}}>
                                {editingNetOdemeId === `${p.id}-${field}` ? (
                                  <div style={{display:"flex", gap:4, justifyContent:"flex-end", alignItems:"center"}}>
                                    <input type="number" className="input" style={{width:90, padding:"3px 8px", fontSize:"0.8rem"}} value={editingNetOdemeVal} onChange={(e) => setEditingNetOdemeVal(e.target.value)} />
                                    <button type="button" className="btn" style={{fontSize:"0.7rem", padding:"3px 10px"}} onClick={async () => {
                                      await supabase.from("periods").update({ [field]: Number(editingNetOdemeVal) || 0 }).eq("id", p.id);
                                      setEditingNetOdemeId(null);
                                      setProcessing(false);
    loadAll();
                                    }}>Kaydet</button>
                                    <button type="button" className="btn-secondary" style={{fontSize:"0.7rem", padding:"3px 8px"}} onClick={() => setEditingNetOdemeId(null)}>✕</button>
                                  </div>
                                ) : (
                                  <div style={{display:"flex", gap:6, justifyContent:"flex-end", alignItems:"center"}}>
                                    <span>{p[field] ? money(Number(p[field])) : "—"}</span>
                                    <button type="button" className="btn-secondary" style={{fontSize:"0.65rem", padding:"2px 7px"}} onClick={() => { setEditingNetOdemeId(`${p.id}-${field}`); setEditingNetOdemeVal(String(p[field] || "")); }}>Düzenle</button>
                                  </div>
                                )}
                              </td>
                            ))}
                            <td style={{padding:"10px 12px", textAlign:"right", fontWeight:500}}>{money(Number(p.closing_cash || 0))}</td>
                            {(["rabia_net_odeme", "mihri_net_odeme"] as const).map((field) => (
                              <td key={field} style={{padding:"10px 12px", textAlign:"right"}}>
                                {editingNetOdemeId === `${p.id}-${field}` ? (
                                  <div style={{display:"flex", gap:4, justifyContent:"flex-end", alignItems:"center"}}>
                                    <input type="number" className="input" style={{width:90, padding:"3px 8px", fontSize:"0.8rem"}} value={editingNetOdemeVal} onChange={(e) => setEditingNetOdemeVal(e.target.value)} />
                                    <button type="button" className="btn" style={{fontSize:"0.7rem", padding:"3px 10px"}} onClick={async () => {
                                      await supabase.from("periods").update({ [field]: Number(editingNetOdemeVal) || 0 }).eq("id", p.id);
                                      setEditingNetOdemeId(null);
                                      setProcessing(false);
    loadAll();
                                    }}>Kaydet</button>
                                    <button type="button" className="btn-secondary" style={{fontSize:"0.7rem", padding:"3px 8px"}} onClick={() => setEditingNetOdemeId(null)}>✕</button>
                                  </div>
                                ) : (
                                  <div style={{display:"flex", gap:6, justifyContent:"flex-end", alignItems:"center"}}>
                                    <span>{p[field] ? money(p[field]!) : "—"}</span>
                                    <button type="button" className="btn-secondary" style={{fontSize:"0.65rem", padding:"2px 7px"}} onClick={() => { setEditingNetOdemeId(`${p.id}-${field}`); setEditingNetOdemeVal(String(p[field] || "")); }}>Düzenle</button>
                                  </div>
                                )}
                              </td>
                            ))}
                            <td style={{padding:"10px 12px"}}>{p.closed ? "Kapalı" : "Açık"}</td>
                            <td style={{padding:"10px 12px"}}>{p.closed_at ? new Date(p.closed_at).toLocaleDateString("tr-TR") : "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
          </div>
        )}
      </section>

      <style jsx global>{`
        .field-label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: #334155; }
        @keyframes loadbar { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .input { width: 100%; border: 1px solid #cbd5e1; border-radius: 0.75rem; background: white; padding: 0.625rem 0.75rem; outline: none; }
        .input:focus { border-color: #0f172a; }
        .btn { border-radius: 0.75rem; background: #0f172a; color: white; padding: 0.625rem 1rem; font-size: 0.875rem; }
        .btn-secondary { border: 1px solid #cbd5e1; border-radius: 0.75rem; background: white; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
        .btn-danger { border-radius: 0.75rem; background: #ef4444; color: white; padding: 0.5rem 0.75rem; font-size: 0.875rem; }

        /* ── Product Page Mobile Design ── */
        .product-page { display: flex; flex-direction: column; min-height: 100%; background: #f8fafc; }
        .product-page-header { padding: 20px 16px 4px; }
        .product-page-title { font-size: 1.5rem; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
        .product-search-wrap { padding: 12px 16px 4px; }
        .product-search-inner { display: flex; align-items: center; gap: 10px; background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 10px 14px; }
        .product-search-icon { width: 18px; height: 18px; color: #94a3b8; flex-shrink: 0; }
        .product-search-input { border: none; outline: none; background: transparent; font-size: 0.9375rem; color: #0f172a; width: 100%; }
        .product-search-input::placeholder { color: #94a3b8; }

        .product-list { display: flex; flex-direction: column; gap: 10px; padding: 12px 16px 4px; }
        .product-card { background: white; border: 1.5px solid #e2e8f0; border-radius: 18px; overflow: hidden; transition: box-shadow 0.15s; }
        .product-card--open { box-shadow: 0 4px 20px rgba(0,0,0,0.08); border-color: #cbd5e1; }

        .product-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 14px 14px 14px 16px; text-align: left; background: transparent; border: none; cursor: pointer; }
        .product-row:active { background: #f8fafc; }
        .product-row-left { flex: 1; min-width: 0; }
        .product-name { font-size: 0.9375rem; font-weight: 700; color: #0f172a; line-height: 1.3; }
        .product-meta { font-size: 0.75rem; color: #94a3b8; margin-top: 2px; }

        .product-row-stats { display: flex; gap: 6px; flex-shrink: 0; }
        .product-stat-chip { background: #f1f5f9; border-radius: 10px; padding: 5px 8px; text-align: center; min-width: 48px; }
        .product-stat-chip--low { background: #fff1f2; }
        .product-stat-label { display: block; font-size: 0.625rem; color: #64748b; font-weight: 500; line-height: 1; margin-bottom: 2px; }
        .product-stat-label--stock { color: #dc2626; }
        .product-stat-val { display: block; font-size: 0.875rem; font-weight: 700; color: #0f172a; }
        .product-stat-val--stock { color: #dc2626; }

        .product-chevron { color: #94a3b8; flex-shrink: 0; display: flex; align-items: center; }

        /* Expanded Detail Panel */
        .product-detail { border-top: 1.5px solid #f1f5f9; padding: 16px; background: #fafafa; }
        .product-info-row { display: flex; gap: 12px; margin-bottom: 16px; align-items: flex-start; }
        .product-img-box { width: 120px; height: 120px; flex-shrink: 0; border-radius: 14px; overflow: hidden; background: #f1f5f9; }
        .product-img { width: 100%; height: 100%; object-fit: cover; }
        .product-img-placeholder { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; color: #94a3b8; font-size: 0.7rem; }

        .product-info-chips { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .product-info-chips--sm { grid-template-columns: 1fr 1fr; gap: 6px; }
        .product-info-chip { background: white; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 10px 12px; }
        .product-info-chip--sm { padding: 7px 10px; border-radius: 10px; }
        .product-info-chip-label { font-size: 0.65rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 3px; }
        .product-info-chip--sm .product-info-chip-label { font-size: 0.6rem; margin-bottom: 2px; }
        .product-info-chip-val { font-size: 0.875rem; font-weight: 700; color: #0f172a; }
        .product-info-chip--sm .product-info-chip-val { font-size: 0.8125rem; }
        .product-info-chip-val--active { color: #16a34a; }
        .product-info-chip-val--passive { color: #dc2626; }

        /* Batch Table */
        .product-batch-section { margin-bottom: 16px; }
        .product-batch-title { font-size: 0.875rem; font-weight: 700; color: #0f172a; margin-bottom: 10px; }
        .product-batch-table { background: white; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; }
        .product-batch-thead { display: grid; grid-template-columns: 1.2fr 0.9fr 0.6fr 0.6fr 0.6fr 0.9fr 0.9fr; padding: 8px 12px; background: #f8fafc; font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.02em; border-bottom: 1.5px solid #e2e8f0; align-items: end; }
        .product-batch-thead > div:not(:first-child):not(:nth-child(2)) { writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; line-height: 1; }
        .product-batch-row { display: grid; grid-template-columns: 1.2fr 0.9fr 0.6fr 0.6fr 0.6fr 0.9fr 0.9fr; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; font-size: 0.8125rem; }
        .product-batch-row:last-child { border-bottom: none; }
        .product-batch-cell { color: #334155; }
        .product-batch-cell--name { font-weight: 600; color: #0f172a; }
        .product-batch-empty { padding: 12px; font-size: 0.8125rem; color: #94a3b8; text-align: center; }

        /* Action Buttons */
        .product-action-row { display: flex; gap: 8px; flex-wrap: wrap; }
        .product-btn { display: inline-flex; align-items: center; gap: 6px; border-radius: 12px; padding: 10px 14px; font-size: 0.8125rem; font-weight: 600; cursor: pointer; border: none; }
        .product-btn--secondary { background: white; color: #334155; border: 1.5px solid #e2e8f0; }
        .product-btn--danger { background: white; color: #dc2626; border: 1.5px solid #fecaca; }

        /* Edit Form */
        .product-edit-form { display: flex; flex-direction: column; gap: 14px; }
        .product-edit-image-row { display: flex; align-items: center; gap: 12px; }
        .product-img-change-btn { display: inline-flex; align-items: center; gap: 6px; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 8px 12px; font-size: 0.8125rem; font-weight: 600; color: #334155; cursor: pointer; background: white; }
        .product-edit-fields { display: grid; gap: 10px; }

        /* Add Button */
        .product-add-wrap { padding: 12px 16px 24px; }
        .product-add-wrap--top { padding: 8px 16px 4px; }
        .product-add-btn { display: flex; align-items: center; justify-content: center; gap: 10px; width: 100%; background: #0f172a; color: white; border: none; border-radius: 16px; padding: 16px; font-size: 1rem; font-weight: 700; cursor: pointer; letter-spacing: -0.01em; }
        .product-add-form-panel { padding: 16px; border-top: 1.5px solid #f1f5f9; background: #fafafa; }

        /* Cari tables */
        .stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; }
        @media (max-width: 768px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
        .cari-sales-thead { display: grid; grid-template-columns: 1.1fr 1.5fr 0.8fr 0.4fr 1fr 0.9fr; gap: 6px; padding: 8px 12px; background: #f8fafc; font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1.5px solid #e2e8f0; }
        .cari-sales-row { display: grid; grid-template-columns: 1.1fr 1.5fr 0.8fr 0.4fr 1fr 0.9fr; gap: 6px; padding: 9px 12px; border-bottom: 1px solid #f1f5f9; }
        .cari-sales-row:last-child { border-bottom: none; }
        .cari-pay-thead { display: grid; grid-template-columns: 1fr 1fr auto; padding: 8px 12px; background: #f8fafc; font-size: 0.6rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.03em; border-bottom: 1.5px solid #e2e8f0; }
        .cari-pay-row { display: grid; grid-template-columns: 1fr 1fr auto; padding: 9px 12px; border-bottom: 1px solid #f1f5f9; align-items: center; }
        .cari-pay-row:last-child { border-bottom: none; }
      `}</style>
    </main>
  );
}

export default function Home() {
  const [session, setSession] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  const login = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  if (loading) return <main className="p-8">Yükleniyor...</main>;

  if (!session) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
          <h1 className="mb-2 text-2xl font-bold">Giriş Yap</h1>
          
          <div className="space-y-3">
            <input className="w-full rounded-xl border p-3 text-slate-900" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input className="w-full rounded-xl border p-3 text-slate-900" placeholder="Şifre" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <button type="button" onClick={login} className="w-full rounded-xl bg-black p-3 font-semibold text-white">Giriş Yap</button>
          </div>
        </div>
      </main>
    );
  }

  return <AppContent onLogout={logout} />;
}