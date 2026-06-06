import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Entrar · Avalia" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível entrar", { description: error.message });
      return;
    }
    navigate({ to: "/dashboard" });
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + "/dashboard",
    });
    if (result.error) {
      toast.error("Erro ao entrar com Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard" });
  };

  return (
    <AuthShell title="Bem-vindo de volta" subtitle="Entre para acessar seu painel de avaliações.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <div className="relative my-5 text-center">
        <span className="bg-card px-3 text-xs uppercase tracking-wide text-muted-foreground relative z-10">ou</span>
        <span className="absolute inset-x-0 top-1/2 h-px bg-border" />
      </div>
      <Button variant="outline" className="w-full" onClick={handleGoogle}>
        Continuar com Google
      </Button>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Não tem conta?{" "}
        <Link to="/signup" className="text-primary font-medium hover:underline">
          Criar conta
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 font-bold text-xl mb-8">
          <span className="grid place-items-center size-8 rounded-lg bg-primary text-primary-foreground">
            <Star className="size-5 fill-current" />
          </span>
          Avalia
        </Link>
        <div className="rounded-2xl border border-border bg-card p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 mb-6 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}
