// Authentication User Data Type
export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

// Backend API Response Types
export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
      fullname: string;
      phonenumber: number;
      role: string;
    };
  };
  error?: string;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      id: string;
      username: string;
      email: string;
      fullname: string;
      phonenumber: number;
      role: string;
    };
  };
  errors?: {
    email?: string;
    username?: string;
    fullname?: string;
    phonenumber?: string;
    password?: string;
  };
}

// Login function that calls backend API
export const validateLogin = async (
  emailOrUsername: string,
  password: string
): Promise<{ user: AuthUser; token: string; fullUser: any }> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('auth/login');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailOrUsername: emailOrUsername.trim(),
        password: password,
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(errorData.message || `Server error: ${response.status}`);
      } catch {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const data: LoginResponse = await response.json();

    if (data.success && data.data) {
      return {
        user: {
          id: data.data.user.id,
          username: data.data.user.username,
          email: data.data.user.email,
        },
        token: data.data.token,
        fullUser: data.data.user,
      };
    } else {
      throw new Error(data.message || data.error || 'Invalid credentials');
    }
  } catch (error: any) {
    if (error.message && (
      error.message.includes('Network request failed') || 
      error.message.includes('Failed to fetch') ||
      error.message.includes('NetworkError')
    )) {
      throw new Error(
        'Cannot connect to backend server. Please check:\n' +
        '1. Backend server is running\n' +
        '2. Update API URL in constants/api.ts\n' +
        '3. For physical devices, use IP address instead of localhost'
      );
    }
    
    if (error.message && error.message.includes('JSON')) {
      throw new Error('Server error. Please check if the backend server is running correctly.');
    }
    
    throw error;
  }
};

// Register user function that calls backend API
export const registerUser = async (
  fullname: string,
  email: string,
  phonenumber: number,
  username: string,
  password: string,
  role?: string
): Promise<{ user: any; token: string }> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('auth/register');

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fullname: fullname.trim(),
        email: email.trim(),
        phonenumber: phonenumber,
        username: username.trim(),
        password: password,
        role: role || 'employee',
      }),
    });

    if (!response.ok) {
      try {
        const errorData = await response.json();
        const error: any = new Error(errorData.message || 'Registration failed');
        error.errors = errorData.errors;
        throw error;
      } catch (parseError) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }
    }

    const data: RegisterResponse = await response.json();

    if (data.success && data.data) {
      return {
        user: data.data.user,
        token: data.data.token,
      };
    } else {
      const error: any = new Error(data.message || 'Registration failed');
      error.errors = data.errors;
      throw error;
    }
  } catch (error: any) {
    throw error;
  }
};

