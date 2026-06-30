"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

// 1. Tách logic xử lý Token & URL vào component con này
function LoginSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (token && userParam) {
      try {
        const userData = JSON.parse(decodeURIComponent(userParam));
        // Lưu vào LocalStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        
        // Kích hoạt sự kiện để Header cập nhật
        window.dispatchEvent(new Event("auth-changed"));

        // Chuyển hướng sau 1.5 giây
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } catch (error) {
        console.error("Error parsing user data:", error);
        router.push("/login?error=auth_failed");
      }
    } else {
      router.push("/login?error=auth_failed");
    }
  }, [searchParams, router]);

  return (
    <motion.div
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-4"
    >
      <Loader2 className="animate-spin text-indigo-500" size={40} />
      <h2 className="text-xl font-bold tracking-widest uppercase">Initializing Session...</h2>
      <p className="text-slate-500 text-sm">Synchronizing with Secure Terminal</p>
    </motion.div>
  );
}

// 2. Component chính (Page) xuất ra ngoài, bọc component con trong Suspense
export default function LoginSuccess() {
  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center text-white font-mono" suppressHydrationWarning>
      <Suspense 
        fallback={
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="animate-spin text-indigo-500" size={40} />
            <h2 className="text-xl font-bold tracking-widest uppercase text-slate-500">Loading Secure Boundary...</h2>
          </div>
        }
      >
        <LoginSuccessContent />
      </Suspense>
    </div>
  );
}