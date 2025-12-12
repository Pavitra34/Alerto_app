// Employee Active Status API Types
export interface EmployeeActive {
  _id: string;
  user_id: string;
  active_status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SetEmployeeActiveStatusResponse {
  success: boolean;
  message: string;
  data: {
    employeeActive: EmployeeActive;
  };
}

export interface GetEmployeeActiveStatusResponse {
  success: boolean;
  message: string;
  data: {
    employeeActive: EmployeeActive | null;
    active_status: boolean | null;
  };
}

// Set employee active status (create or update)
export const setEmployeeActiveStatus = async (
  user_id: string,
  active_status: boolean
): Promise<EmployeeActive> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('employee-active');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: user_id,
        active_status: active_status,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: SetEmployeeActiveStatusResponse = await response.json();

    if (data.success && data.data) {
      return data.data.employeeActive;
    } else {
      throw new Error(data.message || 'Failed to set employee active status');
    }
  } catch (error: any) {
    console.error('Set employee active status API error:', error);
    throw error;
  }
};

// Get employee active status by user_id
export const getEmployeeActiveStatus = async (
  user_id: string
): Promise<boolean | null> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`employee-active/${user_id}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetEmployeeActiveStatusResponse = await response.json();

    if (data.success && data.data) {
      return data.data.active_status;
    } else {
      throw new Error(data.message || 'Failed to get employee active status');
    }
  } catch (error: any) {
    console.error('Get employee active status API error:', error);
    throw error;
  }
};

// Get all employee active statuses for today
export interface GetAllEmployeeActiveStatusesResponse {
  success: boolean;
  message: string;
  data: {
    employeeStatuses: EmployeeActive[];
    count: number;
  };
}

export const getAllEmployeeActiveStatuses = async (): Promise<EmployeeActive[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('employee-active/all');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllEmployeeActiveStatusesResponse = await response.json();

    if (data.success && data.data) {
      return data.data.employeeStatuses;
    } else {
      throw new Error(data.message || 'Failed to get all employee active statuses');
    }
  } catch (error: any) {
    console.error('Get all employee active statuses API error:', error);
    throw error;
  }
};

