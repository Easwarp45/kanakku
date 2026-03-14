import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { NotificationManager } from "@/components/notifications/NotificationManager";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import Dashboard from "./pages/Dashboard";
import AddExpense from "./pages/AddExpense";
import Expenses from "./pages/Expenses";
import ExpenseDetail from "./pages/ExpenseDetail";
import UPIIntegration from "./pages/UPIIntegration";
import Groups from "./pages/Groups";
import GroupDetail from "./pages/GroupDetail";
import AddGroupExpense from "./pages/AddGroupExpense";
import SettleUp from "./pages/SettleUp";
import Analytics from "./pages/Analytics";
import Budget from "./pages/Budget";
import Install from "./pages/Install";
import Profile from "./pages/Profile";
import AddIncome from "./pages/AddIncome";
import Income from "./pages/Income";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      retry: (failureCount, error) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        return failureCount < 3;
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
    <AuthProvider>
      <TooltipProvider>
        <OfflineIndicator />
        <InstallPrompt />
        <NotificationManager />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/install" element={<Install />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-expense"
              element={
                <ProtectedRoute>
                  <AddExpense />
                </ProtectedRoute>
              }
            />
            <Route
              path="/add-income"
              element={
                <ProtectedRoute>
                  <AddIncome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/income"
              element={
                <ProtectedRoute>
                  <Income />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <ProtectedRoute>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/expenses/:id"
              element={
                <ProtectedRoute>
                  <ExpenseDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/upi"
              element={
                <ProtectedRoute>
                  <UPIIntegration />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups"
              element={
                <ProtectedRoute>
                  <Groups />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id"
              element={
                <ProtectedRoute>
                  <GroupDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id/add-expense"
              element={
                <ProtectedRoute>
                  <AddGroupExpense />
                </ProtectedRoute>
              }
            />
            <Route
              path="/groups/:id/settle"
              element={
                <ProtectedRoute>
                  <SettleUp />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/budget"
              element={
                <ProtectedRoute>
                  <Budget />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;