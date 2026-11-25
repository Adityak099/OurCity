export const DEMO_USERS = [
  {
    id: "USR001",
    name: "Aditya Kumar",
    email: "citizen@cleancity.demo",
    password: "citizen123",
    role: "citizen",
  },
  {
    id: "ADM001",
    name: "CleanCity Administrator",
    email: "admin@cleancity.demo",
    password: "admin123",
    role: "admin",
  },
  {
    id: "DRV001",
    name: "Rahul Sharma",
    email: "driver@cleancity.demo",
    password: "driver123",
    role: "driver",
    vehicleNumber: "WB 60 AB 1234",
    assignedWard: "Ward 12",
  },
];

export const ROLE_ROUTES = {
  citizen: "/citizen/dashboard",
  admin: "/admin/dashboard",
  driver: "/driver/dashboard",
};
