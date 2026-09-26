import { PiketArea, CrewMember, PiketSchedule, PiketRecord } from '../types/piket';

// 6 Area Piket Resmi Sesuai Jadwal Outlet Hara Chicken (Gambar Jadwal Piket)
export const DEFAULT_AREAS: PiketArea[] = [
  {
    id: 'area-halaman',
    name: 'Halaman Depan + Samping + Keset',
    code: 'HARA-HLM-01',
    category: 'Facility',
    description: 'Halaman luar depan & samping outlet, selokan kecil, dan kebersihan keset pintu masuk.',
    standardChecklist: [
      'Halaman depan & samping disapu bersih dari dedaunan, puntung rokok, & sampah',
      'Keset pintu masuk utama dikebaskan, disikat, dan ditata lurus rapi',
      'Tempat sampah luar tidak meluap & kantong plastik baru terpasang',
      'Paving / teras luar disiram dan disapu bersih'
    ],
    color: 'from-emerald-500 to-green-600'
  },
  {
    id: 'area-wastafel-cust',
    name: 'Wastafel Customer + Cermin + Baby Chair',
    code: 'HARA-WST-02',
    category: 'Service',
    description: 'Area cuci tangan tamu: wastafel, cermin dinding, sabun, dan pembersihan baby chair.',
    standardChecklist: [
      'Wastafel customer disikat bersih, bebas kerak/busa sabun & saluran lancar',
      'Cermin dilap bening mengkilap tanpa bekas cipratan air atau sidik jari',
      'Dispenser sabun cuci tangan terisi penuh & lap/tisu tangan tersedia',
      'Baby chair disemprot sanitizer, diseka higienis, dan disusun rapi'
    ],
    color: 'from-cyan-400 to-teal-500'
  },
  {
    id: 'area-showcase',
    name: 'Showcase depan belakang (air, kaca, dalam showcase, kontainer ayam) + Sawang',
    code: 'HARA-SHW-01',
    category: 'Kitchen',
    description: 'Showcase penghangat ayam depan & belakang, wadah air, rak dalam, kontainer ayam, dan pembersihan sawang plafon.',
    standardChecklist: [
      'Kaca showcase depan & belakang dilap jernih tanpa noda minyak & sidik jari',
      'Air penampung kelembapan showcase diganti dan dikuras bersih',
      'Bagian dalam showcase & rak pemanas diseka steril',
      'Kontainer ayam dicuci bersih, ditiriskan, dan disusun rapi',
      'Sawang (sarang laba-laba/debu langit-langit & sudut dinding) dibersihkan tuntas'
    ],
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'area-toilet-mushola',
    name: 'Toilet + Mushola + Meja Area Takeaway (Termasuk Bawahnya)',
    code: 'HARA-FAC-01',
    category: 'Facility',
    description: 'Toilet tamu/kru, kenyamanan mushola, dan meja takeaway beserta lantai kolong bawahnya.',
    standardChecklist: [
      'Kloset, dinding & lantai toilet disikat wangi, tidak licin & tempat sampah dibuang',
      'Mushola (karpet/sajadah) divakum/dikebas, mukena dilipat rapi & wangi',
      'Meja area takeaway dilap bersih dan disanitasi',
      'Kolong bawah meja takeaway disapu & dipel bersih tanpa sisa struk/debu'
    ],
    color: 'from-fuchsia-500 to-pink-600'
  },
  {
    id: 'area-rak-kitchen',
    name: 'Rak Bahan Baku + Wastafel Kitchen + Area Gas Cooker',
    code: 'HARA-KTN-01',
    category: 'Kitchen',
    description: 'Penataan stok rak bahan baku, bak cuci piring/peralatan kitchen, dan area kompor gas cooker.',
    standardChecklist: [
      'Rak bahan baku tertata rapi sistem FIFO (kardus packaging tidak langsung di lantai)',
      'Wastafel kitchen disikat bersih, bebas sisa lemak & grease trap disaring',
      'Area gas cooker / kompor diseka dari kerak bumbu, tepung, & cipratan minyak',
      'Lantai dapur di sekitar gas cooker kering dan tidak licin'
    ],
    color: 'from-orange-500 to-amber-600'
  },
  {
    id: 'area-sealcup-geprek',
    name: 'Seal Cup + Dispenser + Cermin Dine In + Area geprek',
    code: 'HARA-GRP-01',
    category: 'Service',
    description: 'Mesin cup sealer minuman, dispenser sirup/es, cermin area makan tamu, dan meja/alat area geprek.',
    standardChecklist: [
      'Mesin seal cup dibersihkan dari ceceran manis dan plastik sealer terpasang rapi',
      'Dispenser minuman diseka bersih wadah luar dan tatakan tetesannya',
      'Cermin dinding area dine-in dilap mengkilap bebas debu & bercak',
      'Meja & cobek/alat area geprek dicuci bersih, disanitasi, dan bebas sisa sambal'
    ],
    color: 'from-purple-600 to-indigo-700'
  }
];

