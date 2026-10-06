import { CatalogRequest, OperationalModel, BusinessResourceItem, BusinessBookingRecord, OperationalTaskRecord } from '../types';

export function buildUniversalOperationalModel(req: CatalogRequest, rawOp?: any): OperationalModel {
  const p = (req.businessRequirements || req.industry || req.businessName || '').toLowerCase();
  
  const isHotel = /hotel|resort|inn|motel|lodge|hospitality|guest house|bed and breakfast|b&b|hostel|stay|villa/i.test(p);
  const isClinic = /hospital|clinic|doctor|patient|medical|health|dental|dentist|surgery|physio|consultant|therapy|orthopedic|pediatric|care center/i.test(p);
  const isRental = /rental|rent|hire|car rental|vehicle rental|equipment rental|fleet|lease|charter|bike rental|tool rental/i.test(p);
  const isFactory = /factory|manufacturing|production|manufacturer|plant|raw material|assembly|work order|bom|fabrication/i.test(p);
  const isRestaurant = /restaurant|cafe|bar|dining|bistro|kitchen|chef|pizza|burger|bakery|diner|food truck|pub/i.test(p);
  const isSalon = /salon|spa|barber|hair|facial|massage|beauty studio|stylist|grooming/i.test(p);
  const isGym = /gym|fitness|crossfit|workout|personal trainer|yoga studio|martial arts|boxing/i.test(p);

  let domain: OperationalModel['domain'] = 'custom';
  let workflowType: OperationalModel['workflowType'] = 'custom_pipeline';

  let terminology = {
    resourceName: 'Unit / Asset',
    resourcePlural: 'Units & Assets',
    clientName: 'Client',
    clientPlural: 'Clients',
    transactionName: 'Order / Contract',
    transactionPlural: 'Orders & Contracts',
    primaryAction: 'New Booking / Order',
    secondaryAction: 'Complete & Settle'
  };

  let resourceBoard: OperationalModel['resourceBoard'] = {
    enabled: true,
    resourceType: 'Unit',
    statuses: [
      { key: 'available', label: 'Available', color: 'emerald' },
      { key: 'occupied', label: 'In Service / Active', color: 'blue' },
      { key: 'reserved', label: 'Reserved', color: 'amber' },
      { key: 'cleaning', label: 'Turnover / Prep', color: 'purple' },
      { key: 'maintenance', label: 'Maintenance', color: 'rose' }
    ],
    initialResources: []
  };

  let initialBookings: BusinessBookingRecord[] = [];
  let initialTasks: OperationalTaskRecord[] = [];

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const tomorrowStr = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
  const dayAfterStr = new Date(now.getTime() + 86400000 * 3).toISOString().split('T')[0];

  if (isHotel) {
    domain = 'hospitality';
    workflowType = 'accommodation_hospitality';
    terminology = {
      resourceName: 'Room / Suite',
      resourcePlural: 'Rooms & Suites',
      clientName: 'Guest',
      clientPlural: 'Guests',
      transactionName: 'Reservation & Folio',
      transactionPlural: 'Reservations & Folios',
      primaryAction: 'Book Room / Check In',
      secondaryAction: 'Check Out & Settle Folio'
    };

    resourceBoard = {
      enabled: true,
      resourceType: 'Room / Suite',
      statuses: [
        { key: 'available', label: 'Available', color: 'emerald' },
        { key: 'occupied', label: 'Occupied (Checked-in)', color: 'blue' },
        { key: 'reserved', label: 'Reserved', color: 'amber' },
        { key: 'cleaning', label: 'Housekeeping / Cleaning', color: 'purple' },
        { key: 'maintenance', label: 'Maintenance / Out of Order', color: 'rose' }
      ],
      initialResources: [
        { id: 'res-101', name: 'Room 101 (Deluxe King)', type: 'Deluxe King Suite', status: 'available', rate: 350, rateUnit: '/night', capacity: 2, floorOrLocation: '1st Floor - East Wing', features: ['King Bed', 'City View', 'Ensuite Jacuzzi', 'High-speed WiFi'] },
        { id: 'res-102', name: 'Room 102 (Deluxe Twin)', type: 'Deluxe Twin Suite', status: 'occupied', rate: 320, rateUnit: '/night', capacity: 4, currentGuestOrClient: 'Alexander Vance', checkInDate: todayStr, checkOutDate: dayAfterStr, floorOrLocation: '1st Floor - East Wing', features: ['2 Queen Beds', 'Balcony', 'Mini Bar'] },
        { id: 'res-201', name: 'Room 201 (Executive Ocean View)', type: 'Executive Suite', status: 'available', rate: 550, rateUnit: '/night', capacity: 2, floorOrLocation: '2nd Floor - Ocean Front', features: ['Ocean Panorama', 'Butler Service', 'Private Terrace'] },
        { id: 'res-202', name: 'Room 202 (Executive Ocean View)', type: 'Executive Suite', status: 'reserved', rate: 550, rateUnit: '/night', capacity: 2, currentGuestOrClient: 'Dr. Evelyn Reed', checkInDate: tomorrowStr, checkOutDate: dayAfterStr, floorOrLocation: '2nd Floor - Ocean Front', features: ['Ocean Panorama', 'Smart Automation'] },
        { id: 'res-301', name: 'Suite 301 (Presidential Penthouse)', type: 'Presidential Suite', status: 'available', rate: 1200, rateUnit: '/night', capacity: 6, floorOrLocation: 'Penthouse Level', features: ['Private Plunge Pool', 'Dining Hall', 'Chauffeur Access'] },
        { id: 'res-302', name: 'Suite 302 (Royal Heritage)', type: 'Heritage Suite', status: 'cleaning', rate: 950, rateUnit: '/night', capacity: 4, floorOrLocation: 'Penthouse Level', features: ['Antique Fireplace', 'Wine Cellar'] }
      ]
    };

    initialBookings = [
      {
        id: 'bk-hotel-001',
        businessId: 'active-biz',
        resourceId: 'res-102',
        resourceName: 'Room 102 (Deluxe Twin)',
        clientName: 'Alexander Vance',
        clientEmail: 'alex.vance@venturecapital.com',
        clientPhone: '+1 (555) 982-1142',
        checkInDate: todayStr,
        checkOutDate: dayAfterStr,
        rate: 320,
        totalNightsOrUnits: 3,
        depositAmount: 500,
        totalAmount: 1120,
        paidAmount: 500,
        status: 'checked_in',
        notes: 'VIP Guest. Prefers hypoallergenic pillows and late 2:00 PM checkout.',
        folioCharges: [
          { id: 'chg-1', description: 'Room Accommodation (3 Nights @ $320)', amount: 960, category: 'Room Charge', date: todayStr },
          { id: 'chg-2', description: 'In-Room Dining - Wagyu Ribeye & Vintage Red', amount: 160, category: 'Dining / Room Service', date: todayStr }
        ],
        createdAt: now.toISOString()
      },
      {
        id: 'bk-hotel-002',
        businessId: 'active-biz',
        resourceId: 'res-202',
        resourceName: 'Room 202 (Executive Ocean View)',
        clientName: 'Dr. Evelyn Reed',
        clientEmail: 'evelyn.reed@biotech.org',
        clientPhone: '+1 (555) 341-9901',
        checkInDate: tomorrowStr,
        checkOutDate: dayAfterStr,
        rate: 550,
        totalNightsOrUnits: 2,
        depositAmount: 550,
        totalAmount: 1100,
        paidAmount: 550,
        status: 'confirmed',
        notes: 'Arriving via flight at 6 PM. Airport pickup scheduled.',
        folioCharges: [
          { id: 'chg-3', description: 'Room Advance Rate Deposit', amount: 550, category: 'Advance Deposit', date: todayStr }
        ],
        createdAt: now.toISOString()
      }
    ];

    initialTasks = [
      { id: 'tsk-001', resourceId: 'res-302', resourceName: 'Suite 302', title: 'Deep Turnover Cleaning & Linen Restock', priority: 'high', status: 'in_progress', assignedTo: 'Housekeeping Lead (Maria)', createdAt: now.toISOString() },
      { id: 'tsk-002', resourceId: 'res-101', resourceName: 'Room 101', title: 'Mini-bar replenishment & Welcome amenity fruit basket', priority: 'medium', status: 'pending', assignedTo: 'Guest Relations', createdAt: now.toISOString() }
    ];
  } else if (isClinic) {
    domain = 'healthcare';
    workflowType = 'patient_clinical';
    terminology = {
      resourceName: 'Consultation Suite / Bed',
      resourcePlural: 'Suites & Treatment Bays',
      clientName: 'Patient',
      clientPlural: 'Patients',
      transactionName: 'Clinical Appointment',
      transactionPlural: 'Appointments & Treatment Folios',
      primaryAction: 'Book Appointment / Admit',
      secondaryAction: 'Discharge & Settle Bill'
    };

    resourceBoard = {
      enabled: true,
      resourceType: 'Consultation Suite / Bed',
      statuses: [
        { key: 'available', label: 'Available / Sanitized', color: 'emerald' },
        { key: 'occupied', label: 'In Session / Patient Admitted', color: 'blue' },
        { key: 'reserved', label: 'Scheduled Appointment', color: 'amber' },
        { key: 'cleaning', label: 'Sterilization in Progress', color: 'purple' },
        { key: 'maintenance', label: 'Equipment Maintenance', color: 'rose' }
      ],
      initialResources: [
        { id: 'res-cli-101', name: 'Suite 101 (Primary Care)', type: 'General Consultation', status: 'available', rate: 150, rateUnit: '/consult', capacity: 1, floorOrLocation: 'Ground Floor' },
        { id: 'res-cli-102', name: 'Suite 102 (Orthopedics)', type: 'Specialist Surgery Room', status: 'occupied', rate: 300, rateUnit: '/session', currentGuestOrClient: 'Robert Langdon', checkInDate: todayStr, checkOutDate: todayStr, floorOrLocation: '1st Floor' },
        { id: 'res-cli-201', name: 'Diagnostic Bay (Ultrasound/X-Ray)', type: 'Imaging Room', status: 'available', rate: 250, rateUnit: '/scan', capacity: 1, floorOrLocation: 'Diagnostic Wing' },
        { id: 'res-cli-202', name: 'Physical Therapy & Rehab Bay', type: 'Rehab Center', status: 'cleaning', rate: 180, rateUnit: '/session', capacity: 2, floorOrLocation: 'Wellness Wing' }
      ]
    };

    initialBookings = [
      {
        id: 'bk-cli-001',
        businessId: 'active-biz',
        resourceId: 'res-cli-102',
        resourceName: 'Suite 102 (Orthopedics)',
        clientName: 'Robert Langdon',
        clientEmail: 'robert.l@academic.edu',
        clientPhone: '+1 (555) 789-0142',
        checkInDate: todayStr,
        checkOutDate: todayStr,
        rate: 300,
        totalNightsOrUnits: 1,
        depositAmount: 100,
        totalAmount: 480,
        paidAmount: 100,
        status: 'checked_in',
        notes: 'Post-op knee ligament assessment and ultrasound scan.',
        folioCharges: [
          { id: 'cchg-1', description: 'Specialist Orthopedic Consultation', amount: 300, category: 'Medical Consultation', date: todayStr },
          { id: 'cchg-2', description: 'Diagnostic Joint Ultrasound Scan', amount: 180, category: 'Diagnostics', date: todayStr }
        ],
        createdAt: now.toISOString()
      }
    ];

    initialTasks = [
      { id: 'tsk-cli-1', resourceId: 'res-cli-202', resourceName: 'Rehab Bay', title: 'Sanitize equipment and restock resistance bands', priority: 'high', status: 'in_progress', assignedTo: 'Nurse Sarah', createdAt: now.toISOString() }
    ];
  } else if (isRental) {
    domain = 'rental';
    workflowType = 'fleet_rental';
    terminology = {
      resourceName: 'Vehicle / Asset',
      resourcePlural: 'Fleet Vehicles & Machinery',
      clientName: 'Renter / Driver',
      clientPlural: 'Renters & Clients',
      transactionName: 'Rental Agreement & Contract',
      transactionPlural: 'Rental Contracts & Returns',
      primaryAction: 'Create Rental Contract',
      secondaryAction: 'Return & Inspect Asset'
    };

    resourceBoard = {
      enabled: true,
      resourceType: 'Vehicle / Asset',
      statuses: [
        { key: 'available', label: 'Available for Hire', color: 'emerald' },
        { key: 'occupied', label: 'Rented Out (On Road)', color: 'blue' },
        { key: 'reserved', label: 'Advance Booking', color: 'amber' },
        { key: 'cleaning', label: 'Detailing & Wash', color: 'purple' },
        { key: 'maintenance', label: 'Scheduled Service', color: 'rose' }
      ],
      initialResources: [
        { id: 'res-car-1', name: 'Ferrari F8 Tributo (Red)', type: 'Exotic Supercar', status: 'available', rate: 1450, rateUnit: '/day', capacity: 2, features: ['V8 Twin-Turbo', 'Carbon Pack', 'GPS Tracked'] },
        { id: 'res-car-2', name: 'Lamborghini Huracán EVO (Yellow)', type: 'Exotic Supercar', status: 'occupied', rate: 1600, rateUnit: '/day', capacity: 2, currentGuestOrClient: 'Michael Sterling', checkInDate: todayStr, checkOutDate: tomorrowStr, features: ['V10 AWD', 'Sport Exhaust'] },
        { id: 'res-car-3', name: 'Porsche 911 GT3 RS (White)', type: 'Track Sportscar', status: 'reserved', rate: 1200, rateUnit: '/day', capacity: 2, currentGuestOrClient: 'David Kim', checkInDate: tomorrowStr, checkOutDate: dayAfterStr },
        { id: 'res-car-4', name: 'Mercedes-AMG G63 (Matte Black)', type: 'Luxury SUV', status: 'cleaning', rate: 850, rateUnit: '/day', capacity: 5 }
      ]
    };

    initialBookings = [
      {
        id: 'bk-rent-001',
        businessId: 'active-biz',
        resourceId: 'res-car-2',
        resourceName: 'Lamborghini Huracán EVO (Yellow)',
        clientName: 'Michael Sterling',
        clientEmail: 'm.sterling@capital.com',
        clientPhone: '+1 (555) 441-2319',
        checkInDate: todayStr,
        checkOutDate: tomorrowStr,
        rate: 1600,
        totalNightsOrUnits: 2,
        depositAmount: 3000,
        totalAmount: 3200,
        paidAmount: 3200,
        status: 'checked_in',
        notes: 'Security deposit authorized on Amex. 150 miles/day allowance.',
        folioCharges: [
          { id: 'rchg-1', description: '2 Days Supercar Hire Rate', amount: 3200, category: 'Rental Charge', date: todayStr }
        ],
        createdAt: now.toISOString()
      }
    ];

    initialTasks = [
      { id: 'tsk-rent-1', resourceId: 'res-car-4', resourceName: 'AMG G63', title: 'Complete full exterior ceramic wash and tire pressure inspection', priority: 'medium', status: 'in_progress', assignedTo: 'Fleet Team (Jake)', createdAt: now.toISOString() }
    ];
  } else if (isFactory) {
    domain = 'manufacturing';
    workflowType = 'work_order_manufacturing';
    terminology = {
      resourceName: 'Production Line / Machine',
      resourcePlural: 'Production Lines & Machines',
      clientName: 'B2B Client / Distributor',
      clientPlural: 'Clients & Accounts',
      transactionName: 'Work Order & Batch Run',
      transactionPlural: 'Work Orders & Production Runs',
      primaryAction: 'Start Production Run',
      secondaryAction: 'Complete & QC Batch'
    };

    resourceBoard = {
      enabled: true,
      resourceType: 'Production Line / Bay',
      statuses: [
        { key: 'available', label: 'Idle / Ready', color: 'emerald' },
        { key: 'occupied', label: 'Running Production Batch', color: 'blue' },
        { key: 'reserved', label: 'Scheduled Run', color: 'amber' },
        { key: 'cleaning', label: 'Sanitation / Line Clearance', color: 'purple' },
        { key: 'maintenance', label: 'Tooling / Maintenance', color: 'rose' }
      ],
      initialResources: [
        { id: 'res-mfg-1', name: 'Automated Blending Line A', type: 'Fluid Blending Reactor', status: 'occupied', rate: 2000, rateUnit: '/batch', capacity: 5000, currentGuestOrClient: 'Apex Consumer Goods', checkInDate: todayStr, checkOutDate: tomorrowStr },
        { id: 'res-mfg-2', name: 'High-Speed Bottling & Capping Line', type: 'Packaging System', status: 'available', rate: 1500, rateUnit: '/shift', capacity: 10000 },
        { id: 'res-mfg-3', name: 'Secondary Shrink Wrap & Palletizer', type: 'End-of-Line Packaging', status: 'available', rate: 800, rateUnit: '/shift' }
      ]
    };
  } else if (isRestaurant) {
    domain = 'food_dining';
    workflowType = 'table_kitchen_dining';
    terminology = {
      resourceName: 'Dining Table',
      resourcePlural: 'Tables & Dining Areas',
      clientName: 'Diner / Table Host',
      clientPlural: 'Diners & Guests',
      transactionName: 'Table Order & Bill',
      transactionPlural: 'Table Orders & Tabs',
      primaryAction: 'Seat Table / Open Tab',
      secondaryAction: 'Print Bill & Settle'
    };

    resourceBoard = {
      enabled: true,
      resourceType: 'Table / Booth',
      statuses: [
        { key: 'available', label: 'Vacant Table', color: 'emerald' },
        { key: 'occupied', label: 'Seated & Dining', color: 'blue' },
        { key: 'reserved', label: 'Table Reserved', color: 'amber' },
        { key: 'cleaning', label: 'Bussing / Cleaning', color: 'purple' },
        { key: 'maintenance', label: 'Reserved for VIP', color: 'rose' }
      ],
      initialResources: [
        { id: 'res-tbl-1', name: 'Table 1 (Window)', type: '2-Seat Booth', status: 'occupied', rate: 0, capacity: 2, currentGuestOrClient: 'Julian & Claire', floorOrLocation: 'Main Dining Room' },
        { id: 'res-tbl-2', name: 'Table 2 (Window)', type: '4-Seat Table', status: 'available', rate: 0, capacity: 4, floorOrLocation: 'Main Dining Room' },
        { id: 'res-tbl-3', name: 'Table 3 (Center)', type: '6-Seat Table', status: 'reserved', rate: 0, capacity: 6, currentGuestOrClient: 'TechCorp Party (7:30 PM)', floorOrLocation: 'Main Dining Room' },
        { id: 'res-tbl-4', name: 'Chef Table (Private)', type: 'VIP Dining Room', status: 'available', rate: 100, capacity: 10, floorOrLocation: 'Private Cellar' }
      ]
    };
  } else {
    // Default tailored universal model for custom or retail operations
    domain = 'retail';
    workflowType = 'item_pos_retail';
    terminology = {
      resourceName: 'Register / Station',
      resourcePlural: 'Stations & Counters',
      clientName: 'Customer',
      clientPlural: 'Customers',
      transactionName: 'Sale Invoice',
      transactionPlural: 'Sales & Receipts',
      primaryAction: 'New Sale / Checkout',
      secondaryAction: 'Complete Sale'
    };

    resourceBoard = {
      enabled: true,
      resourceType: 'Station / Counter',
      statuses: [
        { key: 'available', label: 'Open / Ready', color: 'emerald' },
        { key: 'occupied', label: 'Serving Customer', color: 'blue' },
        { key: 'cleaning', label: 'Register Audit', color: 'purple' }
      ],
      initialResources: [
        { id: 'res-gen-1', name: 'Main Front Counter #1', type: 'Primary Register', status: 'available', rate: 0, capacity: 1 },
        { id: 'res-gen-2', name: 'Express Checkout Counter', type: 'Fast Register', status: 'available', rate: 0, capacity: 1 }
      ]
    };
  }

  // If AI provided custom operationalModel in rawOp, merge and prioritize custom AI inputs
  if (rawOp && typeof rawOp === 'object') {
    if (rawOp.domain) domain = rawOp.domain;
    if (rawOp.workflowType) workflowType = rawOp.workflowType;
    if (rawOp.terminology) {
      terminology = {
        ...terminology,
        ...rawOp.terminology
      };
    }
    if (rawOp.resourceBoard && Array.isArray(rawOp.resourceBoard.initialResources) && rawOp.resourceBoard.initialResources.length > 0) {
      resourceBoard = {
        enabled: rawOp.resourceBoard.enabled ?? true,
        resourceType: rawOp.resourceBoard.resourceType || terminology.resourceName,
        statuses: rawOp.resourceBoard.statuses || resourceBoard.statuses,
        initialResources: rawOp.resourceBoard.initialResources.map((r: any, i: number) => ({
          id: r.id || `res-${Date.now()}-${i}`,
          name: r.name || `${terminology.resourceName} ${i + 1}`,
          type: r.type || 'Standard',
          status: r.status || 'available',
          rate: Number(r.rate) || 0,
          rateUnit: r.rateUnit || '',
          capacity: Number(r.capacity) || 1,
          currentGuestOrClient: r.currentGuestOrClient || '',
          checkInDate: r.checkInDate || '',
          checkOutDate: r.checkOutDate || '',
          notes: r.notes || '',
          features: Array.isArray(r.features) ? r.features : []
        }))
      };
    }
    if (Array.isArray(rawOp.initialBookings) && rawOp.initialBookings.length > 0) {
      initialBookings = rawOp.initialBookings.map((b: any, i: number) => ({
        id: b.id || `bk-${Date.now()}-${i}`,
        businessId: 'active-biz',
        resourceId: b.resourceId || 'res-1',
        resourceName: b.resourceName || `${terminology.resourceName} 1`,
        clientName: b.clientName || 'Valued Client',
        clientEmail: b.clientEmail || '',
        clientPhone: b.clientPhone || '',
        checkInDate: b.checkInDate || todayStr,
        checkOutDate: b.checkOutDate || tomorrowStr,
        rate: Number(b.rate) || 0,
        totalNightsOrUnits: Number(b.totalNightsOrUnits) || 1,
        depositAmount: Number(b.depositAmount) || 0,
        totalAmount: Number(b.totalAmount) || Number(b.rate) || 0,
        paidAmount: Number(b.paidAmount) || 0,
        status: b.status || 'confirmed',
        notes: b.notes || '',
        folioCharges: Array.isArray(b.folioCharges) ? b.folioCharges : [],
        createdAt: now.toISOString()
      }));
    }
    if (Array.isArray(rawOp.initialTasks) && rawOp.initialTasks.length > 0) {
      initialTasks = rawOp.initialTasks.map((t: any, i: number) => ({
        id: t.id || `tsk-${Date.now()}-${i}`,
        resourceId: t.resourceId,
        resourceName: t.resourceName,
        title: t.title || 'Operational Task',
        priority: t.priority || 'medium',
        status: t.status || 'pending',
        assignedTo: t.assignedTo || 'Staff',
        createdAt: now.toISOString()
      }));
    }
  }

  const specializedModules = [
    {
      id: 'resource_board',
      title: `${terminology.resourcePlural} Board`,
      icon: 'Layers',
      description: `Live visual status & assignment board for all ${terminology.resourcePlural.toLowerCase()}.`,
      type: 'resource_board' as const
    },
    {
      id: 'reservations',
      title: terminology.transactionPlural,
      icon: 'Calendar',
      description: `Manage ${terminology.transactionPlural.toLowerCase()}, check-in/out dates, and availability.`,
      type: 'reservations' as const
    },
    {
      id: 'folios',
      title: `${terminology.clientName} Billing & Folios`,
      icon: 'Receipt',
      description: `Consolidated billing folios, payments, deposits, and invoice checkout.`,
      type: 'folios' as const
    },
    {
      id: 'tasks',
      title: 'Operations & Maintenance',
      icon: 'CheckSquare',
      description: `Task assignments, turnover cleaning, and maintenance queue.`,
      type: 'tasks' as const
    },
    {
      id: 'services_pos',
      title: 'Quick POS & Amenities',
      icon: 'ShoppingCart',
      description: `Point of sale for on-demand services, room service, dining, and merchandise.`,
      type: 'services_pos' as const
    },
    {
      id: 'analytics',
      title: 'Business Analytics & Occupancy',
      icon: 'TrendingUp',
      description: `Revenue, utilization rate, average transaction value, and performance metrics.`,
      type: 'analytics' as const
    }
  ];

  return {
    domain,
    workflowType,
    terminology,
    resourceBoard,
    initialBookings,
    initialTasks,
    specializedModules
  };
}
