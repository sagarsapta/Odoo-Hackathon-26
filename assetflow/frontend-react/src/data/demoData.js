/**
 * AssetFlow Realistic Enterprise Demo & Fallback Datasets
 * Synchronized with the backend MongoDB seed data structure.
 */

export const demoUsers = [
  { email: 'admin@assetflow.com', fullName: 'Rahul Sharma', role: 'Admin', department: 'Administration', status: 'Active' },
  { email: 'assetmanager@assetflow.com', fullName: 'Priya Patel', role: 'Asset Manager', department: 'IT', status: 'Active' },
  { email: 'it.head@assetflow.com', fullName: 'Amit Shah', role: 'Department Head', department: 'IT', status: 'Active' },
  { email: 'hr.head@assetflow.com', fullName: 'Neha Mehta', role: 'Department Head', department: 'Human Resources', status: 'Active' },
  { email: 'finance.head@assetflow.com', fullName: 'Raj Mehta', role: 'Department Head', department: 'Finance', status: 'Active' },
  { email: 'operations.head@assetflow.com', fullName: 'Karan Desai', role: 'Department Head', department: 'Operations', status: 'Active' },
  { email: 'employee.it@assetflow.com', fullName: 'Riya Shah', role: 'Employee', department: 'IT', status: 'Active' },
  { email: 'employee.hr@assetflow.com', fullName: 'Arjun Patel', role: 'Employee', department: 'Human Resources', status: 'Active' },
  { email: 'employee.finance@assetflow.com', fullName: 'Dev Joshi', role: 'Employee', department: 'Finance', status: 'Active' },
  { email: 'employee.ops@assetflow.com', fullName: 'Mehul Shah', role: 'Employee', department: 'Operations', status: 'Active' },
  { email: 'employee.marketing@assetflow.com', fullName: 'Anjali Desai', role: 'Employee', department: 'Marketing', status: 'Active' },
  { email: 'employee.sales@assetflow.com', fullName: 'Yash Patel', role: 'Employee', department: 'Sales', status: 'Active' }
];

export const demoDepartments = [
  { name: 'IT', head: 'Amit Shah', employeeCount: 18 },
  { name: 'Human Resources', head: 'Neha Mehta', employeeCount: 8 },
  { name: 'Finance', head: 'Raj Mehta', employeeCount: 12 },
  { name: 'Operations', head: 'Karan Desai', employeeCount: 22 },
  { name: 'Marketing', head: 'Anjali Desai', employeeCount: 10 },
  { name: 'Sales', head: 'Yash Patel', employeeCount: 15 },
  { name: 'Administration', head: 'Rahul Sharma', employeeCount: 6 }
];

export const demoOrganization = {
  name: 'AssetFlow Technologies Pvt. Ltd.',
  orgName: 'AssetFlow Technologies Pvt. Ltd.',
  code: 'AFT',
  industry: 'Technology',
  address: 'Ring Road, Surat, Gujarat 395002, India',
  phone: '+91 98765 43210',
  website: 'https://assetflow.example.com',
  currency: 'INR',
  logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=150'
};

const assetTypes = ['Laptop', 'Monitor', 'Networking', 'Printer', 'Accessory', 'Projector', 'Tablet', 'UPS', 'Barcode Scanner', 'CCTV Monitor'];
const assetNames = ['Dell Latitude 5440', 'HP ProBook 450', 'Lenovo ThinkPad E14', 'Dell 24-inch Monitor', 'Cisco Switch 2960', 'HP LaserJet Pro M404', 'Logitech Wireless Combo', 'Logitech C920 HD Webcam', 'Epson Conference Projector', 'Samsung Galaxy Tab S7'];
const departmentNames = ['IT', 'Human Resources', 'Finance', 'Operations', 'Marketing', 'Sales', 'Administration'];

