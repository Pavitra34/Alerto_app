// User Data Type
export interface User {
  id: string;
  fullname: string;
  email: string;
  phonenumber: number;
  role: string;
}

// Dummy Users Data (10 users)
export const dummyUsers: User[] = [
  {
    id: "1",
    fullname: "Kish Danu",
    email: "danu@gmail.com",
    phonenumber: 9876543210,
    role: "admin",
  },
  {
    id: "2",
    fullname: "Suthakaran Pavitra",
    email: "pavi@gmail.com",
    phonenumber: 9876543211,
    role: "employee",
  },
  {
    id: "3",
    fullname: "Michael Johnson",
    email: "michael.johnson@example.com",
    phonenumber: 9876543212,
    role: "employee",
  },
  {
    id: "4",
    fullname: "Emily Williams",
    email: "emily.williams@example.com",
    phonenumber: 9876543213,
    role: "admin",
  },
  {
    id: "5",
    fullname: "Danu Krish",
    email: "david.brown@example.com",
    phonenumber: 9876543214,
    role: "employee",
  },
  {
    id: "6",
    fullname: "Sarah Davis",
    email: "sarah.davis@example.com",
    phonenumber: 9876543215,
    role: "superadmin",
  },
  {
    id: "7",
    fullname: "Robert Miller",
    email: "robert.miller@example.com",
    phonenumber: 9876543216,
    role: "employee",
  },
  {
    id: "8",
    fullname: "Jennifer Wilson",
    email: "jennifer.wilson@example.com",
    phonenumber: 9876543217,
    role: "admin",
  },
  {
    id: "9",
    fullname: "William Moore",
    email: "william.moore@example.com",
    phonenumber: 9876543218,
    role: "employee",
  },
  {
    id: "10",
    fullname: "Lisa Taylor",
    email: "lisa.taylor@example.com",
    phonenumber: 9876543219,
    role: "admin",
  },
];

// Helper function to find user by id
export const findUserById = (id: string): User | undefined => {
  return dummyUsers.find((user) => user.id === id);
};

