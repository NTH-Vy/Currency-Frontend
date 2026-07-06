"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Trash2, 
  Edit, 
  Plus, 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Save, 
  X,
  Globe,
  Loader2,
  Activity,
  Zap,
  ChevronRight,
  BarChart3,
  PieChart,
  LineChart,
  Filter,
  ChevronLeft,
  Eye,
  Copy,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Calendar
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/Admin/Rates.css";
import { BACK_END } from "@/lib/echo";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || `${BACK_END}/api`;

// ---------- Custom themed dropdown ----------
interface SelectOption {
  value: string;
  label: string;
}

const CustomSelect = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  onChange: (v: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between bg-black/40 border rounded-xl pl-3.5 pr-3 py-3 text-[12px] font-mono text-white transition-all focus:outline-none ${
          open
            ? "border-indigo-500/60 bg-black/60 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
            : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronRight
          size={12}
          className={`text-slate-500 transition-transform duration-200 flex-shrink-0 ml-2 ${
            open ? "rotate-90" : "-rotate-90"
          }`}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-full bg-[#13131c] border border-white/10 rounded-xl shadow-2xl shadow-black/50 overflow-hidden py-1.5"
          >
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 text-[12px] font-mono transition-colors flex items-center justify-between ${
                  opt.value === value
                    ? "bg-indigo-500/15 text-indigo-300"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                }`}
              >
                <span className="truncate">{opt.label}</span>
                {opt.value === value && <CheckCircle2 size={13} className="text-indigo-400 flex-shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ---------- Custom date picker ----------
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const WEEKDAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

const pad2 = (n: number) => String(n).padStart(2, "0");
const toDateStr = (y: number, m: number, d: number) => `${y}-${pad2(m + 1)}-${pad2(d)}`;

const CustomDatePicker = ({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() =>
    value ? new Date(`${value}T00:00:00`) : new Date()
  );
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (value) setViewDate(new Date(`${value}T00:00:00`));
  }, [value]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells: { day: number; current: boolean }[] = [];
  for (let i = firstWeekday - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, current: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true });
  let nextDay = 1;
  while (cells.length < 42) cells.push({ day: nextDay++, current: false });

  const todayStr = toDateStr(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  const formatDisplay = (v: string) => {
    if (!v) return "";
    const [y, m, d] = v.split("-");
    return `${d}/${m}/${y}`;
  };

  const handlePick = (day: number, current: boolean) => {
    if (!current) return;
    onChange(toDateStr(year, month, day));
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between bg-black/40 border rounded-xl pl-4 pr-3 py-2.5 text-[11px] font-mono transition-all focus:outline-none ${
          open ? "border-indigo-500/50 bg-black/60" : "border-white/10 hover:border-white/20"
        }`}
      >
        <span className={value ? "text-white" : "text-slate-600"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <Calendar size={12} className="text-slate-500 flex-shrink-0 ml-2" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-2 w-72 bg-[#15151f] border border-white/10 rounded-2xl shadow-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-white font-mono">
                {MONTH_NAMES[month]} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month - 1, 1))}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewDate(new Date(year, month + 1, 1))}
                  className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
              {WEEKDAY_LABELS.map((d, i) => (
                <div key={i} className="text-center text-[8px] font-mono text-slate-500 uppercase py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((c, idx) => {
                const cellStr = c.current ? toDateStr(year, month, c.day) : "";
                const isSelected = c.current && value === cellStr;
                const isToday = c.current && cellStr === todayStr;
                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={!c.current}
                    onClick={() => handlePick(c.day, c.current)}
                    className={`h-7 w-7 mx-auto flex items-center justify-center rounded-lg text-[10px] font-mono transition-all ${
                      !c.current
                        ? "text-slate-700 cursor-default"
                        : isSelected
                        ? "bg-indigo-500 text-white font-bold"
                        : isToday
                        ? "border border-indigo-500/50 text-indigo-300"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {c.day}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-[9px] font-mono text-slate-400 hover:text-white uppercase tracking-wider transition-colors"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  const t = new Date();
                  const str = toDateStr(t.getFullYear(), t.getMonth(), t.getDate());
                  onChange(str);
                  setViewDate(t);
                  setOpen(false);
                }}
                className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 uppercase tracking-wider transition-colors"
              >
                Today
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface RateInstrument {
  rate_id?: number;
  pair: string;
  name: string;
  price: string;
  change: string;
  trend: "up" | "down";
  volatility: "Low" | "Med" | "High";
  volume: string;
  category: "Forex" | "Crypto" | "Commodities";
}

interface FilterState {
  search: string;
  category: string;
  dateFrom: string;
  dateTo: string;
}

interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
}

// Updated Skeleton Components - khớp với giao diện mới
const TableHeaderSkeleton = () => (
  <tr className="border-b border-white/10 bg-white/5">
    <th className="px-6 py-4"><div className="h-3 w-20 bg-white/5 rounded animate-pulse" /></th>
    <th className="px-6 py-4"><div className="h-3 w-24 bg-white/5 rounded animate-pulse" /></th>
    <th className="px-6 py-4"><div className="h-3 w-20 bg-white/5 rounded animate-pulse" /></th>
    <th className="px-6 py-4"><div className="h-3 w-20 bg-white/5 rounded animate-pulse" /></th>
    <th className="px-6 py-4"><div className="h-3 w-16 bg-white/5 rounded animate-pulse" /></th>
    <th className="px-6 py-4 text-right"><div className="h-3 w-16 bg-white/5 rounded animate-pulse ml-auto" /></th>
  </tr>
);

const TableSkeleton = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div 
      className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
        transition: 'all 0.5s ease-out'
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono">
          <thead>
            <TableHeaderSkeleton />
          </thead>
          <tbody>
            {[...Array(10)].map((_, idx) => {
              const delay = idx * 80;
              return (
                <tr 
                  key={idx}
                  className="border-b border-white/5"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
                    transition: `all 0.4s ease-out ${delay}ms`
                  }}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse" />
                      <div className="flex flex-col gap-1.5">
                        <div className="h-4 w-20 bg-white/5 rounded animate-pulse" />
                        <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 bg-indigo-300/20 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 bg-emerald-400/20 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 w-14 bg-amber-500/20 rounded-lg animate-pulse" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 w-16 bg-indigo-400/20 rounded animate-pulse" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
                      <div className="w-8 h-8 bg-white/5 rounded-lg animate-pulse" />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const PaginationSkeleton = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div 
      className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-br from-[#11111a] to-[#0c0c12] border border-white/10 rounded-xl p-4"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(50px)',
        transition: 'all 0.5s ease-out'
      }}
    >
      <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
      <div className="flex items-center gap-1.5">
        <div className="h-8 w-16 bg-white/5 rounded-lg animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 w-8 bg-white/5 rounded-lg animate-pulse" />
        ))}
        <div className="h-8 w-16 bg-white/5 rounded-lg animate-pulse" />
      </div>
    </div>
  );
};

// Skeleton tổng thể cho trang - khớp với giao diện mới
const PageSkeleton = () => (
  <div className="flex flex-col gap-10">
    {/* Header Skeleton */}
    <div className="relative group">
      <div className="relative bg-gradient-to-br from-[#11111a] to-[#0c0c12] rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-2xl overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-3 w-full md:w-2/3">
              <div className="h-6 w-32 bg-white/5 rounded-full animate-pulse" />
              <div className="h-12 w-3/4 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-4 w-full max-w-2xl bg-white/5 rounded-lg animate-pulse" />
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            <div className="flex items-center gap-6">
              <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/5 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-10 w-28 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-10 w-36 bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Search & Filters Skeleton */}
    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-end">
      <div className="relative w-full sm:w-80">
        <div className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 h-12 animate-pulse" />
      </div>
      <div className="flex items-center gap-2">
        <div className="h-12 w-24 bg-white/5 rounded-xl animate-pulse" />
      </div>
    </div>

    {/* Table Skeleton */}
    <TableSkeleton />

    {/* Pagination Skeleton */}
    <PaginationSkeleton />
  </div>
);

// Helper functions
const getVolatilityColor = (vol: string) => {
  switch(vol) {
    case "High": return "bg-rose-500/15 border-rose-500/30 text-rose-400";
    case "Med": return "bg-amber-500/15 border-amber-500/30 text-amber-400";
    default: return "bg-emerald-500/15 border-emerald-500/30 text-emerald-400";
  }
};

const getCategoryIcon = (category: string) => {
  switch(category) {
    case "Forex": return <Globe size={10} />;
    case "Crypto": return <Zap size={10} />;
    default: return <BarChart3 size={10} />;
  }
};

export default function RatesPage() {
  const router = useRouter();
  const [rates, setRates] = useState<RateInstrument[]>([]);
  const [toast, setToast] = useState<ToastState>({ 
    message: '', 
    type: 'info', 
    visible: false 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'All',
    dateFrom: '',
    dateTo: ''
  });

  const [rateModal, setRateModal] = useState<{ show: boolean; mode: "create" | "edit"; data: RateInstrument | null }>({
    show: false, mode: "create", data: null
  });

  const [rateForm, setRateForm] = useState<RateInstrument>({
    pair: "", name: "", price: "", change: "+0.00%", trend: "up", volatility: "Med", volume: "$1.50B", category: "Forex"
  });

  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) {
      router.push("/login");
      return;
    }
    const user = JSON.parse(userStr);
    if (user.role !== "admin") {
      router.push("/");
      return;
    }

    fetchRates();
  }, [router]);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/rates/current`);
      const data = await response.json();
      if (data.success) {
        const transformedRates = data.rates.map((rate: any) => ({
          rate_id: rate.rate_id,
          pair: rate.pair,
          name: rate.name,
          price: rate.price,
          change: rate.change,
          trend: rate.trend,
          volatility: rate.volatility,
          volume: rate.volume,
          category: getCategoryFromPair(rate.pair.split('/')[0], rate.pair.split('/')[1])
        }));
        setRates(transformedRates);
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
      showToast("Failed to load rates", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryFromPair = (base: string, target: string): "Forex" | "Crypto" | "Commodities" => {
    const cryptoCurrencies = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'LINK', 'LTC', 'SHIB', 'AVAX', 'TRX', 'UNI', 'ATOM', 'XLM', 'ETC', 'FIL', 'LUNC'];
    const commodities = ['XAU', 'XAG', 'XPT', 'XPD'];
    
    if (cryptoCurrencies.includes(base) || cryptoCurrencies.includes(target)) return 'Crypto';
    if (commodities.includes(base) || commodities.includes(target)) return 'Commodities';
    return 'Forex';
  };

  const openRateModal = (mode: "create" | "edit", item?: RateInstrument) => {
    if (mode === "edit" && item) {
      setRateForm({ ...item });
      setRateModal({ show: true, mode: "edit", data: item });
    } else {
      setRateForm({
        pair: "", name: "", price: "1.0000", change: "+0.00%", trend: "up", volatility: "Med", volume: "$2.00B", category: "Forex"
      });
      setRateModal({ show: true, mode: "create", data: null });
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isUp = !rateForm.change.startsWith("-");
    const newRateItem: RateInstrument = { ...rateForm, trend: isUp ? "up" : "down" };

    try {
      const token = localStorage.getItem('token');
      const [base, target] = rateForm.pair.split('/');
      const priceChangePercent = parseFloat(rateForm.change.replace('%', ''));
      
      const payload = {
        base_currency: base,
        target_currency: target,
        exchange_rate: parseFloat(rateForm.price),
        price_change_percent: priceChangePercent,
        trend: isUp ? 'up' : 'down',
        volatility: rateForm.volatility,
        volume_24h: rateForm.volume,
        source: 'manual'
      };

      const response = await fetch(`${API_BASE_URL}/admin/rates`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.success) {
        await fetchRates();
        showToast(rateModal.mode === "edit" ? `Ledger key rebuilt: ${newRateItem.pair}` : `Registered new corridor: ${newRateItem.pair}`, "success");
        setRateModal({ show: false, mode: "create", data: null });
      } else {
        showToast('Failed to save rate', "error");
      }
    } catch (error) {
      console.error('Error saving rate:', error);
      showToast('Error saving rate', "error");
    }
  };

  const handleDeleteRate = async (pair: string) => {
    if (confirm(`Deprecate asset corridor '${pair}'?`)) {
      try {
        const rateToDelete = rates.find(r => r.pair === pair);
        if (!rateToDelete?.rate_id) {
          showToast('Rate ID not found', "error");
          return;
        }

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/admin/rates/${rateToDelete.rate_id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        if (data.success) {
          await fetchRates();
          showToast(`Depleted channel: ${pair}`, "success");
        } else {
          showToast('Failed to delete rate', "error");
        }
      } catch (error) {
        console.error('Error deleting rate:', error);
        showToast('Error deleting rate', "error");
      }
    }
  };

  const filteredRates = rates.filter(r => {
    const matchesSearch = r.pair.toLowerCase().includes(filters.search.toLowerCase()) || 
                         r.name.toLowerCase().includes(filters.search.toLowerCase());
    const matchesCategory = filters.category === "All" || r.category === filters.category;
    
    let matchesDate = true;
    if (filters.dateFrom || filters.dateTo) {
      const rateDate = new Date();
      if (filters.dateFrom) {
        matchesDate = matchesDate && rateDate >= new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        matchesDate = matchesDate && rateDate <= new Date(filters.dateTo);
      }
    }
    
    return matchesSearch && matchesCategory && matchesDate;
  });

  const totalPages = Math.ceil(filteredRates.length / itemsPerPage) || 1;
  const paginatedRates = filteredRates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setFilters({
      search: '',
      category: 'All',
      dateFrom: '',
      dateTo: ''
    });
    setCurrentPage(1);
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category]);

  // Updated: Luôn hiển thị ít nhất 1 trang
  const renderPaginationPages = () => {
    if (totalPages <= 1) {
      return (
        <motion.button
          key={1}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage(1)}
          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
            currentPage === 1
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-slate-400'
          }`}
        >
          1
        </motion.button>
      );
    }
    
    const total = totalPages;
    const current = currentPage;
    let pages: (number | string)[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push('...');
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push('...');
      pages.push(total);
    }
    
    return pages.map((pageNum, idx) => {
      if (pageNum === '...') {
        return (
          <span key={`ellipsis-${idx}`} className="px-2 text-slate-500 text-[8px] font-mono">…</span>
        );
      }
      return (
        <motion.button
          key={pageNum}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setCurrentPage(pageNum as number)}
          className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
            current === pageNum
              ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md'
              : 'bg-white/5 hover:bg-white/10 text-slate-400'
          }`}
        >
          {pageNum}
        </motion.button>
      );
    });
  };

  // Render rows - luôn hiển thị đúng 10 dòng
  const renderRows = () => {
    const rows = [];
    const totalRows = itemsPerPage;
    
    if (paginatedRates.length === 0) {
      // Không có dữ liệu -> 10 dòng trống, KHÔNG có gạch ngang
      for (let i = 0; i < totalRows; i++) {
        rows.push(
          <tr key={`empty-${i}`} className="pointer-events-none">
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] text-right border-none">&nbsp;</td>
          </tr>
        );
      }
    } else {
      // Có dữ liệu - TẤT CẢ các dòng có nội dung đều có gạch ngang
      for (let i = 0; i < paginatedRates.length; i++) {
        const rate = paginatedRates[i];
        const isLastRow = i === paginatedRates.length - 1;
        rows.push(
          <motion.tr 
            key={`data-${i}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            onMouseEnter={() => setHoveredRow(rate.pair)}
            onMouseLeave={() => setHoveredRow(null)}
            className={`hover:bg-white/5 transition-all group border-b border-white/5`}
          >
            <td className="px-6 py-4">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center">
                    <DollarSign size={12} className="text-indigo-400" />
                  </div>
                  <div>
                    <span className="text-white font-black text-sm font-sans tracking-tight">{rate.pair}</span>
                    <span className="text-[7px] text-slate-500 font-mono block uppercase">{rate.name}</span>
                  </div>
                </div>
              </div>
            </td>
            <td className="px-6 py-4">
              <span className="text-indigo-300 font-black text-sm">{rate.price}</span>
            </td>
            <td className="px-6 py-4">
              <div className={`flex items-center gap-1.5 font-black text-[9px] ${rate.trend === "up" ? "text-emerald-400" : "text-rose-400"}`}>
                {rate.trend === "up" ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {rate.change}
              </div>
            </td>
            <td className="px-6 py-4">
              <span className={`px-2 py-1 rounded-lg text-[7px] font-black border uppercase ${getVolatilityColor(rate.volatility)}`}>
                {rate.volatility}
              </span>
            </td>
            <td className="px-6 py-4">
              <div className="flex items-center gap-1.5">
                {getCategoryIcon(rate.category)}
                <span className="text-indigo-400 text-[8px] font-black uppercase tracking-widest">{rate.category}</span>
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <div className="flex justify-end gap-2">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => openRateModal("edit", rate)} 
                  className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-500/30"
                >
                  <Edit size={12} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDeleteRate(rate.pair)} 
                  className="p-2 bg-white/5 rounded-lg text-slate-400 hover:text-rose-400 transition-all border border-transparent hover:border-rose-500/30"
                >
                  <Trash2 size={12} />
                </motion.button>
              </div>
            </td>
          </motion.tr>
        );
      }
      
      // Thêm các dòng trống phía dưới để đủ 10 dòng - KHÔNG CÓ gạch ngang
      for (let i = paginatedRates.length; i < totalRows; i++) {
        rows.push(
          <tr key={`empty-${i}`} className="pointer-events-none">
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] border-none">&nbsp;</td>
            <td className="px-6 py-4 h-[73px] text-right border-none">&nbsp;</td>
          </tr>
        );
      }
    }

    return rows;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#02020a] via-[#050510] to-[#02020a] text-slate-100 selection:bg-indigo-500/30 font-sans overflow-x-hidden pt-36 pb-20">
      
      {/* Ambient Background */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-indigo-600/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-[5%] left-[-15%] w-[600px] h-[600px] bg-purple-600/6 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-cyan-600/4 rounded-full blur-[100px]" />
        <div 
          className="absolute inset-0 opacity-[0.02]" 
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full flex flex-col gap-10">
        
        {isLoading ? (
          <PageSkeleton />
        ) : (
          <>
            {/* 1. JUMBOTRON HEADER */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 via-purple-500/30 to-indigo-500/30 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-700" />
              <div className="relative bg-gradient-to-br from-[#11111a] to-[#0c0c12] rounded-[2.5rem] p-8 md:p-10 border border-white/10 shadow-2xl overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                <div className="relative z-10 flex flex-col gap-6">
                  {/* Row 1: Title + Badge */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-col gap-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-full w-fit">
                        <Globe size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 font-mono">Global Rates Matrix</span>
                      </div>
                      <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter uppercase text-white leading-none">
                        Instrument <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-400">Ledger</span>
                      </h1>
                      <p className="text-xs text-slate-500 max-w-xl font-medium leading-relaxed">
                        Management of real-time currency pairs, crypto tokens, and commodity indices. Ensure nominal parity across all active gateway nodes.
                      </p>
                    </div>
                  </div>
                  
                  {/* Row 2: Stats + Buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-6 text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Total:</span>
                        <span className="text-white font-bold">{rates.length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-400">●</span>
                        <span>Forex: {rates.filter(r => r.category === 'Forex').length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-amber-400">●</span>
                        <span>Crypto: {rates.filter(r => r.category === 'Crypto').length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400">●</span>
                        <span>Commodities: {rates.filter(r => r.category === 'Commodities').length}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => fetchRates()}
                        className="bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 border border-white/10 hover:border-white/20"
                      >
                        <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} /> 
                        {isLoading ? "Loading..." : "Refresh"}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => openRateModal("create")}
                        className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-mono text-[9px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                      >
                        <Plus size={14} />
                        <span>Deploy Asset</span>
                      </motion.button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 2. SEARCH & FILTERS */}
            <div className="flex flex-col gap-6">
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-end"
              >
                <div className="relative w-full sm:w-80 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={14} />
                  <input 
                    placeholder="Search pairs or sectors..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 hover:border-white/20 focus:border-indigo-500/50 rounded-xl py-3 pl-10 pr-4 text-[11px] font-mono text-white placeholder:text-slate-600 focus:outline-none focus:bg-black/60 transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                      showFilters 
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-400' 
                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <Filter size={12} />
                    Filters
                    {Object.values(filters).some(v => v !== '' && v !== 'All') && (
                      <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </motion.button>
                  {(filters.search || filters.category !== 'All' || filters.dateFrom || filters.dateTo) && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={resetFilters}
                      className="px-3 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all text-[8px] font-mono uppercase tracking-wider flex items-center gap-1"
                    >
                      <X size={12} /> Clear
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {/* Filter Panel */}
              <AnimatePresence>
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="relative bg-gradient-to-br from-[#11111a] to-[#0c0c12] border border-white/10 rounded-2xl p-6 shadow-xl">
                      <div className="absolute inset-0 rounded-2xl overflow-hidden bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
                      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Category */}
                        <div>
                          <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <BarChart3 size={10} className="text-indigo-400" />
                            Category
                          </label>
                          <CustomSelect
                            value={filters.category}
                            onChange={(v) => setFilters(prev => ({ ...prev, category: v }))}
                            options={[
                              { value: "All", label: "All categories" },
                              { value: "Forex", label: "Forex" },
                              { value: "Crypto", label: "Crypto" },
                              { value: "Commodities", label: "Commodities" },
                            ]}
                          />
                        </div>

                        {/* From Date */}
                        <div>
                          <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Calendar size={10} className="text-indigo-400" />
                            From Date
                          </label>
                          <CustomDatePicker
                            value={filters.dateFrom}
                            onChange={(v) => setFilters(prev => ({ ...prev, dateFrom: v }))}
                          />
                        </div>

                        {/* To Date */}
                        <div>
                          <label className="text-[8px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                            <Calendar size={10} className="text-indigo-400" />
                            To Date
                          </label>
                          <CustomDatePicker
                            value={filters.dateTo}
                            onChange={(v) => setFilters(prev => ({ ...prev, dateTo: v }))}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono">
                    <thead>
                      <tr className="border-b border-white/10 bg-white/5 text-[8px] text-slate-400 uppercase tracking-[0.2em] font-black">
                        <th className="px-6 py-4">Instrument</th>
                        <th className="px-6 py-4">Nominal Price</th>
                        <th className="px-6 py-4">24h Change</th>
                        <th className="px-6 py-4">Volatility</th>
                        <th className="px-6 py-4">Sector</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {renderRows()}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </div>

            {/* PAGINATION - Luôn hiển thị */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-br from-[#11111a] to-[#0c0c12] border border-white/10 rounded-xl p-4"
            >
              <div className="text-[8px] font-mono text-slate-500">
                {filteredRates.length > 0 ? (
                  `Showing ${((currentPage - 1) * itemsPerPage) + 1} to ${Math.min(currentPage * itemsPerPage, filteredRates.length)} of ${filteredRates.length} entries`
                ) : (
                  `Showing 0 of 0 entries`
                )}
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                >
                  <ChevronLeft size={10} /> Prev
                </motion.button>
                
                {renderPaginationPages()}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || filteredRates.length === 0}
                  className="px-3 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1"
                >
                  Next <ChevronRight size={10} />
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* TOAST */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ duration: 0.3, type: "spring", stiffness: 400 }}
            className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl border backdrop-blur-xl flex items-center gap-3 shadow-2xl ${
              toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200' :
              toast.type === 'error' ? 'bg-red-500/15 border-red-500/40 text-red-200' :
              toast.type === 'warning' ? 'bg-yellow-500/15 border-yellow-500/40 text-yellow-200' :
              'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'warning' && <AlertCircle size={16} />}
            {toast.type === 'info' && <DollarSign size={16} />}
            <p className="text-sm font-medium">{toast.message}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MODAL UI */}
      <AnimatePresence>
        {rateModal.show && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setRateModal({ show: false, mode: "create", data: null })}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gradient-to-br from-[#11111a] to-[#0c0c12] border border-white/10 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-white/5 to-transparent">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 rounded-lg">
                    {rateModal.mode === "edit" ? <Edit size={14} className="text-indigo-400" /> : <Plus size={14} className="text-indigo-400" />}
                  </div>
                  <div>
                    <h3 className="text-base font-black uppercase text-white">
                      {rateModal.mode === "edit" ? "Modify Instrument" : "Deploy Asset"}
                    </h3>
                    <p className="text-[7px] text-slate-500 font-mono">Asset Parameters Configuration</p>
                  </div>
                </div>
                <button 
                  onClick={() => setRateModal({ show: false, mode: "create", data: null })} 
                  className="text-slate-500 hover:text-white p-1.5 rounded-lg bg-white/5 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleRateSubmit} className="p-6 flex flex-col gap-5">
                <div className="space-y-3">
                  <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Globe size={8} /> Pair Code (e.g. USD/VND)
                  </label>
                  <input 
                    required 
                    value={rateForm.pair}
                    onChange={(e) => setRateForm({ ...rateForm, pair: e.target.value.toUpperCase() })}
                    className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-sm font-mono font-black text-white outline-none transition-all"
                    placeholder="EUR/USD"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Activity size={8} /> Full Name
                  </label>
                  <input 
                    required 
                    value={rateForm.name}
                    onChange={(e) => setRateForm({ ...rateForm, name: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-sm font-mono text-white outline-none transition-all"
                    placeholder="Euro / US Dollar"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest">Price</label>
                    <input 
                      required 
                      value={rateForm.price}
                      onChange={(e) => setRateForm({ ...rateForm, price: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-sm font-mono font-black text-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest">24h Change</label>
                    <input 
                      required 
                      value={rateForm.change}
                      onChange={(e) => setRateForm({ ...rateForm, change: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl p-3 text-sm font-mono text-white outline-none transition-all"
                      placeholder="+0.00%"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest">Category</label>
                    <select
                      value={rateForm.category}
                      onChange={(e) => setRateForm({ ...rateForm, category: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl p-2.5 text-[11px] font-mono text-white outline-none transition-all cursor-pointer"
                    >
                      <option value="Forex">Forex</option>
                      <option value="Crypto">Crypto</option>
                      <option value="Commodities">Commodities</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest">Volatility</label>
                    <select
                      value={rateForm.volatility}
                      onChange={(e) => setRateForm({ ...rateForm, volatility: e.target.value as any })}
                      className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl p-2.5 text-[11px] font-mono text-white outline-none transition-all cursor-pointer"
                    >
                      <option value="Low">Low</option>
                      <option value="Med">Medium</option>
                      <option value="High">High</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[7px] font-mono font-black text-slate-500 uppercase tracking-widest">Volume</label>
                    <input 
                      value={rateForm.volume}
                      onChange={(e) => setRateForm({ ...rateForm, volume: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 focus:border-indigo-500/50 rounded-xl p-2.5 text-[11px] font-mono text-white outline-none transition-all"
                      placeholder="$1.00B"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setRateModal({ show: false, mode: "create", data: null })}
                    className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all"
                  >
                    Cancel
                  </button>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit" 
                    className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                  >
                    <Save size={12} /> {rateModal.mode === "edit" ? "Commit Changes" : "Deploy Asset"}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}