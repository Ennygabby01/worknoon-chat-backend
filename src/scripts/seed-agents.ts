import bcrypt from "bcrypt";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDatabase } from "../config/database.js";
import { UserModel } from "../modules/users/user.model.js";

const seedAgentsSchema = z.object({
  SEED_AGENT_PASSWORD: z.string().min(8).max(128),
  SEED_AGENT_1_EMAIL: z.string().trim().email().max(160).transform((v) => v.toLowerCase()),
  SEED_AGENT_1_NAME: z.string().trim().min(2).max(80).default("Agent One"),
  SEED_AGENT_2_EMAIL: z.string().trim().email().max(160).transform((v) => v.toLowerCase()),
  SEED_AGENT_2_NAME: z.string().trim().min(2).max(80).default("Agent Two"),
  SEED_AGENT_3_EMAIL: z.string().trim().email().max(160).transform((v) => v.toLowerCase()),
  SEED_AGENT_3_NAME: z.string().trim().min(2).max(80).default("Agent Three")
});

const passwordHashRounds = 12;

async function seedAgents() {
  const input = seedAgentsSchema.parse(process.env);
  const passwordHash = await bcrypt.hash(input.SEED_AGENT_PASSWORD, passwordHashRounds);

  const agents = [
    { email: input.SEED_AGENT_1_EMAIL, name: input.SEED_AGENT_1_NAME },
    { email: input.SEED_AGENT_2_EMAIL, name: input.SEED_AGENT_2_NAME },
    { email: input.SEED_AGENT_3_EMAIL, name: input.SEED_AGENT_3_NAME }
  ];

  for (const agent of agents) {
    const user = await UserModel.findOneAndUpdate(
      { email: agent.email },
      {
        $set: {
          email: agent.email,
          name: agent.name,
          passwordHash,
          role: "agent",
          emailVerifiedAt: new Date()
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
      throw new Error(`Agent seed failed for ${agent.email}`);
    }

    console.log(`Seeded agent: ${user.email}`);
  }
}

try {
  await connectDatabase();
  await seedAgents();
} finally {
  await mongoose.disconnect();
}
