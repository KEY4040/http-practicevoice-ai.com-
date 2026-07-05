import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";

// Eager: marketing + auth are the first-paint entry points.
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import NotFound from "@/pages/NotFound";

// Lazy: the app shell (and its heavier chart deps) load only once signed in.
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const CallHistory = lazy(() => import("@/pages/dashboard/CallHistory"));
const CallDetail = lazy(() => import("@/pages/dashboard/CallDetail"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));

function PageFallback() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            {/* Marketing */}
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* App (protected) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/calls"
              element={
                <ProtectedRoute>
                  <CallHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/calls/:id"
              element={
                <ProtectedRoute>
                  <CallDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
