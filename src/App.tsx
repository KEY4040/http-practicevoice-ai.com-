import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { SubscriptionGate } from "@/components/SubscriptionGate";
import { DemoViewProvider } from "@/context/DemoView";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Eager: marketing + auth are the first-paint entry points.
import Home from "@/pages/Home";
import Pricing from "@/pages/Pricing";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Legal from "@/pages/Legal";
import Vertical from "@/pages/Vertical";
import Comparison from "@/pages/Comparison";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import NotFound from "@/pages/NotFound";

// Lazy: the app shell (and its heavier chart deps) load only once signed in.
const Dashboard = lazy(() => import("@/pages/dashboard/Dashboard"));
const CallHistory = lazy(() => import("@/pages/dashboard/CallHistory"));
const CallDetail = lazy(() => import("@/pages/dashboard/CallDetail"));
const Settings = lazy(() => import("@/pages/dashboard/Settings"));
const Billing = lazy(() => import("@/pages/dashboard/Billing"));

function PageFallback() {
  return (
    <div className="grid min-h-screen place-items-center">
      <Loader2 className="size-6 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Suspense fallback={<PageFallback />}>
            <Routes>
            {/* Marketing */}
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />

            {/* Legal */}
            <Route path="/privacy" element={<Legal doc="privacy" />} />
            <Route path="/terms" element={<Legal doc="terms" />} />
            <Route path="/hipaa" element={<Legal doc="hipaa" />} />

            {/* Vertical landing pages */}
            <Route path="/dental" element={<Vertical slug="dental" />} />
            <Route path="/medical" element={<Vertical slug="medical" />} />
            <Route path="/veterinary" element={<Vertical slug="veterinary" />} />
            <Route path="/legal" element={<Vertical slug="legal" />} />

            {/* Comparison pages */}
            <Route path="/vs/ruby" element={<Comparison slug="ruby" />} />
            <Route path="/vs/answering-service" element={<Comparison slug="answering-service" />} />
            <Route path="/vs/smith-ai" element={<Comparison slug="smith-ai" />} />

            {/* Blog */}
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />

            {/* Book a demo / contact */}
            <Route path="/contact" element={<Contact />} />

            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Public demo — the real dashboard with sample data, no login. */}
            <Route
              path="/demo"
              element={
                <DemoViewProvider>
                  <Dashboard />
                </DemoViewProvider>
              }
            />
            <Route
              path="/demo/calls"
              element={
                <DemoViewProvider>
                  <CallHistory />
                </DemoViewProvider>
              }
            />
            <Route
              path="/demo/calls/:id"
              element={
                <DemoViewProvider>
                  <CallDetail />
                </DemoViewProvider>
              }
            />

            {/* Billing — authenticated, but NOT behind the subscription gate
                (this is where unsubscribed users start their plan). */}
            <Route
              path="/billing"
              element={
                <ProtectedRoute>
                  <Billing />
                </ProtectedRoute>
              }
            />

            {/* App (protected + requires an active plan when billing is on) */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <Dashboard />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/calls"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <CallHistory />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/calls/:id"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <CallDetail />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/settings"
              element={
                <ProtectedRoute>
                  <SubscriptionGate>
                    <Settings />
                  </SubscriptionGate>
                </ProtectedRoute>
              }
            />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
