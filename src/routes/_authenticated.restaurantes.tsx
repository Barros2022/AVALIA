import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { Plus, Trash2, Download, Copy, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { slugify } from "@/lib/reviews";

export const Route = createFileRoute("/_authenticated/restaurantes")({
  head: () => ({ meta: [{ title: "Restaurantes · Avalia" }] }),
  component: RestaurantsPage,
});

interface Restaurant {
  id: string;
  name: string;
  description: string | null;
  slug: string;
}

function RestaurantsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: restaurants = [], isLoading } = useQuery({
    queryKey: ["restaurants", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("restaurants")
        .select("id, name, description, slug")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Restaurant[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const baseSlug = slugify(name) || "restaurante";
      const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("restaurants").insert({
        owner_id: user!.id,
        name: name.trim(),
        description: description.trim() || null,
        slug,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Restaurante criado!");
      setName("");
      setDescription("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["restaurants"] });
    },
    onError: (e: Error) => toast.error("Erro ao criar", { description: e.message }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("restaurants").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Restaurante excluído");
      qc.invalidateQueries({ queryKey: ["restaurants"] });
    },
    onError: (e: Error) => toast.error("Erro ao excluir", { description: e.message }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Restaurantes</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus restaurantes e QR codes.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Novo restaurante
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo restaurante</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="rname">Nome</Label>
                <Input id="rname" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rdesc">Descrição (opcional)</Label>
                <Textarea id="rdesc" maxLength={300} value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : restaurants.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <Store className="size-10 mx-auto text-muted-foreground mb-3" />
          <h2 className="font-semibold text-lg">Nenhum restaurante cadastrado</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie seu primeiro restaurante para gerar um QR code de avaliação.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {restaurants.map((r) => (
            <RestaurantCard key={r.id} restaurant={r} onDelete={() => deleteMutation.mutate(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function RestaurantCard({ restaurant, onDelete }: { restaurant: Restaurant; onDelete: () => void }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const formUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/r/${restaurant.slug}`;

  const copyLink = () => {
    navigator.clipboard.writeText(formUrl);
    toast.success("Link copiado!");
  };

  const downloadQr = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qrcode-${restaurant.slug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex gap-5">
      <div ref={canvasRef} className="shrink-0 rounded-lg bg-white p-2 h-fit">
        <QRCodeCanvas value={formUrl} size={104} marginSize={1} />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-semibold truncate">{restaurant.name}</h3>
        {restaurant.description && (
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{restaurant.description}</p>
        )}
        <p className="text-xs text-muted-foreground mt-2 truncate">/r/{restaurant.slug}</p>
        <div className="flex flex-wrap gap-2 mt-3">
          <Button size="sm" variant="secondary" onClick={downloadQr}>
            <Download className="size-4" /> QR code
          </Button>
          <Button size="sm" variant="outline" onClick={copyLink}>
            <Copy className="size-4" /> Link
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir restaurante?</AlertDialogTitle>
                <AlertDialogDescription>
                  Isso remove o restaurante e todas as suas avaliações. Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
