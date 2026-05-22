import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDatabase } from "../config/database.js";
import { UserModel } from "../modules/users/user.model.js";

const seedAdminSchema = z.object({
  SEED_ADMIN_EMAIL: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  SEED_ADMIN_NAME: z.string().trim().min(2).max(80).default("Worknoon Admin"),
  SEED_ADMIN_PASSWORD: z.string().min(8).max(128)
});

const passwordHashRounds = 12;

async function seedAdmin() {
  const input = seedAdminSchema.parse(process.env);
  const passwordHash = await bcrypt.hash(input.SEED_ADMIN_PASSWORD, passwordHashRounds);

  const user = await UserModel.findOneAndUpdate(
    { email: input.SEED_ADMIN_EMAIL },
    {
      $set: {
        email: input.SEED_ADMIN_EMAIL,
        name: input.SEED_ADMIN_NAME,
        passwordHash,
        role: "admin"
      }
    },
    {
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
      upsert: true
    }
  );

  if (!user) {
    throw new Error("Admin seed failed");
  }

  console.log(`Seeded admin user: ${user.email}`);
}

try {
  await connectDatabase();
  await seedAdmin();
} finally {
  await mongoose.disconnect();
}
