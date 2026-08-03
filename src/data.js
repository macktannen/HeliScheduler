export const mockPilots = [
  { id: 1, name: 'John Smith', status: 'Available', hoursLogged: 1200 },
  { id: 2, name: 'Sarah Connor', status: 'On Leave', hoursLogged: 3400 },
  { id: 3, name: 'Mike Johnson', status: 'Available', hoursLogged: 850 },
  { id: 4, name: 'Emily Davis', status: 'In Flight', hoursLogged: 2100 },
];

export const mockAircrafts = [
  { id: 'N12345', model: 'Bell 206', status: 'Ready' },
  { id: 'N98765', model: 'Airbus H125', status: 'Maintenance' },
  { id: 'N55555', model: 'Robinson R44', status: 'Ready' },
];

export const mockAccounts = [
  { id: 'ACC-100', name: 'Powerline Inspection Corp' },
  { id: 'ACC-200', name: 'State Wildlife Dept' },
  { id: 'ACC-300', name: 'Forestry Service' }
];

export const mockCustomZones = [
  { id: 'CZ-1', title: 'North Substation', address: '123 Electric Ave, Gary, IN', lat: 41.5934, lon: -87.3464 },
  { id: 'CZ-2', title: 'State Park LZ', address: 'Brown County State Park', lat: 39.1558, lon: -86.2346 }
];

export const mockFlights = [
  {
    id: 1,
    flightNumber: 1,
    title: 'Routine Line Inspection',
    date: new Date(new Date().getFullYear(), new Date().getMonth(), 15).toISOString(),
    takeoffTime: '08:00',
    landTime: '12:00',
    route: {
      departure: { type: 'airport', id: 'KIND' },
      destination: { type: 'custom', id: 'CZ-1' }
    },
    accountId: 'ACC-100',
    pilotId: 1,
    aircraftId: 'N12345',
    passengers: ['Jane Doe', 'Bob Smith'],
  },
];

export const mockVendors = [
  { id: 'V-100', vendorId: 'SIG', name: 'Signature Flight Support', address: '123 Airport Rd', phone: '555-0101', email: 'info@signature.com', poc: 'John Doe', category: 'FBO' },
  { id: 'V-200', vendorId: 'AVF', name: 'Avfuel', address: '456 Fuel Way', phone: '555-0102', email: 'sales@avfuel.com', poc: 'Jane Smith', category: 'Fuel Provider' },
  { id: 'V-300', vendorId: 'HIL', name: 'Hilton Hotels', address: '789 Hotel Ave', phone: '555-0103', email: 'reservations@hilton.com', poc: 'Bob Johnson', category: 'Lodging' },
  { id: 'V-400', vendorId: 'JOE', name: 'Joe\'s Catering', address: '321 Food St', phone: '555-0104', email: 'joe@catering.com', poc: 'Joe', category: 'Catering' }
];
