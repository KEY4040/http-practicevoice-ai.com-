import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/marketing/Logo";
import { useDocumentMeta } from "@/hooks/useDocumentMeta";

export default function NotFound() {
  useDocumentMeta({ title: "Page not found", noindex: true });
  return (
    <div className="grid min-h-screen place-items-center bg-grid px-6">
      <div className="text-center">
        <Logo className="mx-auto" />
        <p className="mt-10 text-7xl font-extrabold tracking-tight text-primary">
          404
        </p>
        <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has moved.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Button asChild>
            <Link to="/">Back to home</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Go to dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
