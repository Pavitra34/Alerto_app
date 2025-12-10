// Report Message Entry Type
export interface ReportMessageEntry {
  user_id: string; // employee user_id
  message: string; // report message from the employee
  reviewed_time: string; // ISO date - time when the employee submitted the report
}

// Task Data Type
export interface Task {
  _id: string;
  threat_id: string; // matches Threat _id from Threat.ts
  user_ids: string[]; // array of employee user_ids from Employee_active.ts
  review_status: boolean;
  report_message: null | ReportMessageEntry[]; // null if review_status is false, array of {user_id, message} if true
  createdat: string; // ISO date
  updatedat: string; // ISO date
}

// Dummy Task Data
// threat_ids link to threats from Threat.ts (ids: "threat001", "threat002", "threat003", etc.)
// user_ids link to employees from Employee_active.ts (user_ids: "2", "3", "5", etc.)
// Each task can have multiple employees assigned
// report_message is null when review_status is false, and contains array of {user_id, message} when true
export const dummyTasks: Task[] = [
  {
    _id: "task002",
    threat_id: "threat001",
    user_ids: ["2"],
    review_status: true,
    report_message: [
      {
        user_id: "2",
        message: "Threat resolved. No further action needed.",
        reviewed_time: "2024-12-20T12:00:00.000Z",
      },
    ],
    createdat: "2024-12-20T11:20:00.000Z",
    updatedat: "2024-12-20T12:00:00.000Z",
  },
  {
    _id: "task003",
    threat_id: "threat003",
    user_ids: ["5"],
    review_status: false,
    report_message: null,
    createdat: "2024-12-20T13:50:00.000Z",
    updatedat: "2024-12-20T13:50:00.000Z",
  },
  {
    _id: "task004",
    threat_id: "threat005",
    user_ids: ["5", "2"],
    review_status: true,
    report_message: [
      {
        user_id: "2",
        message: "Threat resolved. No further action needed.",
        reviewed_time: "2024-12-20T14:00:00.000Z",
      },
      {
        user_id: "5",
        message: "No further action needed.",
        reviewed_time: "2024-12-20T14:15:00.000Z",
      },
    ],
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

// Helper function to find tasks by user_id (checks if userId is in user_ids array)
export const findTasksByUserId = (userId: string): Task[] => {
  return dummyTasks.filter((task) => task.user_ids.includes(userId));
};

// Helper function to get all pending tasks (review_status: false)
export const getPendingTasks = (): Task[] => {
  return dummyTasks.filter((task) => task.review_status === false);
};

// Helper function to get all completed tasks (review_status: true)
export const getCompletedTasks = (): Task[] => {
  return dummyTasks.filter((task) => task.review_status === true);
};

