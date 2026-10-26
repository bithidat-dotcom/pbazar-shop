export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    console.log("Order notification received:", body.orderId, body.customerName);
    return res.status(200).json({ success: true, message: "Order notification processed" });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
