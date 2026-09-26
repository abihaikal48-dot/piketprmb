import { PiketArea, CrewMember, PiketSchedule, PiketRecord } from '../types/piket';

export const DEFAULT_AREAS: PiketArea[] = [
  {
    id: 'fryer-station',
    name: 'Area Penggorengan & Fryer',
    code: 'HARA-FRY-01',
    category: 'Kitchen',
    description: 'Pembersihan minyak sisa, filter remahan tepung, meja stainless, dan bagian luar mesin fryer.',
    standardChecklist: [
      'Remahan tepung crispy disaring dan dibersihkan dari meja',
      'Permukaan stainless steel diseka dengan lap degreaser',
      'Lantai dapur penggorengan kering & tidak ada tumpahan licin minyak',
      'Peralatan penjepit dan peniris tersusun rapi'
    ],
    color: 'from-amber-500 to-orange-600'
  },
  {
    id: 'cashier-counter',
    name: 'Meja Kasir & Front Counter',
    code: 'HARA-CSR-01',
    category: 'Service',
    description: 'Area kasir, mesin POS, etalase pemanas ayam (warmer), dan meja saus kemasan.',
    standardChecklist: [
      'Kaca etalase warmer bersih tanpa bekas sidik jari / minyak',
      'Meja kasir & mesin POS bersih dari remah & struk berserakan',
      'Wadah sedotan, sendok, dan saus tertata penuh & rapi',
      'Lantai area kasir bersih dan kering'
    ],
    color: 'from-red-500 to-rose-600'
  },
  {
    id: 'dining-hall',
    name: 'Area Meja Tamu (Dining Hall)',
    code: 'HARA-DIN-01',
    category: 'Service',
    description: 'Seluruh meja makan pelanggan, kursi, lantai dining room, dan tempat sampah pengunjung.',
    standardChecklist: [
      'Semua meja disemprot sanitizer dan dilap kering mengkilap',
      'Kursi tertata sejajar merapat ke meja',
      'Lantai dining telah disapu & dipel wangi tanpa noda makanan',
      'Tempat sampah tamu tidak penuh & kantong plastik baru dipasang'
    ],
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'dishwashing-waste',
    name: 'Area Cuci Piring & Waste',
    code: 'HARA-WST-01',
    category: 'Kitchen',
    description: 'Sink pencucian piring/tray, rak pengeringan, grease trap, dan area tempat sampah dapur.',
    standardChecklist: [
      'Bak cuci sink bersih bebas tumpukan piring & sisa makanan',
      'Grease trap disaring dan dibersihkan dari lemak',
      'Lantai area cuci disikat dan ditarik airnya (kering)',
      'Tempat sampah basah dapur sudah diikat dan dibuang ke bak luar'
    ],
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'restroom',
    name: 'Toilet & Wastafel Tamu',
    code: 'HARA-TOI-01',
    category: 'Facility',
    description: 'Kloset, cermin, wastafel cuci tangan, sabun cuci tangan, dan lantai toilet.',
    standardChecklist: [
      'Wastafel bersih tidak tersumbat & sabun cuci tangan terisi',
      'Cermin dilap bersih tidak ada cipratan air',
      'Kloset disikat bersih dan disiram pewangi toilet',
      'Lantai toilet disikat kering tidak berlendir & tempat sampah bersih'
    ],
    color: 'from-cyan-500 to-blue-600'
  },
  {
    id: 'storage-chiller',
    name: 'Gudang Bahan Baku & Chiller',
    code: 'HARA-GUD-01',
    category: 'Storage',
    description: 'Rak penyimpanan packaging kardus Hara Chicken, bumbu marinasi, dan freezer/chiller ayam.',
    standardChecklist: [
      'Kardus packaging tersusun rapi di atas pallet (tidak menyentuh lantai)',
      'Pintu chiller/freezer tertutup rapat dan karet kulkas bersih',
      'Sistem FIFO diterapkan untuk stok bahan baku',
      'Lantai gudang bebas debu dan ceceran bahan'
    ],
    color: 'from-purple-500 to-indigo-600'
  }
];

export const DEFAULT_CREW: CrewMember[] = [
  { id: 'crew-1', name: 'Rian Pratama', role: 'Crew Kitchen', phone: '081234567890', active: true },
  { id: 'crew-2', name: 'Siti Nurhaliza', role: 'Crew Cashier', phone: '081234567891', active: true },
  { id: 'crew-3', name: 'Budi Santoso', role: 'Crew Dining', phone: '081234567892', active: true },
  { id: 'crew-4', name: 'Dewi Lestari', role: 'Crew Kitchen', phone: '081234567893', active: true },
  { id: 'crew-5', name: 'Fajar Hidayat', role: 'Crew Dining', phone: '081234567894', active: true },
  { id: 'crew-6', name: 'Pak Hendra (SPV)', role: 'Supervisor', phone: '081234567895', active: true },
];

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getCurrentShift = (): 'Pagi (08:00 - 15:00)' | 'Sore / Closing (15:00 - 22:30)' => {
  const hour = new Date().getHours();
  if (hour >= 8 && hour < 15) {
    return 'Pagi (08:00 - 15:00)';
  }
  return 'Sore / Closing (15:00 - 22:30)';
};