export const demoAssets = Array.from({ length: 60 }, (_, index) => {
  const id = `AST-${String(index + 1).padStart(3, '0')}`;
  const department = departmentNames[index % departmentNames.length];
  const allocated = index % 5 !== 0;
  const isMaintenance = index % 10 === 0;
  const status = isMaintenance ? 'Maintenance' : (allocated ? 'Active' : 'Available');
  const user = demoUsers[(index % 9) + 1];
  const owner = allocated ? user.fullName : null;

  return {
    id,
    name: assetNames[index % assetNames.length],
    type: assetTypes[index % assetTypes.length],
    serial: `AF-DEMO-${String(index + 1).padStart(4, '0')}`,
    status,
    value: 15000 + (index % 8) * 12500,
    location: `${department} Office`,
    owner,
    department
  };
});

export const demoAllocations = [
  {
    id: 'ALC-001',
    assetId: 'AST-001',
    assetName: 'Dell Latitude 5440',
    allocatedTo: 'Priya Patel',
    date: '2026-01-15',
    status: 'Approved',
    department: 'IT',
    requestedBy: 'Priya Patel',
    requestedByEmail: 'assetmanager@assetflow.com',
    targetRole: 'Approved',
    notes: 'Primary workstation laptop'
  },
  {
    id: 'ALC-002',
    assetId: 'AST-002',
    assetName: 'HP ProBook 450',
    allocatedTo: 'Amit Shah',
    date: '2026-01-18',
    status: 'Approved',
    department: 'IT',
    requestedBy: 'Amit Shah',
    requestedByEmail: 'it.head@assetflow.com',
    targetRole: 'Approved',
    notes: 'Department head assignment'
  },
  {
    id: 'ALC-003',
    assetId: 'AST-003',
    assetName: 'Lenovo ThinkPad E14',
    allocatedTo: 'Neha Mehta',
    date: '2026-01-22',
    status: 'Approved',
    department: 'Human Resources',
    requestedBy: 'Neha Mehta',
    requestedByEmail: 'hr.head@assetflow.com',
    targetRole: 'Approved',
    notes: 'HR Operations system'
  },
  {
    id: 'ALC-004',
    assetId: 'AST-004',
    assetName: 'Dell 24-inch Monitor',
    allocatedTo: 'Raj Mehta',
    date: '2026-02-01',
    status: 'Approved',
    department: 'Finance',
    requestedBy: 'Raj Mehta',
    requestedByEmail: 'finance.head@assetflow.com',
    targetRole: 'Approved',
    notes: 'Dual-monitor setup'
  },
  {
    id: 'ALC-005',
    assetId: 'AST-006',
    assetName: 'HP LaserJet Pro M404',
    allocatedTo: 'Riya Shah',
    date: '2026-02-10',
    status: 'Pending Department Head Approval',
    department: 'IT',
    requestedBy: 'Riya Shah',
    requestedByEmail: 'employee.it@assetflow.com',
    targetRole: 'Department Head',
    notes: 'Development test prints'
  },
  {
    id: 'ALC-006',
    assetId: 'AST-007',
    assetName: 'Logitech Wireless Combo',
    allocatedTo: 'Arjun Patel',
    date: '2026-02-14',
    status: 'Pending Department Head Approval',
    department: 'Human Resources',
    requestedBy: 'Arjun Patel',
    requestedByEmail: 'employee.hr@assetflow.com',
    targetRole: 'Department Head',
    notes: 'Ergonomic keyboard replacement'
  },
  {
    id: 'ALC-007',
    assetId: 'AST-008',
    assetName: 'Logitech C920 HD Webcam',
    allocatedTo: 'Dev Joshi',
    date: '2026-01-10',
    status: 'Returned',
    department: 'Finance',
    requestedBy: 'Dev Joshi',
    requestedByEmail: 'employee.finance@assetflow.com',
    targetRole: 'Approved',
    notes: 'Returned after audit project completed'
  }
];

