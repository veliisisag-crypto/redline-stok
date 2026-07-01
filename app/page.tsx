"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

// =============================================
// TİPLER
// =============================================

type ProductType = { id: string; name: string; active: boolean };
type AppUser = { id: string; email: string; name: string; role: "admin" | "calisan"; active: boolean; created_at: string };
type Customer = { id: string; name: string; active: boolean };
type InternalUser = { id: string; name: string; active: boolean; created_at: string };
type Product = { id: string; name: string; type_id: string | null; barcode: string | null; image_url: string | null; active: boolean; created_at: string };
type StockItem = { id: string; product_id: string; depo: string; qty: number };
type StockMovement = {
  id: string; product_id: string; depo: string; movement_type: "giris" | "cikis"; qty: number;
  exit_type?: "satis" | "ic_kullanim" | null; customer_id?: string | null; employee_id?: string | null;
  note?: string | null; user_email?: string | null; created_at: string;
};

const DEPOLAR = ["56salon", "Türkiş-salon", "Ana-depo"];

// =============================================
// YARDIMCI BİLEŞENLER
// =============================================

function Card({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function Table({ headers, rows }: { headers: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50 text-left">
            {headers.map((h, i) => <th key={i} className="px-3 py-2 font-semibold text-slate-600">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={headers.length} className="px-3 py-8 text-center text-slate-400">Kayıt yok.</td></tr>
          ) : rows.map((row, i) => (
            <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
              {row.map((cell, j) => <td key={j} className="px-3 py-2">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ title, value, note }: { title: string; value: ReactNode; note?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="text-xs font-medium text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
      {note && <div className="mt-1 text-xs text-slate-400">{note}</div>}
    </div>
  );
}

// =============================================
// ANA UYGULAMA
// =============================================

export default function StockApp() {
  const [session, setSession] = useState<boolean | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  const [loadingData, setLoadingData] = useState(true);
  const [message, setMessage] = useState("");
  const [toastType, setToastType] = useState<"success" | "error" | "info">("info");
  const [processing, setProcessing] = useState(false);

  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<"admin" | "calisan">("calisan");
  const [currentUserName, setCurrentUserName] = useState("");

  const [appUsers, setAppUsers] = useState<AppUser[]>([]);
  const [productTypes, setProductTypes] = useState<ProductType[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [internalUsers, setInternalUsers] = useState<InternalUser[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);

  const [active, setActive] = useState("dashboard");
  const [subMenuOpen, setSubMenuOpen] = useState(false);

  const showToast = (msg: string, type: "success" | "error" | "info" = "info") => {
    setMessage(msg);
    setToastType(type);
    setTimeout(() => setMessage(""), 4000);
  };

  const showError = (error: unknown) => {
    let msg = "Bilinmeyen hata";
    if (error instanceof Error) msg = error.message;
    else if (error && typeof error === "object") {
      const e = error as Record<string, unknown>;
      msg = String(e.message || e.error_description || e.details || JSON.stringify(error));
    } else if (error) msg = String(error);
    showToast("Hata: " + msg, "error");
  };

  // Auth kontrolü
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(!!data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, sess) => setSession(!!sess));
    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoginLoading(false);
    if (error) setLoginError("Giriş başarısız: " + error.message);
  };

  const onLogout = async () => {
    await supabase.auth.signOut();
  };

  const loadAll = async () => {
    setLoadingData(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email || "";
      setCurrentUserEmail(email);

      const [usersRes, typesRes, customersRes, internalUsersRes, productsRes, stockRes, movementsRes] = await Promise.all([
        supabase.from("app_users").select("*").order("name", { ascending: true }),
        supabase.from("product_types").select("*").order("name", { ascending: true }),
        supabase.from("customers").select("*").order("name", { ascending: true }),
        supabase.from("internal_users").select("*").order("name", { ascending: true }),
        supabase.from("products").select("*").order("created_at", { ascending: true }),
        supabase.from("stock_items").select("*"),
        supabase.from("stock_movements").select("*").order("created_at", { ascending: false }).limit(500),
      ]);

      for (const res of [usersRes, typesRes, customersRes, internalUsersRes, productsRes, stockRes, movementsRes]) {
        if (res.error) throw res.error;
      }

      const allUsers = (usersRes.data || []) as AppUser[];
      setAppUsers(allUsers);
      setProductTypes((typesRes.data || []) as ProductType[]);
      setCustomers((customersRes.data || []) as Customer[]);
      setInternalUsers((internalUsersRes.data || []) as InternalUser[]);
      setProducts((productsRes.data || []) as Product[]);
      setStockItems((stockRes.data || []) as StockItem[]);
      setMovements((movementsRes.data || []) as StockMovement[]);

      const currentAppUser = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
      setCurrentUserRole(currentAppUser?.role || "calisan");
      setCurrentUserName(currentAppUser?.name || email.split("@")[0]);
    } catch (err) {
      showError(err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => { if (session) loadAll(); }, [session]);

  // =============================================
  // TÜRETİLMİŞ VERİLER
  // =============================================

  const productMap = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const typeMap = useMemo(() => new Map(productTypes.map((t) => [t.id, t])), [productTypes]);
  const customerMap = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const userMap = useMemo(() => new Map(appUsers.map((u) => [u.id, u])), [appUsers]);
  const internalUserMap = useMemo(() => new Map(internalUsers.map((u) => [u.id, u])), [internalUsers]);
  const activeInternalUsers = useMemo(() => internalUsers.filter((u) => u.active), [internalUsers]);

  const stockForProduct = (productId: string) => stockItems.filter((s) => s.product_id === productId);
  const totalStockForProduct = (productId: string) => stockForProduct(productId).reduce((sum, s) => sum + s.qty, 0);
  const stockForProductDepo = (productId: string, depo: string) => stockItems.find((s) => s.product_id === productId && s.depo === depo)?.qty || 0;

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);
  const activeCustomers = useMemo(() => customers.filter((c) => c.active), [customers]);
  const activeEmployees = useMemo(() => appUsers.filter((u) => u.active), [appUsers]);

  const menu: [string, string][] = [
    ["dashboard", "Özet Tablo"],
    ["products", "Ürünler"],
    ["stockIn", "Stok Girişi"],
    ["stockOut", "Stok Çıkışı"],
  ];

  const subMenu: [string, string][] = ([
    ["customers", "Müşteriler"],
    ["internalUsers", "İç Kullanıcılar"],
    ["movements", "Hareket Geçmişi"],
    ["admin", "Kullanıcı Yönetimi"],
  ] as [string, string][]).filter(([key]) => currentUserRole === "admin" || key !== "admin");

  // =============================================
  // ÜRÜN FOTOĞRAFI RESIZE
  // =============================================
  const resizeImage = (base64: string, maxKB = 100): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        const MAX_DIM = 800;
        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) { height = Math.round(height * MAX_DIM / width); width = MAX_DIM; }
          else { width = Math.round(width * MAX_DIM / height); height = MAX_DIM; }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
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

  // =============================================
  // ÖZET TABLO İSTATİSTİKLERİ
  // =============================================
  const totals = useMemo(() => {
    const totalProducts = activeProducts.length;
    const totalStockQty = stockItems.reduce((sum, s) => sum + s.qty, 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayMovements = movements.filter((m) => m.created_at.slice(0, 10) === todayStr);
    const todayIn = todayMovements.filter((m) => m.movement_type === "giris").reduce((s, m) => s + m.qty, 0);
    const todayOut = todayMovements.filter((m) => m.movement_type === "cikis").reduce((s, m) => s + m.qty, 0);
    const lowStockProducts = activeProducts.filter((p) => totalStockForProduct(p.id) <= 2);
    return { totalProducts, totalStockQty, todayIn, todayOut, lowStockProducts };
  }, [activeProducts, stockItems, movements]);

  const recentMovements = useMemo(() => movements.slice(0, 15), [movements]);

  // =============================================
  // ÜRÜN TÜRÜ YÖNETİMİ
  // =============================================
  const [newProductTypeName, setNewProductTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState("");

  const addProductType = async () => {
    const name = newProductTypeName.trim();
    if (!name) return;
    if (productTypes.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      return showToast("Bu tür zaten mevcut.", "error");
    }
    setProcessing(true);
    const { data, error } = await supabase.from("product_types").insert({ name, active: true }).select().single();
    setProcessing(false);
    if (error) return showError(error);
    setProductTypes((prev) => [...prev, data as ProductType]);
    setNewProductTypeName("");
    showToast(`"${name}" türü eklendi.`, "success");
  };

  const updateProductTypeName = async (id: string, name: string) => {
    if (!name.trim()) return;
    await supabase.from("product_types").update({ name: name.trim() }).eq("id", id);
    setProductTypes((prev) => prev.map((t) => t.id === id ? { ...t, name: name.trim() } : t));
    setEditingTypeId(null);
  };

  const toggleProductTypeActive = async (id: string, active: boolean) => {
    await supabase.from("product_types").update({ active: !active }).eq("id", id);
    setProductTypes((prev) => prev.map((t) => t.id === id ? { ...t, active: !active } : t));
  };

  // =============================================
  // YENİ ÜRÜN EKLEME AKIŞI (6 ADIM)
  // 1-Fotoğraf  2-Barkod tara+doğrula  3-Tür  4-Adet  5-Depo  6-Kaydet
  // =============================================
  const [newProductWizardOpen, setNewProductWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<{
    image: string;
    barcode: string;
    name: string;
    typeId: string;
    qty: string;
    depo: string;
  }>({ image: "", barcode: "", name: "", typeId: "", qty: "1", depo: DEPOLAR[0] });

  const photoVideoRef = useRef<HTMLVideoElement>(null);
  const photoStreamRef = useRef<MediaStream | null>(null);
  const [photoCaptureOn, setPhotoCaptureOn] = useState(false);

  const openPhotoCapture = async () => {
    setPhotoCaptureOn(true);
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
      showToast("Kamera açılamadı. İzin verdiğinizden emin olun.", "error");
      setPhotoCaptureOn(false);
    }
  };

  const closePhotoCapture = () => {
    photoStreamRef.current?.getTracks().forEach((t) => t.stop());
    photoStreamRef.current = null;
    setPhotoCaptureOn(false);
  };

  const capturePhoto = async () => {
    if (!photoVideoRef.current) return;
    const video = photoVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")!.drawImage(video, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.9);
    const resized = await resizeImage(base64);
    setWizardData((prev) => ({ ...prev, image: resized }));
    closePhotoCapture();
    setWizardStep(2);
  };

  // EAN-13 barkod tarama (giriş akışı için)
  const wizardScanVideoRef = useRef<HTMLVideoElement>(null);
  const wizardScanControlsRef = useRef<{ stop: () => void } | null>(null);
  const [wizardScanOn, setWizardScanOn] = useState(false);
  const [wizardScanError, setWizardScanError] = useState("");

  const startWizardScan = async () => {
    setWizardScanOn(true);
    setWizardScanError("");
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
      const codeReader = new BrowserMultiFormatReader(hints);
      const videoEl = wizardScanVideoRef.current;
      if (!videoEl) return;
      const controls = await codeReader.decodeFromConstraints(
        { video: { facingMode: "environment" } },
        videoEl,
        (result) => {
          if (result) {
            const code = result.getText();
            try { controls.stop(); } catch {}
            if (videoEl.srcObject) {
              (videoEl.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
              videoEl.srcObject = null;
            }
            wizardScanControlsRef.current = null;
            setWizardScanOn(false);
            setWizardData((prev) => ({ ...prev, barcode: code }));
          }
        }
      );
      wizardScanControlsRef.current = controls;
    } catch {
      setWizardScanError("Kamera açılamadı.");
      setWizardScanOn(false);
    }
  };

  const stopWizardScan = () => {
    try { wizardScanControlsRef.current?.stop(); } catch {}
    wizardScanControlsRef.current = null;
    if (wizardScanVideoRef.current?.srcObject) {
      (wizardScanVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      wizardScanVideoRef.current.srcObject = null;
    }
    setWizardScanOn(false);
  };

  const isValidEan13 = (code: string) => /^\d{13}$/.test(code);

  const resetWizard = () => {
    setNewProductWizardOpen(false);
    setWizardStep(1);
    setWizardData({ image: "", barcode: "", name: "", typeId: "", qty: "1", depo: DEPOLAR[0] });
  };

  const finishWizard = async () => {
    if (!wizardData.name.trim()) return showToast("Ürün adı zorunlu.", "error");
    if (!wizardData.typeId) return showToast("Ürün türü seçimi zorunlu.", "error");
    if (!wizardData.barcode || !isValidEan13(wizardData.barcode)) return showToast("Geçerli bir EAN-13 barkod gerekli.", "error");
    const qty = Number(wizardData.qty);
    if (!qty || qty <= 0) return showToast("Adet 0'dan büyük olmalı.", "error");
    if (!wizardData.depo) return showToast("Depo seçimi zorunlu.", "error");

    if (products.some((p) => p.barcode === wizardData.barcode)) {
      return showToast("Bu barkod zaten kayıtlı bir ürüne ait.", "error");
    }

    setProcessing(true);
    try {
      let imageUrl: string | null = null;
      if (wizardData.image) {
        imageUrl = await uploadImageToStorage(wizardData.image, wizardData.barcode);
      }

      const { data: newProduct, error: prodErr } = await supabase.from("products").insert({
        name: wizardData.name.trim(),
        type_id: wizardData.typeId,
        barcode: wizardData.barcode,
        image_url: imageUrl,
        active: true,
      }).select().single();
      if (prodErr) throw prodErr;

      const product = newProduct as Product;
      setProducts((prev) => [...prev, product]);

      // Stok kaydı oluştur
      const { data: stockData, error: stockErr } = await supabase.from("stock_items").insert({
        product_id: product.id,
        depo: wizardData.depo,
        qty,
      }).select().single();
      if (stockErr) throw stockErr;
      setStockItems((prev) => [...prev, stockData as StockItem]);

      // Hareket kaydı
      const { data: userData } = await supabase.auth.getUser();
      const { data: moveData, error: moveErr } = await supabase.from("stock_movements").insert({
        product_id: product.id,
        depo: wizardData.depo,
        movement_type: "giris",
        qty,
        user_email: userData.user?.email || null,
      }).select().single();
      if (moveErr) throw moveErr;
      setMovements((prev) => [moveData as StockMovement, ...prev]);

      showToast(`${product.name} eklendi ve stoğa girildi.`, "success");
      resetWizard();
    } catch (err) {
      showError(err);
    } finally {
      setProcessing(false);
    }
  };

  // =============================================
  // STOK GİRİŞİ (mevcut ürüne ek stok)
  // =============================================
  const [stockInForm, setStockInForm] = useState({ productId: "", qty: "", depo: DEPOLAR[0] });
  const [stockInScanOn, setStockInScanOn] = useState(false);
  const stockInVideoRef = useRef<HTMLVideoElement>(null);
  const stockInControlsRef = useRef<{ stop: () => void } | null>(null);

  const startStockInScan = async () => {
    setStockInScanOn(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
      const codeReader = new BrowserMultiFormatReader(hints);
      const videoEl = stockInVideoRef.current;
      if (!videoEl) return;
      const controls = await codeReader.decodeFromConstraints(
        { video: { facingMode: "environment" } }, videoEl,
        (result) => {
          if (result) {
            const code = result.getText();
            try { controls.stop(); } catch {}
            if (videoEl.srcObject) { (videoEl.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); videoEl.srcObject = null; }
            stockInControlsRef.current = null;
            setStockInScanOn(false);
            const product = products.find((p) => p.barcode === code);
            if (product) {
              setStockInForm((prev) => ({ ...prev, productId: product.id }));
              showToast(`✅ ${product.name} bulundu.`, "success");
            } else {
              showToast(`Barkod bulunamadı: ${code}`, "error");
            }
          }
        }
      );
      stockInControlsRef.current = controls;
    } catch {
      showToast("Kamera açılamadı.", "error");
      setStockInScanOn(false);
    }
  };

  const stopStockInScan = () => {
    try { stockInControlsRef.current?.stop(); } catch {}
    stockInControlsRef.current = null;
    if (stockInVideoRef.current?.srcObject) { (stockInVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); stockInVideoRef.current.srcObject = null; }
    setStockInScanOn(false);
  };

  const submitStockIn = async () => {
    if (!stockInForm.productId) return showToast("Ürün seçimi zorunlu.", "error");
    const qty = Number(stockInForm.qty);
    if (!qty || qty <= 0) return showToast("Adet 0'dan büyük olmalı.", "error");
    if (processing) return;
    setProcessing(true);
    try {
      const existing = stockItems.find((s) => s.product_id === stockInForm.productId && s.depo === stockInForm.depo);
      if (existing) {
        const { error } = await supabase.from("stock_items").update({ qty: existing.qty + qty, updated_at: new Date().toISOString() }).eq("id", existing.id);
        if (error) throw error;
        setStockItems((prev) => prev.map((s) => s.id === existing.id ? { ...s, qty: s.qty + qty } : s));
      } else {
        const { data, error } = await supabase.from("stock_items").insert({ product_id: stockInForm.productId, depo: stockInForm.depo, qty }).select().single();
        if (error) throw error;
        setStockItems((prev) => [...prev, data as StockItem]);
      }
      const { data: userData } = await supabase.auth.getUser();
      const { data: moveData, error: moveErr } = await supabase.from("stock_movements").insert({
        product_id: stockInForm.productId, depo: stockInForm.depo, movement_type: "giris", qty,
        user_email: userData.user?.email || null,
      }).select().single();
      if (moveErr) throw moveErr;
      setMovements((prev) => [moveData as StockMovement, ...prev]);
      showToast("Stok girişi kaydedildi.", "success");
      setStockInForm({ productId: "", qty: "", depo: stockInForm.depo });
    } catch (err) {
      showError(err);
    } finally {
      setProcessing(false);
    }
  };

  // =============================================
  // STOK ÇIKIŞI (barkod tara → satış/iç kullanım)
  // =============================================
  const [stockOutForm, setStockOutForm] = useState({ typeId: "", productId: "", qty: "1", depo: DEPOLAR[0], exitType: "satis" as "satis" | "ic_kullanim", customerId: "", internalUserId: "" });
  const [stockOutScanOn, setStockOutScanOn] = useState(false);
  const stockOutVideoRef = useRef<HTMLVideoElement>(null);
  const stockOutControlsRef = useRef<{ stop: () => void } | null>(null);

  const startStockOutScan = async () => {
    setStockOutScanOn(true);
    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { BarcodeFormat, DecodeHintType } = await import("@zxing/library");
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13]);
      const codeReader = new BrowserMultiFormatReader(hints);
      const videoEl = stockOutVideoRef.current;
      if (!videoEl) return;
      const controls = await codeReader.decodeFromConstraints(
        { video: { facingMode: "environment" } }, videoEl,
        (result) => {
          if (result) {
            const code = result.getText();
            try { controls.stop(); } catch {}
            if (videoEl.srcObject) { (videoEl.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); videoEl.srcObject = null; }
            stockOutControlsRef.current = null;
            setStockOutScanOn(false);
            const product = products.find((p) => p.barcode === code);
            if (product) {
              // Stoklu ilk depoyu öner
              const firstStockDepo = stockForProduct(product.id).find((s) => s.qty > 0)?.depo || stockOutForm.depo;
              setStockOutForm((prev) => ({ ...prev, productId: product.id, depo: firstStockDepo }));
              showToast(`✅ ${product.name} bulundu.`, "success");
            } else {
              showToast(`Barkod bulunamadı: ${code}. Listeden seçin.`, "error");
            }
          }
        }
      );
      stockOutControlsRef.current = controls;
    } catch {
      showToast("Kamera açılamadı.", "error");
      setStockOutScanOn(false);
    }
  };

  const stopStockOutScan = () => {
    try { stockOutControlsRef.current?.stop(); } catch {}
    stockOutControlsRef.current = null;
    if (stockOutVideoRef.current?.srcObject) { (stockOutVideoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop()); stockOutVideoRef.current.srcObject = null; }
    setStockOutScanOn(false);
  };

  const submitStockOut = async () => {
    if (!stockOutForm.productId) return showToast("Ürün seçimi zorunlu.", "error");
    const qty = Number(stockOutForm.qty);
    if (!qty || qty <= 0) return showToast("Adet 0'dan büyük olmalı.", "error");
    if (!stockOutForm.depo) return showToast("Depo seçimi zorunlu.", "error");
    if (stockOutForm.exitType === "satis" && !stockOutForm.customerId) return showToast("Satış için müşteri seçimi zorunlu.", "error");
    if (stockOutForm.exitType === "ic_kullanim" && !stockOutForm.internalUserId) return showToast("İç kullanım için kişi seçimi zorunlu.", "error");

    const currentStock = stockForProductDepo(stockOutForm.productId, stockOutForm.depo);
    if (currentStock < qty) return showToast(`Yetersiz stok. ${stockOutForm.depo} deposunda sadece ${currentStock} adet var.`, "error");

    if (processing) return;
    setProcessing(true);
    try {
      const existing = stockItems.find((s) => s.product_id === stockOutForm.productId && s.depo === stockOutForm.depo)!;
      const { error } = await supabase.from("stock_items").update({ qty: existing.qty - qty, updated_at: new Date().toISOString() }).eq("id", existing.id);
      if (error) throw error;
      setStockItems((prev) => prev.map((s) => s.id === existing.id ? { ...s, qty: s.qty - qty } : s));

      const { data: userData } = await supabase.auth.getUser();
      const { data: moveData, error: moveErr } = await supabase.from("stock_movements").insert({
        product_id: stockOutForm.productId, depo: stockOutForm.depo, movement_type: "cikis", qty,
        exit_type: stockOutForm.exitType,
        customer_id: stockOutForm.exitType === "satis" ? stockOutForm.customerId : null,
        employee_id: stockOutForm.exitType === "ic_kullanim" ? stockOutForm.internalUserId : null,
        user_email: userData.user?.email || null,
      }).select().single();
      if (moveErr) throw moveErr;
      setMovements((prev) => [moveData as StockMovement, ...prev]);
      showToast("Stok çıkışı kaydedildi.", "success");
      setStockOutForm({ typeId: "", productId: "", qty: "1", depo: stockOutForm.depo, exitType: "satis", customerId: "", internalUserId: "" });
    } catch (err) {
      showError(err);
    } finally {
      setProcessing(false);
    }
  };

  // =============================================
  // MÜŞTERİ YÖNETİMİ
  // =============================================
  const [newCustomerName, setNewCustomerName] = useState("");

  const addCustomer = async () => {
    const name = newCustomerName.trim();
    if (!name) return;
    if (processing) return;
    setProcessing(true);
    const { data, error } = await supabase.from("customers").insert({ name, active: true }).select().single();
    setProcessing(false);
    if (error) return showError(error);
    setCustomers((prev) => [...prev, data as Customer]);
    setNewCustomerName("");
    showToast(`${name} eklendi.`, "success");
  };

  const toggleCustomerActive = async (id: string, active: boolean) => {
    await supabase.from("customers").update({ active: !active }).eq("id", id);
    setCustomers((prev) => prev.map((c) => c.id === id ? { ...c, active: !active } : c));
  };

  // =============================================
  // İÇ KULLANICI YÖNETİMİ
  // =============================================
  const [newInternalUserName, setNewInternalUserName] = useState("");
  const [editingInternalUserId, setEditingInternalUserId] = useState<string | null>(null);
  const [editingInternalUserName, setEditingInternalUserName] = useState("");

  const addInternalUser = async () => {
    const name = newInternalUserName.trim();
    if (!name) return;
    if (processing) return;
    setProcessing(true);
    const { data, error } = await supabase.from("internal_users").insert({ name, active: true }).select().single();
    setProcessing(false);
    if (error) return showError(error);
    setInternalUsers((prev) => [...prev, data as InternalUser]);
    setNewInternalUserName("");
    showToast(`${name} eklendi.`, "success");
  };

  const deleteInternalUser = async (id: string, name: string) => {
    if (!confirm(`"${name}" silinsin mi?`)) return;
    const { error } = await supabase.from("internal_users").delete().eq("id", id);
    if (error) return showError(error);
    setInternalUsers((prev) => prev.filter((u) => u.id !== id));
    showToast(`${name} silindi.`, "success");
  };

  const updateInternalUser = async (id: string, name: string) => {
    if (!name.trim()) return;
    await supabase.from("internal_users").update({ name: name.trim() }).eq("id", id);
    setInternalUsers((prev) => prev.map((u) => u.id === id ? { ...u, name: name.trim() } : u));
    setEditingInternalUserId(null);
    showToast("Güncellendi.", "success");
  };

  const toggleInternalUserActive = async (id: string, active: boolean) => {
    await supabase.from("internal_users").update({ active: !active }).eq("id", id);
    setInternalUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !active } : u));
  };

  // =============================================
  // KULLANICI YÖNETİMİ (Admin)
  // =============================================
  const [newUserForm, setNewUserForm] = useState({ email: "", name: "", role: "calisan" as AppUser["role"] });

  const addAppUser = async () => {
    if (!newUserForm.email || !newUserForm.name) return showToast("Email ve isim zorunlu.", "error");
    if (processing) return;
    setProcessing(true);
    const { data, error } = await supabase.from("app_users").insert({ email: newUserForm.email, name: newUserForm.name, role: newUserForm.role, active: true }).select().single();
    setProcessing(false);
    if (error) return showError(error);
    setAppUsers((prev) => [...prev, data as AppUser]);
    setNewUserForm({ email: "", name: "", role: "calisan" });
    showToast(`${(data as AppUser).name} eklendi. Supabase Authentication'da hesap oluşturmayı unutmayın!`, "success");
  };

  const toggleUserActive = async (id: string, active: boolean) => {
    await supabase.from("app_users").update({ active: !active }).eq("id", id);
    setAppUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: !active } : u));
  };

  const updateUserRole = async (id: string, role: AppUser["role"]) => {
    await supabase.from("app_users").update({ role }).eq("id", id);
    setAppUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
  };

  // =============================================
  // LOGIN EKRANI
  // =============================================
  if (session === null) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Yükleniyor...</div>;
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-2xl font-bold">Giriş Yap</h1>
          <p className="mb-6 text-sm text-slate-500">Redline Stok Takip Sistemi</p>
          <div className="space-y-3">
            <input className="input w-full" placeholder="E-posta" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <input className="input w-full" placeholder="Şifre" type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }} />
            {loginError && <p className="text-sm text-red-600">{loginError}</p>}
            <button type="button" className="btn-primary w-full" disabled={loginLoading} onClick={handleLogin}>
              {loginLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>
          </div>
        </div>
        <style jsx global>{`
          .input { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 0.9rem; }
          .input:focus { outline: 2px solid #1e293b; border-color: transparent; }
          .btn-primary { background: #0f172a; color: white; border-radius: 10px; padding: 10px 16px; font-weight: 600; font-size: 0.9rem; }
          .btn-primary:disabled { opacity: 0.6; }
          .btn { background: #0f172a; color: white; border-radius: 10px; padding: 8px 16px; font-weight: 600; font-size: 0.85rem; }
          .btn:disabled { opacity: 0.6; }
          .btn-secondary { background: white; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 16px; font-weight: 600; font-size: 0.85rem; }
          .btn-danger { background: white; border: 1px solid #fecaca; color: #dc2626; border-radius: 10px; padding: 8px 16px; font-weight: 600; font-size: 0.85rem; }
        `}</style>
      </div>
    );
  }

  // =============================================
  // RENDER
  // =============================================
  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      {/* Sidebar - Desktop */}
      <aside className="hidden w-72 flex-shrink-0 border-r border-slate-200 bg-white p-5 lg:block lg:fixed lg:h-screen lg:overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-xl font-bold">Redline</h1>
          <p className="text-xs text-slate-400">Stok Takip Sistemi</p>
        </div>
        {currentUserEmail && (
          <div className="mb-4 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            👤 {currentUserName}
          </div>
        )}
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
        <div style={{position:"fixed", right:"16px", top:"16px", zIndex:99999}}>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="rounded-xl border-2 border-slate-400 bg-white px-4 py-2 text-sm font-bold text-black shadow-2xl">
            ↑ En Üste
          </button>
        </div>

        <div className="mb-6 hidden lg:block">
          <h2 className="text-2xl font-bold">{menu.find(([k]) => k === active)?.[1] || subMenu.find(([k]) => k === active)?.[1] || ""}</h2>
        </div>

        {/* Mobil menü */}
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
          <button type="button" onClick={onLogout} className="rounded-xl px-3 py-2 bg-white text-red-600 font-semibold col-span-2">
            Çıkış
          </button>
        </div>

        {/* ============ ÖZET TABLO ============ */}
        {active === "dashboard" && (
          <div>
            <Card title="Özet Tablo">
              <p className="mb-4 text-slate-500">Ürün ve stok takibi</p>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard title="Aktif Ürün" value={totals.totalProducts} />
                <StatCard title="Toplam Stok" value={totals.totalStockQty} note="tüm depolar" />
                <StatCard title="Bugün Giriş" value={totals.todayIn} />
                <StatCard title="Bugün Çıkış" value={totals.todayOut} />
              </div>
            </Card>

            {totals.lowStockProducts.length > 0 && (
              <Card title="⚠️ Düşük Stok (≤2 adet)">
                <Table
                  headers={["Ürün", "Tür", "Toplam Stok"]}
                  rows={totals.lowStockProducts.map((p) => [
                    p.name,
                    typeMap.get(p.type_id || "")?.name || "-",
                    totalStockForProduct(p.id),
                  ])}
                />
              </Card>
            )}

            <Card title="Son Hareketler">
              <Table
                headers={["Tarih", "Ürün", "Tür", "Depo", "Adet", "Detay"]}
                rows={recentMovements.map((m) => [
                  new Date(m.created_at).toLocaleString("tr-TR"),
                  productMap.get(m.product_id)?.name || "-",
                  m.movement_type === "giris" ? "📥 Giriş" : "📤 Çıkış",
                  m.depo,
                  m.qty,
                  m.movement_type === "cikis"
                    ? (m.exit_type === "satis" ? `Satış: ${customerMap.get(m.customer_id || "")?.name || "-"}` : `İç kullanım: ${internalUserMap.get(m.employee_id || "")?.name || userMap.get(m.employee_id || "")?.name || "-"}`)
                    : "-",
                ])}
              />
            </Card>
          </div>
        )}

        {/* ============ ÜRÜNLER ============ */}
        {active === "products" && (
          <div>
            {/* Ürün Türleri */}
            <Card title="Ürün Türleri">
              <div className="mb-3 flex gap-2">
                <input className="input flex-1" placeholder="Yeni tür adı" value={newProductTypeName}
                  onChange={(e) => setNewProductTypeName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addProductType(); }} />
                <button type="button" className="btn" disabled={processing} onClick={addProductType}>{processing ? "..." : "Ekle"}</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {productTypes.map((t) => (
                  <div key={t.id} className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm border ${t.active ? "bg-slate-100 border-slate-300" : "bg-red-50 border-red-200 text-red-400"}`}>
                    {editingTypeId === t.id ? (
                      <>
                        <input className="border-b border-slate-400 bg-transparent text-sm outline-none w-28" value={editingTypeName}
                          onChange={(e) => setEditingTypeName(e.target.value)}
                          onKeyDown={(e) => { if (e.key === "Enter") updateProductTypeName(t.id, editingTypeName); if (e.key === "Escape") setEditingTypeId(null); }}
                          autoFocus />
                        <button type="button" className="text-green-600 font-bold" onClick={() => updateProductTypeName(t.id, editingTypeName)}>✓</button>
                        <button type="button" className="text-slate-400" onClick={() => setEditingTypeId(null)}>✕</button>
                      </>
                    ) : (
                      <>
                        <span>{t.name}</span>
                        <button type="button" className="text-slate-400 hover:text-slate-600 ml-1" onClick={() => { setEditingTypeId(t.id); setEditingTypeName(t.name); }}>✎</button>
                        <button type="button" className={`ml-1 text-xs ${t.active ? "text-slate-400 hover:text-red-500" : "text-red-400 hover:text-green-600"}`}
                          onClick={() => toggleProductTypeActive(t.id, t.active)}>{t.active ? "●" : "○"}</button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">● aktif &nbsp; ○ pasif &nbsp; ✎ düzenle &nbsp; Silme yok — pasife alabilirsiniz.</p>
            </Card>

            {/* Yeni Ürün Ekle Butonu */}
            {!newProductWizardOpen && (
              <button type="button" className="btn-primary mb-5 w-full" onClick={() => setNewProductWizardOpen(true)}>
                + Yeni Ürün Ekle (Fotoğraf → Barkod → Stok)
              </button>
            )}

            {/* Yeni Ürün Wizard */}
            {newProductWizardOpen && (
              <Card title={`Yeni Ürün Ekle — Adım ${wizardStep}/6`} action={<button type="button" className="text-sm text-slate-400" onClick={resetWizard}>İptal</button>}>
                {/* Adım göstergesi */}
                <div className="mb-5 flex gap-1">
                  {[1,2,3,4,5,6].map((s) => <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= wizardStep ? "bg-slate-900" : "bg-slate-200"}`} />)}
                </div>

                {/* Adım 1: Fotoğraf */}
                {wizardStep === 1 && (
                  <div className="text-center">
                    <p className="mb-4 text-slate-500">Önce ürünün fotoğrafını çekin.</p>
                    {wizardData.image ? (
                      <div>
                        <img src={wizardData.image} alt="Önizleme" className="mx-auto mb-4 h-48 w-48 rounded-xl object-cover" />
                        <div className="flex gap-2 justify-center">
                          <button type="button" className="btn-secondary" onClick={() => setWizardData((p) => ({ ...p, image: "" }))}>Tekrar Çek</button>
                          <button type="button" className="btn" onClick={() => setWizardStep(2)}>Devam Et →</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <button type="button" className="btn-primary" onClick={openPhotoCapture}>📷 Fotoğraf Çek</button>
                        <label className="btn-secondary cursor-pointer">
                          📁 Dosyadan Seç
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const resized = await resizeImage(String(reader.result || ""));
                              setWizardData((p) => ({ ...p, image: resized }));
                            };
                            reader.readAsDataURL(file);
                          }} />
                        </label>
                        <button type="button" className="text-sm text-slate-400 underline" onClick={() => setWizardStep(2)}>Fotoğrafsız devam et</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Adım 2: Barkod tara + doğrula */}
                {wizardStep === 2 && (
                  <div className="text-center">
                    <p className="mb-4 text-slate-500">Ürünün EAN-13 barkodunu tarayın.</p>
                    {wizardData.barcode ? (
                      <div>
                        <div className="mb-4 rounded-xl bg-slate-50 p-4">
                          <div className="text-xs text-slate-400 mb-1">Okunan Barkod</div>
                          <div className="text-2xl font-mono font-bold">{wizardData.barcode}</div>
                          {!isValidEan13(wizardData.barcode) && <div className="mt-2 text-sm text-red-500">⚠️ Bu geçerli bir EAN-13 kodu değil (13 hane olmalı)</div>}
                        </div>
                        <p className="mb-3 text-sm text-slate-500">Bu barkod doğru mu?</p>
                        <div className="flex gap-2 justify-center">
                          <button type="button" className="btn-secondary" onClick={() => setWizardData((p) => ({ ...p, barcode: "" }))}>↻ Tekrar Tara</button>
                          <input className="input w-40 text-center font-mono" placeholder="Manuel gir" value={wizardData.barcode} onChange={(e) => setWizardData((p) => ({ ...p, barcode: e.target.value }))} />
                          <button type="button" className="btn" disabled={!isValidEan13(wizardData.barcode)} onClick={() => setWizardStep(3)}>✓ Onayla, Devam Et</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-3">
                        <button type="button" className="btn-primary" onClick={startWizardScan}>📷 Barkod Tara</button>
                        <input className="input w-48 text-center font-mono" placeholder="veya manuel gir (13 hane)" maxLength={13}
                          onChange={(e) => { if (e.target.value.length === 13) setWizardData((p) => ({ ...p, barcode: e.target.value })); }} />
                        <button type="button" className="text-sm text-slate-400" onClick={() => setWizardStep(1)}>← Geri</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Adım 3: Ürün adı + tür */}
                {wizardStep === 3 && (
                  <div>
                    <p className="mb-4 text-slate-500 text-center">Ürün adını ve türünü girin.</p>
                    <div className="space-y-3 max-w-sm mx-auto">
                      <input className="input" placeholder="Ürün adı" value={wizardData.name} onChange={(e) => setWizardData((p) => ({ ...p, name: e.target.value }))} />
                      <select className="input" value={wizardData.typeId} onChange={(e) => setWizardData((p) => ({ ...p, typeId: e.target.value }))}>
                        <option value="">-- Ürün Türü Seç --</option>
                        {productTypes.filter((t) => t.active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <div className="flex gap-2 justify-center pt-2">
                        <button type="button" className="btn-secondary" onClick={() => setWizardStep(2)}>← Geri</button>
                        <button type="button" className="btn" disabled={!wizardData.name.trim() || !wizardData.typeId} onClick={() => setWizardStep(4)}>Devam Et →</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Adım 4: Adet */}
                {wizardStep === 4 && (
                  <div className="text-center">
                    <p className="mb-4 text-slate-500">Stoğa kaç adet girilecek?</p>
                    <input className="input w-40 mx-auto text-center text-xl" type="number" min="1" value={wizardData.qty} onChange={(e) => setWizardData((p) => ({ ...p, qty: e.target.value }))} />
                    <div className="mt-4 flex gap-2 justify-center">
                      <button type="button" className="btn-secondary" onClick={() => setWizardStep(3)}>← Geri</button>
                      <button type="button" className="btn" disabled={!Number(wizardData.qty) || Number(wizardData.qty) <= 0} onClick={() => setWizardStep(5)}>Devam Et →</button>
                    </div>
                  </div>
                )}

                {/* Adım 5: Depo */}
                {wizardStep === 5 && (
                  <div className="text-center">
                    <p className="mb-4 text-slate-500">Hangi depoya girilecek?</p>
                    <select className="input max-w-xs mx-auto" value={wizardData.depo} onChange={(e) => setWizardData((p) => ({ ...p, depo: e.target.value }))}>
                      {DEPOLAR.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <div className="mt-4 flex gap-2 justify-center">
                      <button type="button" className="btn-secondary" onClick={() => setWizardStep(4)}>← Geri</button>
                      <button type="button" className="btn" onClick={() => setWizardStep(6)}>Devam Et →</button>
                    </div>
                  </div>
                )}

                {/* Adım 6: Özet + Kaydet */}
                {wizardStep === 6 && (
                  <div className="text-center">
                    <p className="mb-4 text-slate-500">Bilgileri kontrol edin ve kaydedin.</p>
                    <div className="mx-auto max-w-sm rounded-xl bg-slate-50 p-4 text-left space-y-2 text-sm">
                      {wizardData.image && <img src={wizardData.image} alt="" className="mx-auto mb-2 h-24 w-24 rounded-lg object-cover" />}
                      <div><span className="text-slate-400">Ürün:</span> <strong>{wizardData.name}</strong></div>
                      <div><span className="text-slate-400">Tür:</span> {productTypes.find((t) => t.id === wizardData.typeId)?.name}</div>
                      <div><span className="text-slate-400">Barkod:</span> <span className="font-mono">{wizardData.barcode}</span></div>
                      <div><span className="text-slate-400">Adet:</span> {wizardData.qty}</div>
                      <div><span className="text-slate-400">Depo:</span> {wizardData.depo}</div>
                    </div>
                    <div className="mt-4 flex gap-2 justify-center">
                      <button type="button" className="btn-secondary" onClick={() => setWizardStep(5)}>← Geri</button>
                      <button type="button" className="btn-primary" disabled={processing} onClick={finishWizard}>{processing ? "Kaydediliyor..." : "✓ Kaydet"}</button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Ürün Listesi */}
            <Card title="Ürün Listesi">
              <Table
                headers={["Foto", "Ürün", "Tür", "Barkod", "Toplam Stok", "Durum"]}
                rows={products.map((p) => [
                  p.image_url ? <img src={p.image_url} alt="" className="h-12 w-12 rounded-lg object-cover" /> : <div className="h-12 w-12 rounded-lg bg-slate-100" />,
                  p.name,
                  typeMap.get(p.type_id || "")?.name || "-",
                  <span className="font-mono text-xs">{p.barcode || "-"}</span>,
                  <strong>{totalStockForProduct(p.id)}</strong>,
                  <button type="button" className={`text-xs rounded-full px-2 py-1 ${p.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    onClick={async () => {
                      await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
                      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, active: !p.active } : x));
                    }}>{p.active ? "Aktif" : "Pasif"}</button>,
                ])}
              />
            </Card>
          </div>
        )}

        {/* Fotoğraf Çekme Modalı */}
        {photoCaptureOn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-sm rounded-2xl bg-black p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">📷 Fotoğraf Çek</h3>
                <button type="button" className="rounded-full bg-white/20 px-3 py-1 text-sm text-white" onClick={closePhotoCapture}>Kapat</button>
              </div>
              <div className="relative overflow-hidden rounded-xl" style={{aspectRatio:"4/3"}}>
                <video ref={photoVideoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
              </div>
              <button type="button" className="mt-3 w-full rounded-xl bg-white py-3 text-lg font-bold text-black" onClick={capturePhoto}>📸 Çek</button>
            </div>
          </div>
        )}

        {/* Wizard Barkod Tarama Modalı */}
        {wizardScanOn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-sm rounded-2xl bg-black p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">📷 EAN-13 Barkod Tara</h3>
                <button type="button" className="rounded-full bg-white/20 px-3 py-1 text-sm text-white" onClick={stopWizardScan}>Kapat</button>
              </div>
              {wizardScanError ? (
                <div className="rounded-xl bg-red-900/50 p-4 text-center text-sm text-red-300">{wizardScanError}</div>
              ) : (
                <div className="relative overflow-hidden rounded-xl" style={{aspectRatio:"3/2"}}>
                  <video ref={wizardScanVideoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-20 w-56 rounded-xl border-4 border-white/60" style={{boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)"}} />
                  </div>
                  <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/80">Barkodu çerçeve içine alın...</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============ STOK GİRİŞİ ============ */}
        {active === "stockIn" && (
          <div>
            <Card title="Mevcut Ürüne Stok Girişi" action={
              <button type="button" className="btn-secondary" onClick={() => { setStockInScanOn(true); setTimeout(startStockInScan, 300); }}>📷 Barkod Tara</button>
            }>
              <div className="grid gap-3 md:grid-cols-3">
                <select className="input" value={stockInForm.productId} onChange={(e) => setStockInForm((p) => ({ ...p, productId: e.target.value }))}>
                  <option value="">Ürün seçin</option>
                  {activeProducts.map((p) => <option key={p.id} value={p.id}>{p.name} (Toplam stok: {totalStockForProduct(p.id)})</option>)}
                </select>
                <select className="input" value={stockInForm.depo} onChange={(e) => setStockInForm((p) => ({ ...p, depo: e.target.value }))}>
                  {DEPOLAR.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <input className="input" type="number" min="1" placeholder="Eklenecek adet" value={stockInForm.qty} onChange={(e) => setStockInForm((p) => ({ ...p, qty: e.target.value }))} />
              </div>
              {stockInForm.productId && (
                <p className="mt-2 text-sm text-slate-500">
                  {stockInForm.depo} deposunda şu an: <strong>{stockForProductDepo(stockInForm.productId, stockInForm.depo)}</strong> adet
                </p>
              )}
              <button type="button" className="btn-primary mt-3" disabled={processing} onClick={submitStockIn}>{processing ? "Kaydediliyor..." : "Stok Girişini Kaydet"}</button>
            </Card>
          </div>
        )}

        {/* ============ STOK ÇIKIŞI ============ */}
        {active === "stockOut" && (
          <div>
            <Card title="Stoktan Çıkış" action={
              <button type="button" className="btn-secondary" onClick={() => { setStockOutScanOn(true); setTimeout(startStockOutScan, 300); }}>📷 Barkod Tara</button>
            }>
              <div className="grid gap-3 md:grid-cols-2">
                {/* Tür seçimi */}
                <select className="input" value={stockOutForm.typeId} onChange={(e) => setStockOutForm((p) => ({ ...p, typeId: e.target.value, productId: "" }))}>
                  <option value="">Tüm türler</option>
                  {productTypes.filter((t) => t.active).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {/* Ürün seçimi — türe göre filtrelenmiş */}
                <select className="input" value={stockOutForm.productId} onChange={(e) => setStockOutForm((p) => ({ ...p, productId: e.target.value }))}>
                  <option value="">Ürün seçin</option>
                  {activeProducts
                    .filter((p) => totalStockForProduct(p.id) > 0 && (!stockOutForm.typeId || p.type_id === stockOutForm.typeId))
                    .map((p) => <option key={p.id} value={p.id}>{p.name} ({totalStockForProduct(p.id)} adet)</option>)}
                </select>
                <select className="input" value={stockOutForm.depo} onChange={(e) => setStockOutForm((p) => ({ ...p, depo: e.target.value }))}>
                  {DEPOLAR.map((d) => <option key={d} value={d}>{d} ({stockOutForm.productId ? stockForProductDepo(stockOutForm.productId, d) : "-"} adet)</option>)}
                </select>
                <input className="input" type="number" min="1" placeholder="Çıkış adedi" value={stockOutForm.qty} onChange={(e) => setStockOutForm((p) => ({ ...p, qty: e.target.value }))} />
              </div>

              <div className="mt-3 flex gap-3">
                <button type="button" className={`flex-1 rounded-xl border-2 p-3 text-sm font-medium transition ${stockOutForm.exitType === "satis" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
                  onClick={() => setStockOutForm((p) => ({ ...p, exitType: "satis" }))}>
                  🛍 Müşteriye Satış
                </button>
                <button type="button" className={`flex-1 rounded-xl border-2 p-3 text-sm font-medium transition ${stockOutForm.exitType === "ic_kullanim" ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-600"}`}
                  onClick={() => setStockOutForm((p) => ({ ...p, exitType: "ic_kullanim" }))}>
                  🏠 İç Kullanım
                </button>
              </div>

              <div className="mt-3">
                {stockOutForm.exitType === "satis" ? (
                  <select className="input" value={stockOutForm.customerId} onChange={(e) => setStockOutForm((p) => ({ ...p, customerId: e.target.value }))}>
                    <option value="">Müşteri seçin</option>
                    {activeCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                ) : (
                  <select className="input" value={stockOutForm.internalUserId} onChange={(e) => setStockOutForm((p) => ({ ...p, internalUserId: e.target.value }))}>
                    <option value="">Kişi seçin</option>
                    {activeInternalUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                )}
              </div>

              <button type="button" className="btn-primary mt-3" disabled={processing} onClick={submitStockOut}>{processing ? "Kaydediliyor..." : "Çıkışı Kaydet"}</button>
            </Card>
          </div>
        )}

        {/* ============ İÇ KULLANICILAR ============ */}
        {active === "internalUsers" && (
          <div>
            <Card title="Yeni İç Kullanıcı Ekle">
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="İsim (örn: Ayşe, Mehmet)" value={newInternalUserName}
                  onChange={(e) => setNewInternalUserName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addInternalUser(); }} />
                <button type="button" className="btn" disabled={processing} onClick={addInternalUser}>{processing ? "..." : "Ekle"}</button>
              </div>
              <p className="mt-2 text-xs text-slate-400">Stoktan iç kullanım ile ürün alan kişiler (uygulama hesabı gerekmez)</p>
            </Card>
            <Card title="İç Kullanıcı Listesi">
              {/* Düzenleme paneli */}
              {editingInternalUserId && (
                <div className="mb-4 rounded-xl border-2 border-blue-400 bg-blue-50 p-3">
                  <div className="mb-2 text-sm font-semibold text-blue-700">İsim Düzenle</div>
                  <div className="flex gap-2">
                    <input className="input flex-1" value={editingInternalUserName}
                      onChange={(e) => setEditingInternalUserName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") updateInternalUser(editingInternalUserId, editingInternalUserName); if (e.key === "Escape") setEditingInternalUserId(null); }}
                      autoFocus />
                    <button type="button" className="btn" onClick={() => updateInternalUser(editingInternalUserId, editingInternalUserName)}>Kaydet</button>
                    <button type="button" className="btn-secondary" onClick={() => setEditingInternalUserId(null)}>İptal</button>
                  </div>
                </div>
              )}
              <Table
                headers={["İsim", "Durum", "İşlem"]}
                rows={internalUsers.map((u) => [
                  <span className={editingInternalUserId === u.id ? "font-bold text-blue-600" : ""}>{u.name}</span>,
                  <button type="button" className={`text-xs rounded-full px-2 py-1 ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    onClick={() => toggleInternalUserActive(u.id, u.active)}>{u.active ? "Aktif" : "Pasif"}</button>,
                  <div className="flex gap-1">
                    <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={() => { setEditingInternalUserId(u.id); setEditingInternalUserName(u.name); }}>✎</button>
                    <button type="button" className="btn-danger text-xs px-2 py-1" onClick={() => deleteInternalUser(u.id, u.name)}>Sil</button>
                  </div>,
                ])}
              />
            </Card>
          </div>
        )}

        {/* ============ MÜŞTERİLER ============ */}
        {active === "customers" && (
          <div>
            <Card title="Yeni Müşteri Ekle">
              <div className="flex gap-2">
                <input className="input flex-1" placeholder="Müşteri adı" value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") addCustomer(); }} />
                <button type="button" className="btn" disabled={processing} onClick={addCustomer}>{processing ? "..." : "Ekle"}</button>
              </div>
            </Card>
            <Card title="Müşteri Listesi">
              <Table
                headers={["Müşteri", "Durum"]}
                rows={customers.map((c) => [
                  c.name,
                  <button type="button" className={`text-xs rounded-full px-2 py-1 ${c.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    onClick={() => toggleCustomerActive(c.id, c.active)}>{c.active ? "Aktif" : "Pasif"}</button>,
                ])}
              />
            </Card>
          </div>
        )}

        {/* ============ HAREKET GEÇMİŞİ ============ */}
        {active === "movements" && (
          <Card title="Tüm Stok Hareketleri">
            <Table
              headers={["Tarih", "Ürün", "Tür", "Depo", "Adet", "Detay", "İşlem Yapan"]}
              rows={movements.map((m) => [
                new Date(m.created_at).toLocaleString("tr-TR"),
                productMap.get(m.product_id)?.name || "-",
                m.movement_type === "giris" ? "📥 Giriş" : "📤 Çıkış",
                m.depo,
                m.qty,
                m.movement_type === "cikis"
                  ? (m.exit_type === "satis" ? `Satış → ${customerMap.get(m.customer_id || "")?.name || "-"}` : `İç kullanım → ${internalUserMap.get(m.employee_id || "")?.name || userMap.get(m.employee_id || "")?.name || "-"}`)
                  : "-",
                m.user_email || "-",
              ])}
            />
          </Card>
        )}

        {/* ============ ADMIN: KULLANICI YÖNETİMİ ============ */}
        {active === "admin" && currentUserRole === "admin" && (
          <div>
            <Card title="Kullanıcı Listesi">
              <Table
                headers={["İsim", "Email", "Rol", "Durum", "İşlem"]}
                rows={appUsers.map((u) => [
                  u.name,
                  u.email,
                  u.role === "admin" ? "Admin" : "Çalışan",
                  u.active ? <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">Aktif</span> : <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Pasif</span>,
                  <div className="flex gap-2">
                    <button type="button" className="btn-secondary text-xs px-2 py-1" onClick={() => toggleUserActive(u.id, u.active)}>{u.active ? "Pasife Al" : "Aktife Al"}</button>
                    <select className="input text-xs py-1" value={u.role} onChange={(e) => updateUserRole(u.id, e.target.value as AppUser["role"])}>
                      <option value="admin">Admin</option>
                      <option value="calisan">Çalışan</option>
                    </select>
                  </div>,
                ])}
              />
            </Card>
            <Card title="Yeni Kullanıcı Ekle">
              <div className="grid gap-3 md:grid-cols-4">
                <input className="input" placeholder="İsim" value={newUserForm.name} onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })} />
                <input className="input" placeholder="Email" type="email" value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} />
                <select className="input" value={newUserForm.role} onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as AppUser["role"] })}>
                  <option value="admin">Admin</option>
                  <option value="calisan">Çalışan</option>
                </select>
                <button type="button" className="btn-primary" disabled={processing} onClick={addAppUser}>{processing ? "..." : "Ekle"}</button>
              </div>
              <p className="mt-2 text-xs text-slate-400">⚠️ Kullanıcı ekledikten sonra Supabase Authentication &gt; Users kısmında aynı email ile hesap oluşturman gerekiyor.</p>
            </Card>
          </div>
        )}

        {/* Stok Girişi Barkod Modalı */}
        {stockInScanOn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-sm rounded-2xl bg-black p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">📷 Barkod Tara</h3>
                <button type="button" className="rounded-full bg-white/20 px-3 py-1 text-sm text-white" onClick={stopStockInScan}>Kapat</button>
              </div>
              <div className="relative overflow-hidden rounded-xl" style={{aspectRatio:"3/2"}}>
                <video ref={stockInVideoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-56 rounded-xl border-4 border-white/60" style={{boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)"}} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stok Çıkışı Barkod Modalı */}
        {stockOutScanOn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
            <div className="w-full max-w-sm rounded-2xl bg-black p-4 shadow-xl">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">📷 Barkod Tara</h3>
                <button type="button" className="rounded-full bg-white/20 px-3 py-1 text-sm text-white" onClick={stopStockOutScan}>Kapat</button>
              </div>
              <div className="relative overflow-hidden rounded-xl" style={{aspectRatio:"3/2"}}>
                <video ref={stockOutVideoRef} className="h-full w-full object-cover" autoPlay playsInline muted />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-20 w-56 rounded-xl border-4 border-white/60" style={{boxShadow:"0 0 0 9999px rgba(0,0,0,0.5)"}} />
                </div>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="fixed left-1/2 z-[99999] -translate-x-1/2" style={{ bottom: 32, maxWidth: "90vw", minWidth: 280 }} onClick={() => setMessage("")}>
            <div className={`flex items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl text-sm font-medium cursor-pointer ${
              toastType === "error" ? "bg-red-600 text-white" : toastType === "success" ? "bg-green-600 text-white" : "bg-slate-800 text-white"
            }`}>
              <span>{toastType === "error" ? "❌" : toastType === "success" ? "✅" : "ℹ️"}</span>
              <span className="flex-1">{message}</span>
              <span className="opacity-60 text-xs">×</span>
            </div>
          </div>
        )}
      </section>

      <style jsx global>{`
        .input { border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px 14px; font-size: 0.9rem; width: 100%; }
        .input:focus { outline: 2px solid #1e293b; border-color: transparent; }
        .btn-primary { background: #0f172a; color: white; border-radius: 10px; padding: 10px 16px; font-weight: 600; font-size: 0.9rem; }
        .btn-primary:disabled { opacity: 0.6; }
        .btn { background: #0f172a; color: white; border-radius: 10px; padding: 8px 16px; font-weight: 600; font-size: 0.85rem; }
        .btn:disabled { opacity: 0.6; }
        .btn-secondary { background: white; border: 1px solid #cbd5e1; border-radius: 10px; padding: 8px 16px; font-weight: 600; font-size: 0.85rem; }
        .btn-danger { background: white; border: 1px solid #fecaca; color: #dc2626; border-radius: 10px; padding: 8px 16px; font-weight: 600; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
