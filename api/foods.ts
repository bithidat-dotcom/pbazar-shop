import fs from 'fs';
import path from 'path';

const TMP_CACHE = path.join('/tmp', 'products_cache.json');
const BUNDLED_CACHE = path.join(process.cwd(), 'products_cache.json');

function getCachedProducts(): any[] {
  try {
    if (fs.existsSync(TMP_CACHE)) {
      return JSON.parse(fs.readFileSync(TMP_CACHE, 'utf-8'));
    }
    if (fs.existsSync(BUNDLED_CACHE)) {
      return JSON.parse(fs.readFileSync(BUNDLED_CACHE, 'utf-8'));
    }
  } catch (e) {
    console.warn('Error reading products for food catalog:', e);
  }
  return [];
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const products = getCachedProducts();
  const nonFoodCategories = [
    "electronics", "fashion", "clothing", "shoes", "bags", "phones", "laptops", "gadgets", "home", "furniture", "books", "beauty", "cosmetics", "accessories", "jewelry", "watches", "sports", "fitness", "automotive", "toys"
  ];

  const foods = products.filter((p: any) => 
    p.category && !nonFoodCategories.includes(p.category.toLowerCase().trim())
  );

  return res.status(200).json({ foods });
}