export const getDefaultSchedules = (): PiketSchedule[] => {
  const today = getTodayDateString();
  return [
    {
      id: `sched-${today}-pagi`,
      date: today,
      shift: 'Pagi (08:00 - 15:00)',
      assignments: [
        { areaId: 'fryer-station', crewId: 'crew-1', crewName: 'Rian Pratama' },
        { areaId: 'cashier-counter', crewId: 'crew-2', crewName: 'Siti Nurhaliza' },
        { areaId: 'dining-hall', crewId: 'crew-3', crewName: 'Budi Santoso' },
        { areaId: 'dishwashing-waste', crewId: 'crew-1', crewName: 'Rian Pratama' },
        { areaId: 'restroom', crewId: 'crew-3', crewName: 'Budi Santoso' },
        { areaId: 'storage-chiller', crewId: 'crew-4', crewName: 'Dewi Lestari' }
      ]
    },
    {
      id: `sched-${today}-closing`,
      date: today,
      shift: 'Sore / Closing (15:00 - 22:30)',
      assignments: [
        { areaId: 'fryer-station', crewId: 'crew-4', crewName: 'Dewi Lestari' },
        { areaId: 'cashier-counter', crewId: 'crew-2', crewName: 'Siti Nurhaliza' },
        { areaId: 'dining-hall', crewId: 'crew-5', crewName: 'Fajar Hidayat' },
        { areaId: 'dishwashing-waste', crewId: 'crew-4', crewName: 'Dewi Lestari' },
        { areaId: 'restroom', crewId: 'crew-5', crewName: 'Fajar Hidayat' },
        { areaId: 'storage-chiller', crewId: 'crew-1', crewName: 'Rian Pratama' }
      ]
    }
  ];
};

export const INITIAL_RECORDS: PiketRecord[] = [
  {
    id: 'piket-demo-01',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    date: getTodayDateString(),
    time: '11:15',
    areaId: 'cashier-counter',
    areaName: 'Meja Kasir & Front Counter',
    areaCode: 'HARA-CSR-01',
    crewName: 'Siti Nurhaliza',
    crewId: 'crew-2',
    shift: 'Pagi (08:00 - 15:00)',
    photoBase64: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=600&q=80',
    aiVerification: {
      status: 'BERSIH_SESUAI_STANDAR',
      isCorrectArea: true,
      detectedAreaDescription: 'Meja kasir depan dan etalase showcase rapi.',
      summary: 'Area kasir sangat bersih, monitor POS dan display rapi tanpa ceceran remah makanan.',
      findings: [
        'Etalase kaca tampak bening dan bebas noda minyak',
        'Area meja kasir kering dan bersih',
        'Struk dan nota tersimpan di tempatnya'
      ],
      checkItems: [
        { item: 'Kaca Etalase Warmer', isClean: true, notes: 'Bening dan terawat' },
        { item: 'Permukaan Meja POS', isClean: true, notes: 'Bebas kotoran' },
        { item: 'Kerapian Wadah Saus & Sendok', isClean: true, notes: 'Tertata rapi' }
      ],
      verifiedAt: '11:15'
    },
    spvStatus: 'APPROVED',
    spvNotes: 'Bagus dan konsisten.',
    spvApprovedBy: 'Pak Hendra (SPV)',
    spvApprovedAt: '11:30',
    syncedToSheets: true,
    syncedAt: '11:16'
  },
  {
    id: 'piket-demo-02',
    timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(),
    date: getTodayDateString(),
    time: '12:45',
    areaId: 'fryer-station',
    areaName: 'Area Penggorengan & Fryer',
    areaCode: 'HARA-FRY-01',
    crewName: 'Rian Pratama',
    crewId: 'crew-1',
    shift: 'Pagi (08:00 - 15:00)',
    photoBase64: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&w=600&q=80',
    aiVerification: {
      status: 'BERSIH_SESUAI_STANDAR',
      isCorrectArea: true,
      detectedAreaDescription: 'Stasiun penggorengan stainless steel dapur utama.',
      summary: 'Tepung sisa telah disaring, meja stainless steel bersih diseka, dan peniris ayam tertata.',
      findings: [
        'Tidak ada genangan minyak di bawah meja penggorengan',
        'Peralatan peniris ayam tersusun di rak atas',
        'Permukaan dinding percikan minyak sudah dilap'
      ],
      checkItems: [
        { item: 'Saringan Tepung Crispy', isClean: true, notes: 'Sudah disaring bersih' },
        { item: 'Permukaan Stainless Steel', isClean: true, notes: 'Disapu & diseka degreaser' },
        { item: 'Lantai Dapur Fryer', isClean: true, notes: 'Kering dan tidak licin' }
      ],
      verifiedAt: '12:45'
    },
    spvStatus: 'APPROVED',
    spvNotes: 'Standar kebersihan kitchen terpenuhi.',
    spvApprovedBy: 'Pak Hendra (SPV)',
    spvApprovedAt: '13:00',
    syncedToSheets: true,
    syncedAt: '12:46'
  }
];
