// Authentication User Data Type
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  password: string;
}

// Dummy Authentication Data (10 users - IDs match with users.ts)
export const dummyUsers: AuthUser[] = [
  {
    id: "1",
    username: "john_doe",
    email: "john.doe@example.com",
    password: "password123",
  },
  {
    id: "2",
    username: "jane_smith",
    email: "jane.smith@example.com",
    password: "password456",
  },
  {
    id: "3",
    username: "michael_johnson",
    email: "michael.johnson@example.com",
    password: "password789",
  },
  {
    id: "4",
    username: "emily_williams",
    email: "emily.williams@example.com",
    password: "password012",
  },
  {
    id: "5",
    username: "david_brown",
    email: "david.brown@example.com",
    password: "password345",
  },
  {
    id: "6",
    username: "sarah_davis",
    email: "sarah.davis@example.com",
    password: "password678",
  },
  {
    id: "7",
    username: "robert_miller",
    email: "robert.miller@example.com",
    password: "password901",
  },
  {
    id: "8",
    username: "jennifer_wilson",
    email: "jennifer.wilson@example.com",
    password: "password234",
  },
  {
    id: "9",
    username: "william_moore",
    email: "william.moore@example.com",
    password: "password567",
  },
  {
    id: "10",
    username: "lisa_taylor",
    email: "lisa.taylor@example.com",
    password: "password890",
  },
];

// Helper function to find user by email
export const findUserByEmail = (email: string): AuthUser | undefined => {
  return dummyUsers.find((user) => user.email === email);
};

// Helper function to find user by username
export const findUserByUsername = (username: string): AuthUser | undefined => {
  return dummyUsers.find((user) => user.username === username);
};

// Helper function to validate login credentials
export const validateLogin = (
  emailOrUsername: string,
  password: string
): AuthUser | null => {
  const user =
    findUserByEmail(emailOrUsername) ||
    findUserByUsername(emailOrUsername);

  if (user && user.password === password) {
    return user;
  }

  return null;
};

