import { createFileRoute, Link } from "@tanstack/react-router";
import { QrCode, BarChart3, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Avalia · Avaliações para restaurantes via QR code" },
      {
        name: "description",
        content:
          "Crie um QR code, deixe seus clientes avaliarem o restaurante e acompanhe as notas em tempo real no dashboard.",
      },
      { property: "og:title", content: "Avalia · Avaliações para restaurantes" },
      {
        property: "og:description",
        content: "Receba avaliações dos seus clientes por QR code e acompanhe tudo num dashboard.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl">
          <span className="grid place-items-center size-8 rounded-lg bg-primary text-primary-foreground">
            <Star className="size-5 fill-current" />
          </span>
          Avalia
        </div>
        <nav className="flex items-center gap-3">
          {user ? (
            <Button asChild>
              <Link to="/dashboard">Ir para o painel</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">Criar conta</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="py-20 md:py-28 text-center max-w-3xl mx-auto">
          <span className="inline-block rounded-full border border-border px-4 py-1 text-sm text-muted-foreground mb-6">
            Feedback de clientes, sem complicação
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight">
            Saiba o que seus clientes{" "}
            <span className="text-primary">realmente</span> acham
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Gere um QR code para a mesa, deixe os clientes avaliarem comida, atendimento, ambiente,
            limpeza e preço — e acompanhe tudo num painel claro e em tempo real.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to={user ? "/dashboard" : "/signup"}>
                Começar agora <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-6 pb-24">
          {[
            {
              icon: QrCode,
              title: "QR code por restaurante",
              desc: "Cada restaurante tem seu próprio QR code para imprimir e colocar nas mesas.",
            },
            {
              icon: Star,
              title: "Avaliação por critérios",
              desc: "Os clientes avaliam vários aspectos com estrelas e deixam um comentário.",
            },
            {
              icon: BarChart3,
              title: "Dashboard completo",
              desc: "Médias, evolução das notas e a lista de avaliações recebidas num só lugar.",
            },
          ].map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-card p-6">
              <span className="grid place-items-center size-11 rounded-lg bg-secondary text-secondary-foreground mb-4">
                <f.icon className="size-6" />
              </span>
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Avalia. Feito para restaurantes.
      </footer>
    </div>
  );
}
