import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Star, MessageSquare, TrendingUp, Store } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { CRITERIA, reviewOverall, type ReviewRow } from "@/lib/reviews";
import { StarRating } from "@/components/star-rating";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Painel · Avalia" }] }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const [restaurantId, setRestaurantId] = useState<string>("all");

  const { data: restaurants = [] } = useQuery({
    queryKey: ["restaurants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", user?.id, restaurantId],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("reviews").select("*").order("created_at", { ascending: false });
      if (restaurantId !== "all") q = q.eq("restaurant_id", restaurantId);
      const { data, error } = await q;
      if (error) throw error;
      return data as ReviewRow[];
    },
  });

  const stats = useMemo(() => {
    const count = reviews.length;
    if (count === 0) return null;
    const overall = reviews.reduce((s, r) => s + reviewOverall(r), 0) / count;
    const perCriterion = CRITERIA.map((c) => ({
      ...c,
      avg: reviews.reduce((s, r) => s + (r[c.key] as number), 0) / count,
    }));
    return { count, overall, perCriterion };
  }, [reviews]);

  const chartData = useMemo(() => {
    const byDay = new Map<string, { sum: number; n: number }>();
    [...reviews].reverse().forEach((r) => {
      const day = new Date(r.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      const cur = byDay.get(day) ?? { sum: 0, n: 0 };
      cur.sum += reviewOverall(r);
      cur.n += 1;
      byDay.set(day, cur);
    });
    return Array.from(byDay.entries()).map(([day, v]) => ({ day, media: Number((v.sum / v.n).toFixed(2)) }));
  }, [reviews]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Painel</h1>
          <p className="text-sm text-muted-foreground">Acompanhe as avaliações dos seus clientes.</p>
        </div>
        {restaurants.length > 0 && (
          <Select value={restaurantId} onValueChange={setRestaurantId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os restaurantes</SelectItem>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !stats ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Store className="size-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-semibold text-lg">Nenhuma avaliação ainda</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastre um restaurante e compartilhe o QR code para começar a receber avaliações.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={Star} label="Nota geral" value={stats.overall.toFixed(2)} hint="média de todos os critérios" />
            <StatCard icon={MessageSquare} label="Avaliações" value={String(stats.count)} hint="total recebido" />
            <StatCard
              icon={TrendingUp}
              label="Melhor critério"
              value={[...stats.perCriterion].sort((a, b) => b.avg - a.avg)[0].label}
              hint={`${[...stats.perCriterion].sort((a, b) => b.avg - a.avg)[0].avg.toFixed(2)} estrelas`}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Média por critério</h3>
              <div className="space-y-3">
                {stats.perCriterion.map((c) => (
                  <div key={c.key} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground w-28">{c.label}</span>
                    <StarRating value={c.avg} readOnly size={18} />
                    <span className="text-sm font-medium w-10 text-right">{c.avg.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4">Evolução da nota</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ left: -20, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Line type="monotone" dataKey="media" stroke="var(--primary)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card">
            <h3 className="font-semibold p-5 pb-3">Avaliações recentes</h3>
            <div className="divide-y divide-border">
              {reviews.slice(0, 20).map((r) => (
                <div key={r.id} className="p-5 flex flex-col sm:flex-row sm:items-start gap-3 justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <StarRating value={reviewOverall(r)} readOnly size={16} />
                      <span className="text-sm font-medium">{reviewOverall(r).toFixed(1)}</span>
                    </div>
                    {r.comment && <p className="text-sm text-muted-foreground max-w-xl">{r.comment}</p>}
                    <p className="text-xs text-muted-foreground">
                      {r.customer_name ? `${r.customer_name} · ` : ""}
                      {new Date(r.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Star;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Icon className="size-4" /> {label}
      </div>
      <div className="mt-2 text-3xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{hint}</div>
    </div>
  );
}
