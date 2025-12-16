// Threat Data Type
export interface Threat {
  _id: string;
  camera_id: string; // matches Camera _id from Camera.ts
  camera_name?: string;
  camera_location?: string;
  threat_type: string; // example: "intruder", "fire", "motion", "Unauthorized Access"
  threat_level: "low" | "medium" | "high" | string;
  threat_status: boolean; // true = assigned, false = unassigned
  threat_description?: string;
  threat_image?: string;
  assigned_to?: string | null;
  resolved_at?: string | null;
  resolved_by?: string | null;
  createdat: string; // ISO date
  updatedat: string; // ISO date
}

// API Response Types
export interface GetAllThreatsResponse {
  success: boolean;
  message: string;
  data: {
    threats: Threat[];
    count: number;
  };
}

export interface GetThreatByIdResponse {
  success: boolean;
  message: string;
  data: {
    threat: Threat;
  };
}

// Get all threats from backend API
export const getAllThreats = async (): Promise<Threat[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl('threats');

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllThreatsResponse = await response.json();

    if (data.success && data.data) {
      return data.data.threats.map((threat: any) => ({
        _id: threat._id,
        camera_id: threat.camera_id,
        camera_name: threat.camera_name,
        camera_location: threat.camera_location,
        threat_type: threat.threat_type,
        threat_level: threat.threat_level,
        threat_status: threat.threat_status,
        threat_description: threat.threat_description,
        threat_image: threat.threat_image,
        assigned_to: threat.assigned_to,
        resolved_at: threat.resolved_at,
        resolved_by: threat.resolved_by,
        createdat: threat.createdat || new Date().toISOString(),
        updatedat: threat.updatedat || new Date().toISOString(),
      }));
    } else {
      throw new Error(data.message || 'Failed to get threats');
    }
  } catch (error: any) {
    console.error('Get all threats API error:', error);
    throw error;
  }
};

// Get threat by ID from backend API
export const findThreatById = async (id: string): Promise<Threat | null> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`threats/${id}`);

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

    const data: GetThreatByIdResponse = await response.json();

    if (data.success && data.data) {
      const threat = data.data.threat;
      return {
        _id: threat._id,
        camera_id: threat.camera_id,
        camera_name: threat.camera_name,
        camera_location: threat.camera_location,
        threat_type: threat.threat_type,
        threat_level: threat.threat_level,
        threat_status: threat.threat_status,
        threat_description: threat.threat_description,
        threat_image: threat.threat_image,
        assigned_to: threat.assigned_to,
        resolved_at: threat.resolved_at,
        resolved_by: threat.resolved_by,
        createdat: threat.createdat || new Date().toISOString(),
        updatedat: threat.updatedat || new Date().toISOString(),
      };
    } else {
      throw new Error(data.message || 'Failed to get threat');
    }
  } catch (error: any) {
    console.error('Get threat by ID API error:', error);
    throw error;
  }
};

// Get threats by status from backend API
export const getThreatsByStatus = async (status: boolean): Promise<Threat[]> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`threats/status/${status}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: GetAllThreatsResponse = await response.json();

    if (data.success && data.data) {
      return data.data.threats.map((threat: any) => ({
        _id: threat._id,
        camera_id: threat.camera_id,
        camera_name: threat.camera_name,
        camera_location: threat.camera_location,
        threat_type: threat.threat_type,
        threat_level: threat.threat_level,
        threat_status: threat.threat_status,
        threat_description: threat.threat_description,
        threat_image: threat.threat_image,
        assigned_to: threat.assigned_to,
        resolved_at: threat.resolved_at,
        resolved_by: threat.resolved_by,
        createdat: threat.createdat || new Date().toISOString(),
        updatedat: threat.updatedat || new Date().toISOString(),
      }));
    } else {
      throw new Error(data.message || 'Failed to get threats by status');
    }
  } catch (error: any) {
    console.error('Get threats by status API error:', error);
    throw error;
  }
};

// Get threats by camera ID from backend API
export const findThreatsByCameraId = async (cameraId: string): Promise<Threat[]> => {
  try {
    const allThreats = await getAllThreats();
    return allThreats.filter((threat) => threat.camera_id === cameraId);
  } catch (error: any) {
    console.error('Get threats by camera ID API error:', error);
    throw error;
  }
};

// Helper function to find threats by threat_type
export const findThreatsByType = async (threatType: string): Promise<Threat[]> => {
  try {
    const allThreats = await getAllThreats();
    return allThreats.filter((threat) => threat.threat_type === threatType);
  } catch (error: any) {
    console.error('Get threats by type API error:', error);
    throw error;
  }
};

// Helper function to find threats by threat_level
export const findThreatsByLevel = async (level: string): Promise<Threat[]> => {
  try {
    const allThreats = await getAllThreats();
    return allThreats.filter((threat) => threat.threat_level === level);
  } catch (error: any) {
    console.error('Get threats by level API error:', error);
    throw error;
  }
};

// Helper function to find threats by threat_status (for backward compatibility)
export const findThreatsByStatus = async (status: boolean): Promise<Threat[]> => {
  return await getThreatsByStatus(status);
};

// Helper function to get all assigned threats (threats with assigned_to not null)
export const getAssignedThreats = async (): Promise<Threat[]> => {
  try {
    const allThreats = await getAllThreats();
    return allThreats.filter((threat) => threat.assigned_to !== null && threat.assigned_to !== undefined);
  } catch (error: any) {
    console.error('Get assigned threats API error:', error);
    throw error;
  }
};

// Helper function to get all unassigned threats (threats with assigned_to null)
export const getUnassignedThreats = async (): Promise<Threat[]> => {
  try {
    const allThreats = await getAllThreats();
    return allThreats.filter((threat) => !threat.assigned_to || threat.assigned_to === null);
  } catch (error: any) {
    console.error('Get unassigned threats API error:', error);
    throw error;
  }
};

// Update threat status
export interface UpdateThreatStatusResponse {
  success: boolean;
  message: string;
  data: {
    threat: Threat;
  };
}

export const updateThreatStatus = async (
  threatId: string,
  threat_status: boolean,
  assigned_to?: string | null
): Promise<Threat> => {
  try {
    const { getApiUrl } = require('../constants/api');
    const apiUrl = getApiUrl(`threats/${threatId}/status`);

    const response = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        threat_status,
        assigned_to: assigned_to || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data: UpdateThreatStatusResponse = await response.json();

    if (data.success && data.data) {
      const threat = data.data.threat;
      return {
        _id: threat._id,
        camera_id: threat.camera_id,
        camera_name: threat.camera_name,
        camera_location: threat.camera_location,
        threat_type: threat.threat_type,
        threat_level: threat.threat_level,
        threat_status: threat.threat_status,
        threat_description: threat.threat_description,
        threat_image: threat.threat_image,
        assigned_to: threat.assigned_to,
        resolved_at: threat.resolved_at,
        resolved_by: threat.resolved_by,
        createdat: threat.createdat || new Date().toISOString(),
        updatedat: threat.updatedat || new Date().toISOString(),
      };
    } else {
      throw new Error(data.message || 'Failed to update threat status');
    }
  } catch (error: any) {
    console.error('Update threat status API error:', error);
    throw error;
  }
};
