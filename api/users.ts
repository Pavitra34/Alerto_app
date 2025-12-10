// User Data Type
export interface User {
  id: string;
  fullname: string;
  username: string;
  email: string;
  phonenumber: number;
  role: string;
}

// Dummy Users Data (10 users)
export const dummyUsers: User[] = [
  {
    id: "1",
    fullname: "Kish Danu",
    username: "Danu",
    email: "danu@gmail.com",
    phonenumber: 9876543210,
    role: "admin",
  },
  {
    id: "2",
    fullname: "Suthakaran Pavitra",
    username: "Pavi",
    email: "pavi@gmail.com",
    phonenumber: 9876543211,
    role: "employee",
  },
  {
    id: "3",
    fullname: "Michael Johnson",
    username: "michael_johnson",
    email: "michael.johnson@example.com",
    phonenumber: 9876543212,
    role: "employee",
  },
  {
    id: "4",
    fullname: "Emily Williams",
    username: "emily_williams",
    email: "emily.williams@example.com",
    phonenumber: 9876543213,
    role: "admin",
  },
  {
    id: "5",
    fullname: "Danu Krish",
    username: "david_brown",
    email: "david.brown@example.com",
    phonenumber: 9876543214,
    role: "employee",
  },
  {
    id: "6",
    fullname: "Sarah Davis",
    username: "sarah_davis",
    email: "sarah.davis@example.com",
    phonenumber: 9876543215,
    role: "superadmin",
  },
  {
    id: "7",
    fullname: "Robert Miller",
    username: "robert_miller",
    email: "robert.miller@example.com",
    phonenumber: 9876543216,
    role: "employee",
  },
  {
    id: "8",
    fullname: "Jennifer Wilson",
    username: "jennifer_wilson",
    email: "jennifer.wilson@example.com",
    phonenumber: 9876543217,
    role: "admin",
  },
  {
    id: "9",
    fullname: "William Moore",
    username: "william_moore",
    email: "william.moore@example.com",
    phonenumber: 9876543218,
    role: "employee",
  },
  {
    id: "10",
    fullname: "Lisa Taylor",
    username: "lisa_taylor",
    email: "lisa.taylor@example.com",
    phonenumber: 9876543219,
    role: "admin",
  },
];

// Helper function to find user by id
export const findUserById = (id: string): User | undefined => {
  return dummyUsers.find((user) => user.id === id);
};

