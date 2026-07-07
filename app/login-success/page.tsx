"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

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
      className="flex flex-col items-center gap-6 w-full max-w-md"
    >
      {/* Skeleton Card */}
      <div className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 space-y-6">
        {/* Skeleton Header */}
        <div className="space-y-3">
          <div className="h-8 bg-slate-800 rounded-lg animate-pulse w-3/4 mx-auto" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2 mx-auto" />
        </div>

        {/* Skeleton Body */}
        <div className="space-y-4">
          <div className="h-4 bg-slate-800 rounded animate-pulse" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-slate-800 rounded animate-pulse w-4/6" />
        </div>

        {/* Skeleton Progress Bar */}
        <div className="space-y-2">
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
            />
          </div>
          <div className="h-3 bg-slate-800 rounded animate-pulse w-1/3 mx-auto" />
        </div>
      </div>

      {/* Skeleton Status */}
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
        <div className="h-4 bg-slate-800 rounded animate-pulse w-32" />
      </div>
    </motion.div>
  );
}

// 2. Component chính (Page) xuất ra ngoài, bọc component con trong Suspense
export default function LoginSuccess() {
  return (
    <div className="min-h-screen bg-[#05050a] flex items-center justify-center text-white font-mono" suppressHydrationWarning>
      <Suspense 
        fallback={
          <div className="flex flex-col items-center gap-6 w-full max-w-md">
            {/* Skeleton Card */}
            <div className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 space-y-6">
              {/* Skeleton Header */}
              <div className="space-y-3">
                <div className="h-8 bg-slate-800 rounded-lg animate-pulse w-3/4 mx-auto" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-1/2 mx-auto" />
              </div>

              {/* Skeleton Body */}
              <div className="space-y-4">
                <div className="h-4 bg-slate-800 rounded animate-pulse" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-5/6" />
                <div className="h-4 bg-slate-800 rounded animate-pulse w-4/6" />
              </div>

              {/* Skeleton Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full animate-pulse" />
                </div>
                <div className="h-3 bg-slate-800 rounded animate-pulse w-1/3 mx-auto" />
              </div>
            </div>

            {/* Skeleton Status */}
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse" />
              <div className="h-4 bg-slate-800 rounded animate-pulse w-32" />
            </div>
          </div>
        }
      >
        <LoginSuccessContent />
      </Suspense>
    </div>
  );
}