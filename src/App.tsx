import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Capacitor } from "@capacitor/core";
import { Keyboard } from "@capacitor/keyboard";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { NotificationManager } from "@/components/notifications/NotificationManager";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { RealtimeSync } from "@/components/realtime/RealtimeSync";
import { SplashScreen } from "@/components/ui/SplashScreen";
import NativeAppBridge from "@/components/native/NativeAppBridge";
import BottomNav from "@/components/layout/BottomNav";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

// ── Critical path pages: loaded eagerly (needed on first route) ──────────────
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

// ── All other pages: lazy-loaded on first navigation ────────────────────────
// This drops the initial JS bundle by ~60%, cutting TTI by 2-3 seconds on 4G.
const ForgotPassword       = lazy(() => import("./pages/ForgotPassword"));
const AddExpense           = lazy(() => import("./pages/AddExpense"));
const Expenses             = lazy(() => import("./pages/Expenses"));
const ExpenseDetail        = lazy(() => import("./pages/ExpenseDetail"));
const UPIIntegration       = lazy(() => import("./pages/UPIIntegration"));
const Groups               = lazy(() => import("./pages/Groups"));
const GroupDetail          = lazy(() => import("./pages/GroupDetail"));
const AddGroupExpense      = lazy(() => import("./pages/AddGroupExpense"));
const EditGroupExpense     = lazy(() => import("./pages/EditGroupExpense"));
const SettleUp             = lazy(() => import("./pages/SettleUp"));
const Analytics            = lazy(() => import("./pages/Analytics"));
const InsightsHistory      = lazy(() => import("./pages/InsightsHistory"));
const Budget               = lazy(() => import("./pages/Budget"));
const Install              = lazy(() => import("./pages/Install"));
const Profile              = lazy(() => import("./pages/Profile"));
const AddIncome            = lazy(() => import("./pages/AddIncome"));
const Income               = lazy(() => import("./pages/Income"));
const IncomeDetail         = lazy(() => import("./pages/IncomeDetail"));
const MonthlyWrap          = lazy(() => import("./pages/MonthlyWrap"));
const FinancialIntelligence = lazy(() => import("./pages/FinancialIntelligence"));
const NotFound             = lazy(() => import("./pages/NotFound"));

// ── Page loading skeleton (Suspense fallback) ────────────────────────────────
function PageSkeleton() {
  return (
    <div className="min-h-full bg-background flex items-center justify-center">
      <div
        className="w-8 h-8 rounded-full border-2 border-primary/40 border-t-primary animate-spin"
        role="status"
        aria-label="Loading page"
      />
    </div>
  );
}

// ── TanStack Query client ─────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,        // 30 s — keeps data current after realtime invalidation
      gcTime: 1000 * 60 * 60,      // 1 hour cache
      retry: (failureCount, error) => {
        if (!navigator.onLine) return false;
        const status = (error as any)?.status;
        if (status === 401 || status === 403) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

function App() {
  const [splashDone, setSplashDone] = useState(false);
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNative) return;

    const handleBackHint = () => {
      toast("Press back again to exit");
    };

    const handleForeground = () => {
      void queryClient.invalidateQueries();
    };

    window.addEventListener('native:back-press-hint', handleBackHint);
    window.addEventListener('native:app-foreground', handleForeground);

    return () => {
      window.removeEventListener('native:back-press-hint', handleBackHint);
      window.removeEventListener('native:app-foreground', handleForeground);
    };
  }, [isNative]);

  /* ── Native-feel: disable text selection & long-press copy menu ──────────
     CSS (user-select: none) handles the primary case, but Android WebView
     can still show the system copy/share popup on long-press if the user
     manages to initiate a selection before CSS is parsed. These JS guards
     form a second & third layer of defence.
  ─────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    /** Cancel text selection before it starts, unless target is a form field */
    const onSelectStart = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return; // allow selection inside inputs
      }
      e.preventDefault();
    };

    /** Suppress the Android long-press context menu (Copy / Share / Select All) */
    const onContextMenu = (e: Event) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return; // allow the input context menu (Paste, Select All, etc.)
      }
      e.preventDefault();
    };

    /** Clear any selection the WebView committed before JS could intercept it */
    const onTouchStart = (e: TouchEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) {
        return;
      }
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) sel.removeAllRanges();
    };

    document.addEventListener('selectstart',  onSelectStart,  { passive: false });
    document.addEventListener('contextmenu',  onContextMenu,  { passive: false });
    document.addEventListener('touchstart',   onTouchStart,   { passive: true  });

    return () => {
      document.removeEventListener('selectstart', onSelectStart);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('touchstart',  onTouchStart);
    };
  }, []);


  return (
    <QueryClientProvider client={queryClient}>
      {!isNative && !splashDone && (
        <SplashScreen duration={1800} onDone={() => setSplashDone(true)} />
      )}
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <TooltipProvider>
              {!isNative && <OfflineIndicator />}
              <NotificationManager />
              <Onboarding />
              <RealtimeSync />
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <NativeAppBridge />
                <AppRouterShell />
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </div>
    </QueryClientProvider>
  );
}

