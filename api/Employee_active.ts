// Employee Active Status Data Type
export interface EmployeeActive {
  _id: string;
  user_id: string; // matches User id from users.ts
  active_status: boolean;
  createdat: string; // ISO date
  updatedat: string; // ISO date
}

// Dummy Employee Active Data (3 employee activities)
// user_ids link to users from users.ts (ids: "2", "3", "5")
export const dummyEmployeeActive: EmployeeActive[] = [
  {
    _id: "emp_active001",
    user_id: "3", 
    active_status: false,
    createdat: "2024-12-20T08:00:00.000Z",
    updatedat: "2024-12-20T14:30:00.000Z",
  },
  {
    _id: "emp_active002",
    user_id: "2",
    active_status: false,
    createdat: "2025-12-09T09:15:00.000Z",
    updatedat: "2025-12-09T09:15:00.000Z",
  },
  {
    _id: "emp_active002",
    user_id: "2",
    active_status: true,
    createdat: "2025-12-10T09:15:00.000Z",
    updatedat: "2025-12-10T09:15:00.000Z",
  },
  {
    _id: "emp_active003",
    user_id: "5", // David Brown
    active_status: true,
    createdat: "2024-12-20T07:30:00.000Z",
    updatedat: "2024-12-20T12:00:00.000Z",
  },
  {
    _id: "emp_active004",
    user_id: "7",
    active_status: true,
    createdat: "2024-12-20T07:30:00.000Z",
    updatedat: "2024-12-20T12:00:00.000Z",
  },
  {
    _id: "emp_active005",
    user_id: "9",
    active_status: false,
    createdat: "2024-12-20T07:30:00.000Z",
    updatedat: "2024-12-20T12:00:00.000Z",
  },
];

// Helper function to find employee active status by id
export const findEmployeeActiveById = (id: string): EmployeeActive | undefined => {
  return dummyEmployeeActive.find((emp) => emp._id === id);
};

// Helper function to find employee active status by user_id
export const findEmployeeActiveByUserId = (userId: string): EmployeeActive | undefined => {
  return dummyEmployeeActive.find((emp) => emp.user_id === userId);
};

// Helper function to get all active employees
export const getActiveEmployees = (): EmployeeActive[] => {
  return dummyEmployeeActive.filter((emp) => emp.active_status === true);
};

// Helper function to get all inactive employees
export const getInactiveEmployees = (): EmployeeActive[] => {
  return dummyEmployeeActive.filter((emp) => emp.active_status === false);
};