// Daftar Kru Hara Chicken Resmi (Kepala Outlet: Ummu Sallaamah)
export const DEFAULT_CREW: CrewMember[] = [
  { id: 'crew-ummu', name: 'Ummu Sallaamah', role: 'Kepala Outlet', phone: '081234567801', active: true },
  { id: 'crew-bangkit', name: 'Bangkit Tri Widodo', role: 'Crew Kitchen', phone: '081234567802', active: true },
  { id: 'crew-jeki', name: 'Jeki Tri Hidayatuloh', role: 'Crew Kitchen', phone: '081234567803', active: true },
  { id: 'crew-isnaini', name: 'Isnaini Nur Ramadhani', role: 'Crew Cashier', phone: '081234567804', active: true },
  { id: 'crew-anisa', name: 'Anisa Wulandari', role: 'Crew Cashier', phone: '081234567805', active: true },
  { id: 'crew-fitriana', name: 'Fitriana Washilatun Sholikhah', role: 'Crew Dining', phone: '081234567806', active: true },
  { id: 'crew-robi', name: 'Robi Chaniago', role: 'Crew Kitchen', phone: '081234567807', active: true }
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
        { areaId: 'area-halaman', crewId: 'crew-bangkit', crewName: 'Bangkit Tri Widodo' },
        { areaId: 'area-wastafel-cust', crewId: 'crew-anisa', crewName: 'Anisa Wulandari' },
        { areaId: 'area-showcase', crewId: 'crew-jeki', crewName: 'Jeki Tri Hidayatuloh' },
        { areaId: 'area-toilet-mushola', crewId: 'crew-fitriana', crewName: 'Fitriana Washilatun Sholikhah' },
        { areaId: 'area-rak-kitchen', crewId: 'crew-robi', crewName: 'Robi Chaniago' },
        { areaId: 'area-sealcup-geprek', crewId: 'crew-isnaini', crewName: 'Isnaini Nur Ramadhani' }
      ]
    },
    {
      id: `sched-${today}-closing`,
      date: today,
      shift: 'Sore / Closing (15:00 - 22:30)',
      assignments: [
        { areaId: 'area-halaman', crewId: 'crew-robi', crewName: 'Robi Chaniago' },
        { areaId: 'area-wastafel-cust', crewId: 'crew-isnaini', crewName: 'Isnaini Nur Ramadhani' },
        { areaId: 'area-showcase', crewId: 'crew-bangkit', crewName: 'Bangkit Tri Widodo' },
        { areaId: 'area-toilet-mushola', crewId: 'crew-jeki', crewName: 'Jeki Tri Hidayatuloh' },
        { areaId: 'area-rak-kitchen', crewId: 'crew-anisa', crewName: 'Anisa Wulandari' },
        { areaId: 'area-sealcup-geprek', crewId: 'crew-fitriana', crewName: 'Fitriana Washilatun Sholikhah' }
      ]
    }
  ];
};

export const INITIAL_RECORDS: PiketRecord[] = [
  {
    id: 'piket-demo-01',
    timestamp: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    date: getTodayDateString(),
    time: '11:15',
    areaId: 'area-wastafel-cust',
    areaName: 'Wastafel Customer + Cermin + Baby Chair',
    areaCode: 'HARA-WST-02',
    crewName: 'Anisa Wulandari',
    crewId: 'crew-anisa',
    shift: 'Pagi (08:00 - 15:00)',
    photoBase64: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
    aiVerification: {
      status: 'BERSIH_SESUAI_STANDAR',
      isCorrectArea: true,
      detectedAreaDescription: 'Wastafel customer bersih dan cermin mengkilap.',
      summary: 'Area wastafel dan cermin customer bersih terawat, sabun terisi, dan baby chair tertata rapi.',
      findings: [
        'Wastafel bersih bebas busa & kotoran',
        'Cermin dilap jernih tanpa bekas sidik jari',
        'Baby chair telah disanitasi'
      ],
      checkItems: [
        { item: 'Wastafel Customer', isClean: true, notes: 'Bersih & saluran lancar' },
        { item: 'Cermin Dinding', isClean: true, notes: 'Bening mengkilap' },
        { item: 'Baby Chair', isClean: true, notes: 'Telah disanitasi rapi' }
      ],
      verifiedAt: '11:15'
    },
    spvStatus: 'APPROVED',
    spvNotes: 'Sangat baik, pertahankan kebersihan area tamu.',
    spvApprovedBy: 'Ummu Sallaamah (Kepala Outlet)',
    spvApprovedAt: '11:30',
    syncedToSheets: true,
    syncedAt: '11:16'
  },
  {
    id: 'piket-demo-02',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
    date: getTodayDateString(),
    time: '12:45',
    areaId: 'area-showcase',
    areaName: 'Showcase depan belakang (air, kaca, dalam showcase, kontainer ayam) + Sawang',
    areaCode: 'HARA-SHW-01',
    crewName: 'Jeki Tri Hidayatuloh',
    crewId: 'crew-jeki',
    shift: 'Pagi (08:00 - 15:00)',
    photoBase64: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80',
    aiVerification: {
      status: 'BERSIH_SESUAI_STANDAR',
      isCorrectArea: true,
      detectedAreaDescription: 'Showcase penghangat ayam dan kaca depan-belakang bersih steril.',
      summary: 'Kaca showcase bening, air penampung diganti baru, dan kontainer ayam tersusun rapi.',
      findings: [
        'Kaca showcase bebas minyak dan sidik jari',
        'Kontainer ayam bersih kering di posisinya',
        'Sawang di sekitar plafon showcase sudah dibersihkan'
      ],
      checkItems: [
        { item: 'Kaca Depan & Belakang', isClean: true, notes: 'Jernih tanpa minyak' },
        { item: 'Air Showcase', isClean: true, notes: 'Segar dan higienis' },
        { item: 'Kontainer Ayam & Sawang', isClean: true, notes: 'Tertata dan bersih' }
      ],
      verifiedAt: '12:45'
    },
    spvStatus: 'APPROVED',
    spvNotes: 'Bagus, standar visual showcase terpenuhi.',
    spvApprovedBy: 'Ummu Sallaamah (Kepala Outlet)',
    spvApprovedAt: '13:00',
    syncedToSheets: true,
    syncedAt: '12:46'
  }
];
