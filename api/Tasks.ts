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
  user_ids: string[]; // array of employee user_ids from employeeActive.ts
  review_status: boolean;
  report_message: null | ReportMessageEntry[]; // null if review_status is false, array of {user_id, message} if true
  createdat: string; // ISO date
  updatedat: string; // ISO date
}

// API Response Types
export interface GetAllTasksResponse {
  success: boolean;
  message: string;
  data: {
    tasks: Task[];
    count: number;
  };
}

export interface GetTaskByIdResponse {
  success: boolean;
  message: string;
  data: {
    task: Task;
  };
}

export interface CreateTaskResponse {
  success: boolean;
  message: string;
  data: {
    task: Task;
  };
}

// Create a new task
export const createTask = async (
  threat_id: string,
  user_ids: string[],
  review_status: boolean = false,
  report_message: ReportMessageEntry[] | null = null
): Promise<Task> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('tasks');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threat_id,
        user_ids,
        review_status,
        report_message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: CreateTaskResponse = await response.json();

    if (data.success && data.data) {
      return data.data.task;
    } else {
      throw new Error(data.message || 'Failed to create task');
    }
  } catch (error: any) {
    console.error('Create task API error:', error);
    throw error;
  }
};

// Get all tasks
export const getAllTasks = async (): Promise<Task[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('tasks');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllTasksResponse = await response.json();

    if (data.success && data.data) {
      return data.data.tasks;
    } else {
      throw new Error(data.message || 'Failed to get tasks');
    }
  } catch (error: any) {
    console.error('Get all tasks API error:', error);
    throw error;
  }
};

// Get task by ID
export const findTaskById = async (id: string): Promise<Task | null> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`tasks/${id}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetTaskByIdResponse = await response.json();

    if (data.success && data.data) {
      return data.data.task;
    } else {
      throw new Error(data.message || 'Failed to get task');
    }
  } catch (error: any) {
    console.error('Get task by ID API error:', error);
    throw error;
  }
};

// Get tasks by threat_id
export const findTasksByThreatId = async (threatId: string): Promise<Task[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`tasks/threat/${threatId}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllTasksResponse = await response.json();

    if (data.success && data.data) {
      return data.data.tasks;
    } else {
      throw new Error(data.message || 'Failed to get tasks by threat ID');
    }
  } catch (error: any) {
    console.error('Get tasks by threat ID API error:', error);
    throw error;
  }
};

// Get tasks by user_id
export const findTasksByUserId = async (userId: string): Promise<Task[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`tasks/user/${userId}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllTasksResponse = await response.json();

    if (data.success && data.data) {
      return data.data.tasks;
    } else {
      throw new Error(data.message || 'Failed to get tasks by user ID');
    }
  } catch (error: any) {
    console.error('Get tasks by user ID API error:', error);
    throw error;
  }
};

// Update task
export const updateTask = async (
  taskId: string,
  review_status?: boolean,
  report_message?: ReportMessageEntry[] | null
): Promise<Task> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`tasks/${taskId}`);

    const body: any = {};
    if (review_status !== undefined) {
      body.review_status = review_status;
    }
    if (report_message !== undefined) {
      body.report_message = report_message;
    }

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetTaskByIdResponse = await response.json();

    if (data.success && data.data) {
      return data.data.task;
    } else {
      throw new Error(data.message || 'Failed to update task');
    }
  } catch (error: any) {
    console.error('Update task API error:', error);
    throw error;
  }
};

// Delete task
export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`tasks/${taskId}`);

    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }
  } catch (error: any) {
    console.error('Delete task API error:', error);
    throw error;
  }
};

// Helper function to get all pending tasks (review_status: false)
export const getPendingTasks = async (): Promise<Task[]> => {
  try {
    const allTasks = await getAllTasks();
    return allTasks.filter((task) => task.review_status === false);
  } catch (error: any) {
    console.error('Get pending tasks API error:', error);
    throw error;
  }
};

// Helper function to get all completed tasks (review_status: true)
export const getCompletedTasks = async (): Promise<Task[]> => {
  try {
    const allTasks = await getAllTasks();
    return allTasks.filter((task) => task.review_status === true);
  } catch (error: any) {
    console.error('Get completed tasks API error:', error);
    throw error;
  }
};
