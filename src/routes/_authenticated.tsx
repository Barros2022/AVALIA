import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Store, LogOut, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

const navItems = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/restaurantes", label: "Restaurantes", icon: Store },
] as const;

function AuthenticatedLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        Carregando...
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border sticky top-0 z-20 bg-background/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 font-bold">
            <span className="grid place-items-center size-8 rounded-lg bg-primary text-primary-foreground">
              <Star className="size-5 fill-current" />
            </span>
            <span className="hidden sm:inline">Avalia</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-secondary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted",
                  )}
                >
                  <item.icon className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <Button variant="ghost" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
