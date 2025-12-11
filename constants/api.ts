// API Configuration
// Change this to your backend server URL
// 
// IMPORTANT: For React Native on physical devices, use your computer's IP address instead of localhost
// 
// To find your IP address:
// Windows: Open CMD and type "ipconfig" - look for "IPv4 Address" under your active network adapter
// Mac/Linux: Open Terminal and type "ifconfig" or "ip addr" - look for "inet" address
// 
// Example: 'http://192.168.1.100:3000/api' (replace with your actual IP and port)
// 
// Make sure:
// 1. Backend server is running on the specified port
// 2. Both devices (computer and phone) are on the same WiFi network
// 3. Firewall allows connections on the backend port
export const API_BASE_URL = __DEV__ 
  ? 'http://192.168.8.114:8000/api' // Development - using your computer's IP address (192.168.8.114) and port 8000
  : 'https://your-production-api.com/api'; // Production URL

// Helper function to get full API URL
export const getApiUrl = (endpoint: string): string => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${cleanEndpoint}`;
};