export const demoBookings = [
  {
    id: 'BKG-001',
    resourceName: 'Conference Room A',
    bookedBy: 'Riya Shah',
    date: '2026-09-12',
    startTime: '10:00',
    endTime: '11:30',
    status: 'Confirmed',
    department: 'IT'
  },
  {
    id: 'BKG-002',
    resourceName: 'Conference Room B',
    bookedBy: 'Neha Mehta',
    date: '2026-09-12',
    startTime: '14:00',
    endTime: '15:30',
    status: 'Confirmed',
    department: 'Human Resources'
  },
  {
    id: 'BKG-003',
    resourceName: 'Conference Room A',
    bookedBy: 'Priya Patel',
    date: '2026-09-13',
    startTime: '11:00',
    endTime: '12:30',
    status: 'Confirmed',
    department: 'IT'
  },
  {
    id: 'BKG-004',
    resourceName: 'Training Room',
    bookedBy: 'Amit Shah',
    date: '2026-09-14',
    startTime: '09:30',
    endTime: '13:00',
    status: 'Confirmed',
    department: 'IT'
  },
  {
    id: 'BKG-005',
    resourceName: 'Epson Conference Projector',
    bookedBy: 'Raj Mehta',
    date: '2026-09-15',
    startTime: '15:00',
    endTime: '16:30',
    status: 'Confirmed',
    department: 'Finance'
  },
  {
    id: 'BKG-006',
    resourceName: 'Conference Room B',
    bookedBy: 'Karan Desai',
    date: '2026-09-11',
    startTime: '09:00',
    endTime: '10:00',
    status: 'Cancelled',
    department: 'Operations'
  }
];

export const demoMaintenance = [
  {
    id: 'MNT-001',
    assetId: 'AST-001',
    assetName: 'Dell Latitude 5440',
    type: 'Battery Replacement',
    description: 'Battery health degraded below 40%, replacement required.',
    cost: 4500,
    date: '2026-09-02',
    status: 'Pending',
    priority: 'High',
    technician: 'Sanjay Sharma'
  },
  {
    id: 'MNT-002',
    assetId: 'AST-010',
    assetName: 'Samsung Galaxy Tab S7',
    type: 'Screen Calibration',
    description: 'Touch response lag and display flicker reported.',
    cost: 2200,
    date: '2026-09-04',
    status: 'In Progress',
    priority: 'Medium',
    technician: 'Ramesh Verma'
  },
  {
    id: 'MNT-003',
    assetId: 'AST-020',
    assetName: 'Samsung Galaxy Tab S7',
    type: 'Firmware Update & Diagnostics',
    description: 'OS reload and thermal paste reapplication.',
    cost: 1500,
    date: '2026-08-28',
    status: 'Completed',
    priority: 'Low',
    technician: 'Vikram Joshi'
  },
  {
    id: 'MNT-004',
    assetId: 'AST-030',
    assetName: 'Samsung Galaxy Tab S7',
    type: 'Power Adapter Replacement',
    description: 'Original charger malfunctioning; issued new OEM adapter.',
    cost: 1800,
    date: '2026-08-20',
    status: 'Completed',
    priority: 'Medium',
    technician: 'Sanjay Sharma'
  }
];

