import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { AuthShell } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Criar conta · Avalia" }] }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/dashboard" });
  }, [user, loading, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: { full_name: fullName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível criar a conta", { description: error.message });
      return;
    }
    toast.success("Conta criada!", {
      description: "Confira seu e-mail para confirmar o cadastro antes de entrar.",
    });
    navigate({ to: "/login" });
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
    <AuthShell title="Crie sua conta" subtitle="Comece a coletar avaliações dos seus clientes.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Criando..." : "Criar conta"}
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
        Já tem conta?{" "}
        <Link to="/login" className="text-primary font-medium hover:underline">
          Entrar
        </Link>
      </p>
    </AuthShell>
  );
}
