import fs from 'fs';
import path from 'path';

const TMP_BANNERS = path.join('/tmp', 'banners_cache.json');
const BUNDLED_BANNERS = path.join(process.cwd(), 'banners_cache.json');

const DEFAULT_BANNERS = [
  {
    id: 'banner_fashion',
    title: 'Pbazar Fashion Collection',
    image: 'https://i.postimg.cc/vBv8bbQN/unnamed-8.jpg',
    created_at: '2026-01-01'
  },
  {
    id: 'banner_seller',
    title: 'Verified Seller Network',
    image: 'https://i.postimg.cc/WbN1N7Z0/unnamed-15.jpg',
    created_at: '2026-01-02'
  }
];

function getCachedBanners(): any[] {
  try {
    if (fs.existsSync(TMP_BANNERS)) {
      const data = JSON.parse(fs.readFileSync(TMP_BANNERS, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
    if (fs.existsSync(BUNDLED_BANNERS)) {
      const data = JSON.parse(fs.readFileSync(BUNDLED_BANNERS, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('Error reading banner cache:', e);
  }
  return DEFAULT_BANNERS;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    const banners = getCachedBanners();
    return res.status(200).json({ banners });
  }

  if (req.method === 'POST') {
    try {
      const bannerData = req.body || {};
      const banners = getCachedBanners();
      banners.unshift({
        ...bannerData,
        id: bannerData.id || `banner_${Date.now()}`,
        created_at: new Date().toISOString()
      });
      try {
        fs.writeFileSync(TMP_BANNERS, JSON.stringify(banners, null, 2), 'utf-8');
      } catch (err) {}
      return res.status(201).json({ success: true, banner: bannerData });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || 'Failed to save banner' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