function AppRouterShell() {
  const location = useLocation();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const hideBottomNavOnRoute = ["/login", "/signup", "/forgot-password", "/install"].includes(location.pathname);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listeners: Array<{ remove: () => Promise<void> }> = [];

    const attachListeners = async () => {
      listeners.push(
        await Keyboard.addListener("keyboardWillShow", () => setIsKeyboardOpen(true))
      );
      listeners.push(
        await Keyboard.addListener("keyboardDidShow", () => setIsKeyboardOpen(true))
      );
      listeners.push(
        await Keyboard.addListener("keyboardWillHide", () => setIsKeyboardOpen(false))
      );
      listeners.push(
        await Keyboard.addListener("keyboardDidHide", () => setIsKeyboardOpen(false))
      );
    };

    void attachListeners();

    return () => {
      setIsKeyboardOpen(false);
      for (const listener of listeners) {
        void listener.remove();
      }
    };
  }, []);

  const showBottomNav = !hideBottomNavOnRoute && !isKeyboardOpen;

  return (
    <div className="app-shell" data-keyboard-open={isKeyboardOpen ? "true" : "false"}>
      <div className="app-main" data-has-bottom-nav={showBottomNav ? "true" : "false"}>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/install" element={<Install />} />

            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
            <Route path="/add-income" element={<ProtectedRoute><AddIncome /></ProtectedRoute>} />
            <Route path="/income" element={<ProtectedRoute><Income /></ProtectedRoute>} />
            <Route path="/income/:id" element={<ProtectedRoute><IncomeDetail /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
            <Route path="/expenses/:id" element={<ProtectedRoute><ExpenseDetail /></ProtectedRoute>} />
            <Route path="/upi" element={<ProtectedRoute><UPIIntegration /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route path="/groups/:id" element={<ProtectedRoute><GroupDetail /></ProtectedRoute>} />
            <Route path="/groups/:id/add-expense" element={<ProtectedRoute><AddGroupExpense /></ProtectedRoute>} />
            <Route path="/groups/:id/expenses/:expenseId/edit" element={<ProtectedRoute><EditGroupExpense /></ProtectedRoute>} />
            <Route path="/groups/:id/settle" element={<ProtectedRoute><SettleUp /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/insights/history" element={<ProtectedRoute><InsightsHistory /></ProtectedRoute>} />
            <Route path="/intelligence" element={<ProtectedRoute><FinancialIntelligence /></ProtectedRoute>} />
            <Route path="/wrap" element={<ProtectedRoute><MonthlyWrap /></ProtectedRoute>} />
            <Route path="/budget" element={<ProtectedRoute><Budget /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
      {showBottomNav && <BottomNav />}
    </div>
  );
}

export default App;