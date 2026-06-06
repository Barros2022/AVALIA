export const CRITERIA = [
  { key: "food", label: "Comida" },
  { key: "service", label: "Atendimento" },
  { key: "ambiance", label: "Ambiente" },
  { key: "cleanliness", label: "Limpeza" },
  { key: "price", label: "Preço" },
] as const;

export type CriterionKey = (typeof CRITERIA)[number]["key"];

export interface ReviewRow {
  id: string;
  restaurant_id: string;
  food: number;
  service: number;
  ambiance: number;
  cleanliness: number;
  price: number;
  comment: string | null;
  customer_name: string | null;
  created_at: string;
}

export function reviewOverall(r: Pick<ReviewRow, CriterionKey>): number {
  return (r.food + r.service + r.ambiance + r.cleanliness + r.price) / 5;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}
