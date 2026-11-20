import "dotenv/config";
import prisma from "./config/prisma.js";

const user = await prisma.user.create({
  data: {
    fullName: "TaskFlow Test User",
    email: "test@taskflow.com",
  },
});

console.log(user);

await prisma.$disconnect();