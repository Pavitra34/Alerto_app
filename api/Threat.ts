// Threat Data Type
export interface Threat {
  _id: string;
  camera_id: string; // matches Camera _id from Camera.ts
  threat_type: string; // example: "intruder", "fire", "motion"
  createdat: string; // ISO date
  updatedat: string; // ISO date
}

// Dummy Threat Data (3 threats)
// camera_ids link to cameras from Camera.ts (ids: "cam001", "cam002", "cam003")
export const dummyThreats: Threat[] = [
  {
    _id: "threat001",
    camera_id: "cam001", // Main Entrance Camera
    threat_type: "intruder",
    createdat: "2024-12-20T10:30:00.000Z",
    updatedat: "2024-12-20T10:35:00.000Z",
  },
  {
    _id: "threat002",
    camera_id: "cam002", // Parking Lot Camera
    threat_type: "motion",
    createdat: "2024-12-20T11:15:00.000Z",
    updatedat: "2024-12-20T11:20:00.000Z",
  },
  {
    _id: "threat003",
    camera_id: "cam003", // Warehouse Security Camera
    threat_type: "fire",
    createdat: "2024-12-20T13:45:00.000Z",
    updatedat: "2024-12-20T13:50:00.000Z",
  },
];

// Helper function to find threat by id
export const findThreatById = (id: string): Threat | undefined => {
  return dummyThreats.find((threat) => threat._id === id);
};

// Helper function to find threats by camera_id
export const findThreatsByCameraId = (cameraId: string): Threat[] => {
  return dummyThreats.filter((threat) => threat.camera_id === cameraId);
};

// Helper function to find threats by threat_type
export const findThreatsByType = (threatType: string): Threat[] => {
  return dummyThreats.filter((threat) => threat.threat_type === threatType);
};

