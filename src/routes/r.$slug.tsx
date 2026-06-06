import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { CRITERIA, type CriterionKey } from "@/lib/reviews";
import { StarRating } from "@/components/star-rating";

export const Route = createFileRoute("/r/$slug")({
  head: () => ({ meta: [{ title: "Avaliar restaurante · Avalia" }] }),
  component: ReviewFormPage,
});

function ReviewFormPage() {
  const { slug } = useParams({ from: "/r/$slug" });
  const navigate = useNavigate();
  const [ratings, setRatings] = useState<Record<CriterionKey, number>>({
    food: 0,
    service: 0,
    ambiance: 0,
    cleanliness: 0,
    price: 0,
  });
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant-public", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, description")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (CRITERIA.some((c) => ratings[c.key] < 1)) {
      toast.error("Avalie todos os critérios", { description: "Dê pelo menos uma estrela em cada um." });
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      restaurant_id: restaurant!.id,
      food: ratings.food,
      service: ratings.service,
      ambiance: ratings.ambiance,
      cleanliness: ratings.cleanliness,
      price: ratings.price,
      comment: comment.trim() || null,
      customer_name: customerName.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Erro ao enviar avaliação", { description: error.message });
      return;
    }
    navigate({ to: "/r/$slug/obrigado", params: { slug } });
  };

  if (isLoading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Carregando...</div>;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen grid place-items-center px-4 text-center">
        <div>
          <h1 className="text-xl font-semibold">Restaurante não encontrado</h1>
          <p className="text-muted-foreground mt-2">O link de avaliação parece inválido.</p>
          <Button asChild className="mt-4">
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <span className="grid place-items-center size-12 rounded-xl bg-primary text-primary-foreground mx-auto mb-4">
            <Star className="size-6 fill-current" />
          </span>
          <h1 className="text-2xl font-bold">{restaurant.name}</h1>
          <p className="text-muted-foreground mt-1">Como foi sua experiência? Sua opinião nos ajuda muito.</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 space-y-6">
          {CRITERIA.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-4">
              <span className="font-medium">{c.label}</span>
              <StarRating
                value={ratings[c.key]}
                onChange={(v) => setRatings((prev) => ({ ...prev, [c.key]: v }))}
              />
            </div>
          ))}

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              maxLength={1000}
              placeholder="Conte o que achou..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cname">Seu nome (opcional)</Label>
            <Input id="cname" maxLength={100} value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "Enviando..." : "Enviar avaliação"}
          </Button>
        </form>
      </div>
    </div>
  );
}
