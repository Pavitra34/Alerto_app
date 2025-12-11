// User Data Type
export interface User {
  id: string;
  fullname: string;
  username: string;
  email: string;
  phonenumber: number;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

// Backend API Response Types
export interface GetAllUsersResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    count: number;
  };
}

export interface GetUserByIdResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
  };
}

export interface GetUsersByRoleResponse {
  success: boolean;
  message: string;
  data: {
    users: User[];
    count: number;
    role: string;
  };
}

// API Helper Functions

// Get all users from backend
export const getAllUsers = async (): Promise<User[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('users');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllUsersResponse = await response.json();

    if (data.success && data.data) {
      // Map backend user format to frontend format
      return data.data.users.map((user: any) => ({
        id: user._id || user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phonenumber: user.phonenumber,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } else {
      throw new Error(data.message || 'Failed to fetch users');
    }
  } catch (error: any) {
    console.error('Get all users API error:', error);
    throw error;
  }
};

// Get user by ID from backend
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`users/${id}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not found
      }
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetUserByIdResponse = await response.json();

    if (data.success && data.data) {
      const user: any = data.data.user;
      // Map backend user format to frontend format
      return {
        id: user._id || user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phonenumber: user.phonenumber,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } else {
      throw new Error(data.message || 'Failed to fetch user');
    }
  } catch (error: any) {
    console.error('Get user by ID API error:', error);
    throw error;
  }
};

// Get users by role from backend
export const getUsersByRole = async (role: 'admin' | 'employee'): Promise<User[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`users/role/${role}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetUsersByRoleResponse = await response.json();

    if (data.success && data.data) {
      // Map backend user format to frontend format
      return data.data.users.map((user: any) => ({
        id: user._id || user.id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        phonenumber: user.phonenumber,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }));
    } else {
      throw new Error(data.message || 'Failed to fetch users by role');
    }
  } catch (error: any) {
    console.error('Get users by role API error:', error);
    throw error;
  }
};

// Helper function to find user by id (for backward compatibility)
// This now uses the API instead of dummy data
export const findUserById = async (id: string): Promise<User | undefined> => {
  try {
    const user = await getUserById(id);
    return user || undefined;
  } catch (error) {
    console.error('Error finding user by ID:', error);
    return undefined;
  }
};

