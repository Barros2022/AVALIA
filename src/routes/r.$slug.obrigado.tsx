import { createFileRoute, useParams } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/r/$slug/obrigado")({
  head: () => ({ meta: [{ title: "Obrigado! · Avalia" }] }),
  component: ThankYouPage,
});

function ThankYouPage() {
  const { slug } = useParams({ from: "/r/$slug/obrigado" });
  const [done, setDone] = useState(false);

  const { data: restaurant } = useQuery({
    queryKey: ["restaurant-public-name", slug],
    queryFn: async () => {
      const { data } = await supabase.from("restaurants").select("name").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  const reload = (e: FormEvent) => {
    e.preventDefault();
    window.location.href = `/r/${slug}`;
  };

  return (
    <div className="min-h-screen grid place-items-center bg-background px-4 text-center">
      <div className="max-w-md">
        <span className="grid place-items-center size-16 rounded-full bg-secondary text-primary mx-auto mb-6">
          <CheckCircle2 className="size-9" />
        </span>
        <h1 className="text-2xl font-bold">Obrigado pela sua avaliação!</h1>
        <p className="text-muted-foreground mt-2">
          {restaurant?.name
            ? `Sua opinião ajuda o ${restaurant.name} a melhorar cada vez mais.`
            : "Sua opinião foi registrada com sucesso."}
        </p>
        {!done && (
          <Button variant="outline" className="mt-6" onClick={(e) => { setDone(true); reload(e); }}>
            Enviar outra avaliação
          </Button>
        )}
      </div>
    </div>
  );
}
