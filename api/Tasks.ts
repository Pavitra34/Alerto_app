// Task Data Type
export interface Task {
  _id: string;
  threat_id: string; // matches Threat _id from Threat.ts
  user_id: string; // matches Employee user_id from Employee_active.ts
  review_status: boolean;
  createdat: string; // ISO date
  updatedat: string; // ISO date
}

// Dummy Task Data (2 tasks)
// threat_ids link to threats from Threat.ts (ids: "threat001", "threat002", "threat003")
// user_ids link to employees from Employee_active.ts (user_ids: "3", "5")
// Note: user_id "2" has no tasks assigned
export const dummyTasks: Task[] = [
  {
    _id: "task002",
    threat_id: "threat001",
    user_id: "2",
    review_status: true,
    createdat: "2024-12-20T11:20:00.000Z",
    updatedat: "2024-12-20T12:00:00.000Z",
  },
  {
    _id: "task003",
    threat_id: "threat003",
    user_id: "5",
    review_status: false,
    createdat: "2024-12-20T13:50:00.000Z",
    updatedat: "2024-12-20T13:50:00.000Z",
  },
  {
    _id: "task004",
    threat_id: "threat005",
    user_id: "5",
    review_status: false,
    createdat: "2024-12-20T13:50:00.000Z",
    updatedat: "2024-12-20T13:50:00.000Z",
  },
];

// Helper function to find task by id
export const findTaskById = (id: string): Task | undefined => {
  return dummyTasks.find((task) => task._id === id);
};

// Helper function to find tasks by threat_id
export const findTasksByThreatId = (threatId: string): Task[] => {
  return dummyTasks.filter((task) => task.threat_id === threatId);
};

// Helper function to find tasks by user_id
export const findTasksByUserId = (userId: string): Task[] => {
  return dummyTasks.filter((task) => task.user_id === userId);
};

// Helper function to get all pending tasks (review_status: false)
export const getPendingTasks = (): Task[] => {
  return dummyTasks.filter((task) => task.review_status === false);
};

// Helper function to get all completed tasks (review_status: true)
export const getCompletedTasks = (): Task[] => {
  return dummyTasks.filter((task) => task.review_status === true);
};

