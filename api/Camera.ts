// Camera Data Type
export interface Camera {
  _id: string;
  name: string;
  location: string;
  camera_status: boolean;
  camera_view: string; // media URL or local path
  createdat: string; // ISO date
  updatedat: string; // ISO date
}

// API Response Types
export interface GetAllCamerasResponse {
  success: boolean;
  message: string;
  data: {
    cameras: Camera[];
    count: number;
  };
}

export interface GetCameraByIdResponse {
  success: boolean;
  message: string;
  data: {
    camera: Camera;
  };
}

// Get all cameras from backend API
export const getAllCameras = async (): Promise<Camera[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('cameras');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllCamerasResponse = await response.json();

    if (data.success && data.data) {
      return data.data.cameras.map((cam: any) => ({
        _id: cam._id,
        name: cam.name,
        location: cam.location,
        camera_status: cam.camera_status,
        camera_view: cam.camera_view,
        createdat: cam.createdat || new Date().toISOString(),
        updatedat: cam.updatedat || new Date().toISOString(),
      } as Camera));
    } else {
      throw new Error(data.message || 'Failed to get cameras');
    }
  } catch (error: any) {
    console.error('Get all cameras API error:', error);
    throw error;
  }
};

// Get camera by ID from backend API
export const findCameraById = async (id: string): Promise<Camera | null> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`cameras/${id}`);

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

    const data: GetCameraByIdResponse = await response.json();

    if (data.success && data.data) {
      const cam = data.data.camera;
      return {
        _id: cam._id,
        name: cam.name,
        location: cam.location,
        camera_status: cam.camera_status,
        camera_view: cam.camera_view,
        createdat: cam.createdat || new Date().toISOString(),
        updatedat: cam.updatedat || new Date().toISOString(),
      };
    } else {
      throw new Error(data.message || 'Failed to get camera');
    }
  } catch (error: any) {
    console.error('Get camera by ID API error:', error);
    throw error;
  }
};

// Get all active cameras from backend API
export const getActiveCameras = async (): Promise<Camera[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('cameras/active');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllCamerasResponse = await response.json();

    if (data.success && data.data) {
      return data.data.cameras.map((cam: any) => ({
        _id: cam._id,
        name: cam.name,
        location: cam.location,
        camera_status: cam.camera_status,
        camera_view: cam.camera_view,
        createdat: cam.createdat || new Date().toISOString(),
        updatedat: cam.updatedat || new Date().toISOString(),
      }));
    } else {
      throw new Error(data.message || 'Failed to get active cameras');
    }
  } catch (error: any) {
    console.error('Get active cameras API error:', error);
    throw error;
  }
};

// Get all inactive cameras from backend API
export const getInactiveCameras = async (): Promise<Camera[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('cameras/inactive');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllCamerasResponse = await response.json();

    if (data.success && data.data) {
      return data.data.cameras.map((cam: any) => ({
        _id: cam._id,
        name: cam.name,
        location: cam.location,
        camera_status: cam.camera_status,
        camera_view: cam.camera_view,
        createdat: cam.createdat || new Date().toISOString(),
        updatedat: cam.updatedat || new Date().toISOString(),
      }));
    } else {
      throw new Error(data.message || 'Failed to get inactive cameras');
    }
  } catch (error: any) {
    console.error('Get inactive cameras API error:', error);
    throw error;
  }
};