export const demoAudits = [
  {
    id: 'AUD-001',
    name: 'Q3 Annual Asset Verification',
    date: '2026-09-01',
    auditor: 'Amit Shah',
    progress: 68,
    status: 'In Progress',
    totalItems: 25,
    verifiedItems: 17,
    checklist: [
      { id: 'AST-001', name: 'Dell Latitude 5440', expectedLocation: 'IT Office', status: 'Found' },
      { id: 'AST-002', name: 'HP ProBook 450', expectedLocation: 'IT Office', status: 'Found' },
      { id: 'AST-003', name: 'Lenovo ThinkPad E14', expectedLocation: 'Human Resources Office', status: 'Found' },
      { id: 'AST-004', name: 'Dell 24-inch Monitor', expectedLocation: 'Finance Office', status: 'Found' },
      { id: 'AST-005', name: 'Cisco Switch 2960', expectedLocation: 'Server Room', status: 'Found' },
      { id: 'AST-006', name: 'HP LaserJet Pro M404', expectedLocation: 'IT Office', status: 'Pending' },
      { id: 'AST-007', name: 'Logitech Wireless Combo', expectedLocation: 'Human Resources Office', status: 'Pending' },
      { id: 'AST-008', name: 'Logitech C920 HD Webcam', expectedLocation: 'Finance Office', status: 'Damaged' },
      { id: 'AST-009', name: 'Epson Conference Projector', expectedLocation: 'Meeting Hall', status: 'Pending' },
      { id: 'AST-010', name: 'Samsung Galaxy Tab S7', expectedLocation: 'Operations Office', status: 'Missing' }
    ]
  },
  {
    id: 'AUD-002',
    name: 'Q2 Compliance & Software Audit',
    date: '2026-06-15',
    auditor: 'Priya Patel',
    progress: 100,
    status: 'Completed',
    totalItems: 40,
    verifiedItems: 40,
    checklist: []
  },
  {
    id: 'AUD-003',
    name: 'Q1 Hardware Security Audit',
    date: '2026-03-10',
    auditor: 'Rahul Sharma',
    progress: 100,
    status: 'Completed',
    totalItems: 35,
    verifiedItems: 35,
    checklist: []
  }
];

export const demoNotifications = [
  {
    id: 'NTF-001',
    title: 'New Allocation Request',
    message: 'Riya Shah requested allocation for HP LaserJet Pro M404.',
    type: 'info',
    date: '2026-09-10 14:30',
    read: false
  },
  {
    id: 'NTF-002',
    title: 'Maintenance Alert',
    message: 'Dell Latitude 5440 (AST-001) battery replacement task is pending technician review.',
    type: 'warning',
    date: '2026-09-10 11:15',
    read: false
  },
  {
    id: 'NTF-003',
    title: 'Booking Confirmed',
    message: 'Conference Room A is confirmed for Riya Shah on 2026-09-12 (10:00 - 11:30).',
    type: 'success',
    date: '2026-09-09 16:45',
    read: true
  },
  {
    id: 'NTF-004',
    title: 'Audit Cycle Active',
    message: 'Q3 Annual Asset Verification is currently at 68% completion.',
    type: 'info',
    date: '2026-09-08 10:00',
    read: true
  },
  {
    id: 'NTF-005',
    title: 'System Welcome',
    message: 'Welcome to AssetFlow Enterprise Asset & Resource Management.',
    type: 'info',
    date: '2026-09-01 09:00',
    read: true
  }
];

export function getDemoAnalytics() {
  const deptDistribution = {};
  const statusDistribution = {};

  demoAssets.forEach((asset) => {
    deptDistribution[asset.department] = (deptDistribution[asset.department] || 0) + 1;
    statusDistribution[asset.status] = (statusDistribution[asset.status] || 0) + 1;
  });

  const usage = {};
  demoBookings.filter((b) => b.status === 'Confirmed').forEach((b) => {
    usage[b.resourceName] = (usage[b.resourceName] || 0) + 1;
  });
  demoAllocations.forEach((a) => {
    if (a.assetName) usage[a.assetName] = (usage[a.assetName] || 0) + 1;
  });

  const mostUsedList = Object.entries(usage)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const idleList = demoAssets
    .filter((a) => !a.owner && a.status !== 'Disposed')
    .slice(0, 5)
    .map((a) => ({ id: a.id, name: a.name, location: a.location || 'Central Stock' }));

  return {
    totalValuation: demoAssets.reduce((sum, a) => sum + (Number(a.value) || 0), 0),
    totalMaintenanceCost: demoMaintenance.reduce((sum, m) => sum + (Number(m.cost) || 0), 0),
    totalAssetsCount: demoAssets.length,
    deptDistribution,
    statusDistribution,
    mostUsedList,
    idleList
  };
}
