export const TOWNS = ['Payyanur', 'Kannur', 'Thalassery', 'Kanhangad', 'Kasaragod'];

export const STANDS: Record<string, string[]> = {
  Payyanur: ['Railway Station', 'Bus Stand', 'Town Centre', 'Hospital Junction'],
  Kannur: ['Railway Station', 'City Bus Stand', 'Fort Road', 'Thavakkara'],
  Thalassery: ['New Bus Stand', 'Railway Station', 'Masjid Road', "Logan's Road"],
  Kanhangad: ['Bus Stand', 'Railway Station', 'Town Square'],
  Kasaragod: ['Bus Stand', 'Railway Station', 'General Hospital'],
};

export interface Driver {
  id: string;
  name: string;
  town: string;
  stand: string;
  autoNumber: string;
  isVerified: boolean;
  status: "verified" | "pending" | "banned";
  warningCount: number;
  avatarGradient: string;
}

const GRADIENTS = [
  "from-orange-400 to-yellow-300",
  "from-emerald-500 to-teal-400",
  "from-blue-500 to-cyan-400",
  "from-purple-500 to-pink-400",
  "from-rose-500 to-amber-400",
  "from-indigo-500 to-blue-400",
];

export const MOCK_DRIVERS: Driver[] = [
  { id: "1", name: "Rajan K", town: "Payyanur", stand: "Railway Station", autoNumber: "KL-58-A-1234", isVerified: true, status: "verified", warningCount: 0, avatarGradient: GRADIENTS[0] },
  { id: "2", name: "Manoj P", town: "Payyanur", stand: "Railway Station", autoNumber: "KL-58-B-5678", isVerified: true, status: "verified", warningCount: 1, avatarGradient: GRADIENTS[1] },
  { id: "3", name: "Suresh V", town: "Payyanur", stand: "Railway Station", autoNumber: "KL-58-C-9101", isVerified: true, status: "verified", warningCount: 0, avatarGradient: GRADIENTS[2] },
  { id: "4", name: "Arun M", town: "Payyanur", stand: "Railway Station", autoNumber: "KL-58-D-1122", isVerified: true, status: "verified", warningCount: 0, avatarGradient: GRADIENTS[3] },
  { id: "5", name: "Vijayan T", town: "Payyanur", stand: "Bus Stand", autoNumber: "KL-58-E-3344", isVerified: true, status: "verified", warningCount: 0, avatarGradient: GRADIENTS[4] },
  { id: "6", name: "Pradeep S", town: "Payyanur", stand: "Bus Stand", autoNumber: "KL-58-F-5566", isVerified: true, status: "verified", warningCount: 2, avatarGradient: GRADIENTS[5] },
  { id: "7", name: "Ravi Kumar", town: "Kannur", stand: "Railway Station", autoNumber: "KL-13-A-7788", isVerified: true, status: "verified", warningCount: 0, avatarGradient: GRADIENTS[0] },
  { id: "8", name: "Anoop R", town: "Kannur", stand: "City Bus Stand", autoNumber: "KL-13-B-9900", isVerified: true, status: "verified", warningCount: 0, avatarGradient: GRADIENTS[1] },
  { id: "9", name: "Babu N", town: "Thalassery", stand: "New Bus Stand", autoNumber: "KL-13-C-2233", isVerified: true, status: "verified", warningCount: 1, avatarGradient: GRADIENTS[2] },
  { id: "10", name: "Unni K", town: "Kanhangad", stand: "Bus Stand", autoNumber: "KL-14-A-4455", isVerified: true, status: "verified", warningCount: 0, avatarGradient: GRADIENTS[3] },
  { id: "11", name: "Shaji M", town: "Kasaragod", stand: "Bus Stand", autoNumber: "KL-14-B-6677", isVerified: true, status: "pending", warningCount: 0, avatarGradient: GRADIENTS[4] },
  { id: "12", name: "Ramesh D", town: "Kasaragod", stand: "Railway Station", autoNumber: "KL-14-C-8899", isVerified: false, status: "banned", warningCount: 3, avatarGradient: GRADIENTS[5] },
];