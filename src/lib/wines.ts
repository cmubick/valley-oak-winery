import { z } from 'zod';

// Wine data model, mirroring how the original valleyoakwinery.com wine list is organized:
// two labels (collections), each optionally split into styles, each wine shown as
// "Name Vintage — Award — $Price" with a one-line tasting description.

export const WINE_COLLECTIONS = [
  {
    id: 'ubick-reserve',
    title: 'Ubick Vineyards Reserve Wines',
    description:
      'Single vineyard block estate-style Reds made exclusively from the grapes grown in the vineyard surrounding the winery.',
  },
  {
    id: 'valley-oak',
    title: 'Valley Oak Wines',
    description: 'Our Valley Oak label wines include White, Blush, Red Blends and Dessert styles.',
  },
] as const;

export const WINE_STYLES = [
  { id: 'white-blush', title: 'White & Blush' },
  { id: 'red', title: 'Reds' },
  { id: 'dessert', title: 'Dessert' },
] as const;

export type WineCollection = (typeof WINE_COLLECTIONS)[number]['id'];
export type WineStyle = (typeof WINE_STYLES)[number]['id'];

const collectionIds = WINE_COLLECTIONS.map((c) => c.id) as [WineCollection, ...WineCollection[]];
const styleIds = WINE_STYLES.map((s) => s.id) as [WineStyle, ...WineStyle[]];

// Fields an admin can set. Used by the admin form and to validate API writes.
export const wineInputSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  vintage: z
    .number({ invalid_type_error: 'Vintage must be a year' })
    .int()
    .min(1900, 'Vintage must be after 1900')
    .max(new Date().getFullYear() + 1, 'Vintage is too far in the future')
    .optional(),
  collection: z.enum(collectionIds),
  style: z.enum(styleIds),
  award: z.string().trim().optional(),
  price: z.number({ invalid_type_error: 'Price is required' }).min(0, 'Price must be positive'),
  description: z.string().trim().min(1, 'Description is required'),
  inStock: z.boolean(),
  sortOrder: z.number({ invalid_type_error: 'Display order is required' }).int(),
  imageUrl: z.string().optional(),
});

export type WineInput = z.infer<typeof wineInputSchema>;

export interface Wine extends WineInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Drop empty optional strings so DynamoDB items don't carry "" values.
export function cleanWineInput(input: WineInput): WineInput {
  const out: WineInput = { ...input };
  if (!out.award) delete out.award;
  if (!out.imageUrl) delete out.imageUrl;
  if (out.vintage === undefined || Number.isNaN(out.vintage)) delete out.vintage;
  return out;
}

// Items written before this schema existed lack collection/style/sortOrder. Fill in
// defaults so they still render (and can be fixed up from the admin page).
export function normalizeWine(item: Record<string, unknown>): Wine {
  const w = item as Partial<Wine>;
  return {
    ...(item as unknown as Wine),
    collection: collectionIds.includes(w.collection as WineCollection) ? w.collection! : 'valley-oak',
    style: styleIds.includes(w.style as WineStyle) ? w.style! : 'red',
    sortOrder: typeof w.sortOrder === 'number' ? w.sortOrder : 0,
    inStock: w.inStock ?? true,
    price: Number(w.price ?? 0),
  };
}

const order = <T,>(list: readonly { id: T }[], id: T) => list.findIndex((x) => x.id === id);

export function sortWines(wines: Wine[]): Wine[] {
  return [...wines].sort(
    (a, b) =>
      order(WINE_COLLECTIONS, a.collection) - order(WINE_COLLECTIONS, b.collection) ||
      order(WINE_STYLES, a.style) - order(WINE_STYLES, b.style) ||
      a.sortOrder - b.sortOrder ||
      a.name.localeCompare(b.name) ||
      (a.vintage ?? 0) - (b.vintage ?? 0)
  );
}

export function wineTitle(wine: Pick<Wine, 'name' | 'vintage'>): string {
  return wine.vintage ? `${wine.name} ${wine.vintage}` : wine.name;
}

export function formatPrice(price: number): string {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}

export const collectionTitle = (id: WineCollection) => WINE_COLLECTIONS.find((c) => c.id === id)?.title ?? id;
export const styleTitle = (id: WineStyle) => WINE_STYLES.find((s) => s.id === id)?.title ?? id;
