let serverRecords: any[] = [];

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({ records: serverRecords });
  }

  if (req.method === 'POST') {
    const newRecord = req.body;
    if (newRecord) {
      if (!newRecord.id) {
        newRecord.id = 'cihuy-' + Date.now();
      }
      const exists = serverRecords.some(r => r.id === newRecord.id);
      if (!exists) {
        serverRecords.unshift(newRecord);
      }
      return res.status(200).json({ success: true, record: newRecord });
    }
    return res.status(400).json({ error: 'Body required' });
  }

  if (req.method === 'PATCH') {
    const { id } = req.query;
    const updates = req.body;
    const targetId = id || updates.id;
    const index = serverRecords.findIndex(r => r.id === targetId);
    if (index !== -1) {
      serverRecords[index] = { ...serverRecords[index], ...updates };
      return res.status(200).json({ success: true, record: serverRecords[index] });
    }
    return res.status(404).json({ error: 'Record not found' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
