export interface CollectionEntry<C extends string = string> {
  id: string;
  collection: C;
  body?: string;
  data: Record<string, unknown>;
}

export async function getCollection<C extends string>(): Promise<CollectionEntry<C>[]> {
  return [];
}
