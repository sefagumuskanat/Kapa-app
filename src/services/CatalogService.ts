import { CATALOG } from '@/data/catalog';
import { AssetCategory, CatalogItem } from '@/types';

/**
 * CatalogService (MOCK).
 * Yerel, gömülü katalog üzerinde çalışır. Ağ çağrısı yapmaz, scraping yapmaz.
 */
export interface ICatalogService {
  search(query: string, category?: AssetCategory): Promise<CatalogItem[]>;
  getByRef(ref: string): Promise<CatalogItem | null>;
  listByCategory(category: AssetCategory): Promise<CatalogItem[]>;
  categories(): AssetCategory[];
}

const simulateLatency = (ms = 220) => new Promise((resolve) => setTimeout(resolve, ms));

function normalize(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .trim();
}

class MockCatalogService implements ICatalogService {
  async search(query: string, category?: AssetCategory): Promise<CatalogItem[]> {
    await simulateLatency();
    const q = normalize(query);
    return CATALOG.filter((item) => {
      if (category && item.category !== category) return false;
      if (!q) return true;
      const haystack = normalize([item.name, ...item.keywords].join(' '));
      return haystack.includes(q);
    });
  }

  async getByRef(ref: string): Promise<CatalogItem | null> {
    await simulateLatency(80);
    return CATALOG.find((item) => item.ref === ref) ?? null;
  }

  async listByCategory(category: AssetCategory): Promise<CatalogItem[]> {
    await simulateLatency(120);
    return CATALOG.filter((item) => item.category === category);
  }

  categories(): AssetCategory[] {
    return Array.from(new Set(CATALOG.map((item) => item.category)));
  }
}

export const catalogService: ICatalogService = new MockCatalogService();
