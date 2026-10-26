import fs from 'fs';
import path from 'path';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, doc, setDoc, deleteDoc } from 'firebase/firestore';

const TMP_CACHE = path.join('/tmp', 'products_cache.json');
const BUNDLED_CACHE = path.join(process.cwd(), 'products_cache.json');

let db: any = null;
try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const app = getApps().length > 0 ? getApp() : initializeApp(config);
    db = getFirestore(app, config.firestoreDatabaseId || undefined);
  }
} catch (e) {
  console.warn('Firebase init in api/products:', e);
}

function getCachedProducts(): any[] {
  try {
    if (fs.existsSync(TMP_CACHE)) {
      const data = JSON.parse(fs.readFileSync(TMP_CACHE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
    if (fs.existsSync(BUNDLED_CACHE)) {
      const data = JSON.parse(fs.readFileSync(BUNDLED_CACHE, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.warn('Error reading product cache on Vercel:', e);
  }
  return [];
}

function saveCachedProducts(products: any[]) {
  try {
    fs.writeFileSync(TMP_CACHE, JSON.stringify(products, null, 2), 'utf-8');
    if (fs.existsSync(BUNDLED_CACHE)) {
      try {
        fs.writeFileSync(BUNDLED_CACHE, JSON.stringify(products, null, 2), 'utf-8');
      } catch (err) {}
    }
  } catch (e) {
    console.warn('Error writing product cache on Vercel:', e);
  }
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const method = req.method;

  if (method === 'GET') {
    let products = getCachedProducts();

    // If cache is empty and Firestore is available, fetch live from Firestore
    if (products.length === 0 && db) {
      try {
        const snap = await getDocs(query(collection(db, 'products')));
        if (!snap.empty) {
          products = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          saveCachedProducts(products);
        }
      } catch (err) {
        console.warn('Firestore fetch in api/products failed:', err);
      }
    }

    return res.status(200).json({ products });
  }

  if (method === 'POST') {
    try {
      const productData = req.body || {};
      const productId = productData.id || `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const payload = {
        ...productData,
        id: productId,
        created_at: productData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (db) {
        try {
          await setDoc(doc(db, 'products', productId), payload, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore write error in api/products:', dbErr);
        }
      }

      const currentList = getCachedProducts();
      const existingIdx = currentList.findIndex((p: any) => p.id === productId);
      if (existingIdx >= 0) {
        currentList[existingIdx] = { ...currentList[existingIdx], ...payload };
      } else {
        currentList.unshift(payload);
      }
      saveCachedProducts(currentList);

      return res.status(201).json({ success: true, product: payload });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to save product' });
    }
  }

  if (method === 'PUT') {
    try {
      const updateData = req.body || {};
      const id = req.query?.id || updateData.id;
      if (!id) return res.status(400).json({ error: 'Missing product ID' });

      if (db) {
        try {
          await setDoc(doc(db, 'products', id), { ...updateData, updated_at: new Date().toISOString() }, { merge: true });
        } catch (dbErr) {
          console.warn('Firestore update error in api/products:', dbErr);
        }
      }

      const currentList = getCachedProducts();
      const existingIdx = currentList.findIndex((p: any) => p.id === id);
      if (existingIdx >= 0) {
        currentList[existingIdx] = { ...currentList[existingIdx], ...updateData, updated_at: new Date().toISOString() };
        saveCachedProducts(currentList);
        return res.status(200).json({ success: true, product: currentList[existingIdx] });
      }
      return res.status(404).json({ error: 'Product not found' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to update product' });
    }
  }

  if (method === 'DELETE') {
    try {
      const id = req.query?.id || req.body?.id;
      if (!id) return res.status(400).json({ error: 'Missing product ID' });

      if (db) {
        try {
          await deleteDoc(doc(db, 'products', id));
        } catch (dbErr) {
          console.warn('Firestore delete error in api/products:', dbErr);
        }
      }

      const currentList = getCachedProducts();
      const filtered = currentList.filter((p: any) => p.id !== id);
      saveCachedProducts(filtered);
      return res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Failed to delete product' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
