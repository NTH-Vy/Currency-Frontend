// footer.tsx - Responsive hoàn chỉnh
"use client";
import { 
  Globe, 
  ArrowRight, 
  Info,
  Send, 
  MessageSquare, 
  Code, 
  Share2 
} from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Converter", href: "/converter" },
    { name: "Rates", href: "/rates" },
    { name: "History", href: "/history" },
    { name: "News", href: "/news" },
    { name: "Community", href: "/community" },
  ];

  const popularConversions = [
    { name: "USD → VND", href: "/converter" },
    { name: "EUR → VND", href: "/converter" },
    { name: "JPY → VND", href: "/converter" },
    { name: "VND → USD", href: "/converter" },
  ];

  const support = [
    { name: "Contact", href: "/contact" },
    { name: "FAQ", href: "/faq" },
    { name: "Help Center", href: "/support" },
  ];

  const legal = [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "Disclaimer", href: "/disclaimer" },
  ];

  const socialIcons = [
    { Icon: Send, label: "Twitter" },
    { Icon: Code, label: "Github" },
    { Icon: MessageSquare, label: "LinkedIn" },
    { Icon: Share2, label: "Facebook" },
  ];

  return (
    <footer className="relative bg-[#0a0a0b] border-t border-white/5 pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-10 lg:pb-12 overflow-hidden">
      {/* Hiệu ứng ánh sáng nền */}
      <div className="absolute bottom-0 right-0 w-[300px] sm:w-[400px] h-[300px] sm:h-[400px] bg-indigo-600/5 rounded-full blur-[100px] sm:blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-8 pb-10 sm:pb-14 lg:pb-16">
          
          {/* 1. Brand Column - Full width trên mobile */}
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-600 blur-lg opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative bg-indigo-600 p-2 sm:p-2.5 rounded-xl transition-transform duration-300">
                  <Globe className="text-white sm:w-[20px] sm:h-[20px]" size={18} />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tighter text-white uppercase">
                Currency<span className="text-indigo-500">X</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-sm">
              The world's leading real-time exchange infrastructure. Professional-grade 
              market data and instant currency conversion for the global economy.
            </p>
            <div className="flex gap-2 sm:gap-4">
              {socialIcons.map((social, i) => (
                <button 
                  key={i} 
                  title={social.label}
                  className="p-2.5 sm:p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                  aria-label={social.label}
                >
                  <social.Icon size={16} className="sm:w-[20px] sm:h-[20px]" />
                </button>
              ))}
            </div>
          </div>

          {/* 2. Quick Links */}
          <div className="sm:col-span-1 lg:col-span-2 flex flex-col gap-4 sm:gap-6">
            <h4 className="text-white text-xs sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] px-2 sm:px-3 border-l-2 border-indigo-600">
              Quick Links
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm sm:text-base font-bold inline-flex items-center gap-2 group">
                    {link.name}
                    <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px] opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-500" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Conversions */}
          <div className="sm:col-span-1 lg:col-span-2 flex flex-col gap-4 sm:gap-6">
            <h4 className="text-white text-xs sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] px-2 sm:px-3 border-l-2 border-indigo-600">
              Conversions
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-3">
              {popularConversions.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm sm:text-base font-bold italic">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Support */}
          <div className="sm:col-span-1 lg:col-span-2 flex flex-col gap-4 sm:gap-6">
            <h4 className="text-white text-xs sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] px-2 sm:px-3 border-l-2 border-indigo-600">
              Support
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-3">
              {support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm sm:text-base font-bold">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 5. Legal */}
          <div className="sm:col-span-1 lg:col-span-2 flex flex-col gap-4 sm:gap-6">
            <h4 className="text-white text-xs sm:text-sm font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] px-2 sm:px-3 border-l-2 border-indigo-600">
              Legal
            </h4>
            <ul className="flex flex-col gap-2 sm:gap-3">
              {legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 hover:text-white transition-colors text-sm sm:text-base font-bold">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 sm:pt-10 lg:pt-12 border-t border-white/5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6 lg:gap-8">
            <div className="flex gap-2 sm:gap-3 lg:gap-4 max-w-3xl">
              <Info size={18} className="sm:w-[22px] sm:h-[22px] shrink-0 text-indigo-500/50 mt-0.5" />
              <p className="text-slate-500 text-[9px] sm:text-[10px] lg:text-xs font-bold uppercase tracking-widest leading-relaxed">
                <span className="text-slate-300">Financial Disclaimer:</span> Exchange rates are for informational purposes only. CurrencyX does not guarantee the accuracy of rates 
                provided and are subject to market volatility. Please consult with a financial advisor for large transactions.
              </p>
            </div>
            <div className="flex flex-col lg:items-end gap-0.5 sm:gap-1 shrink-0">
              <span className="text-white font-black text-sm sm:text-base tracking-tighter uppercase">© 2026 CurrencyX.</span>
              <span className="text-slate-600 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] sm:tracking-[0.3em]">Institutional Grade Infrastructure</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}