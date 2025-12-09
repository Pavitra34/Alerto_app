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

// Dummy Camera Data (3 cameras)
export const dummyCameras: Camera[] = [
  {
    _id: "cam001",
    name: "Main Entrance Camera",
    location: "Building A - Main Entrance",
    camera_status: true,
    camera_view: "https://example.com/camera-feeds/cam001/live",
    createdat: "2024-01-15T08:30:00.000Z",
    updatedat: "2024-12-20T14:45:00.000Z",
  },
  {
    _id: "cam002",
    name: "Parking Lot Camera",
    location: "Building B - Parking Lot North",
    camera_status: true,
    camera_view: "https://example.com/camera-feeds/cam002/live",
    createdat: "2024-02-10T10:15:00.000Z",
    updatedat: "2024-12-19T09:20:00.000Z",
  },
  {
    _id: "cam003",
    name: "Warehouse Security Camera",
    location: "Building C - Warehouse Section 3",
    camera_status: false,
    camera_view: "https://example.com/camera-feeds/cam003/live",
    createdat: "2024-03-05T12:00:00.000Z",
    updatedat: "2024-12-18T16:30:00.000Z",
  },
];

// Helper function to find camera by id
export const findCameraById = (id: string): Camera | undefined => {
  return dummyCameras.find((camera) => camera._id === id);
};

// Helper function to get all active cameras
export const getActiveCameras = (): Camera[] => {
  return dummyCameras.filter((camera) => camera.camera_status === true);
};

// Helper function to get all inactive cameras
export const getInactiveCameras = (): Camera[] => {
  return dummyCameras.filter((camera) => camera.camera_status === false);
};

