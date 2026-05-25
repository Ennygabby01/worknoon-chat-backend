import bcrypt from "bcrypt";
import mongoose, { type Types } from "mongoose";
import { z } from "zod";
import { connectDatabase } from "../config/database.js";
import { ConversationModel, type ConversationStatus, type ConversationType } from "../modules/conversations/conversation.model.js";
import { createConversationMessage } from "../modules/messages/message.service.js";
import { OrderModel, type OrderStatus } from "../modules/orders/order.model.js";
import { UserModel } from "../modules/users/user.model.js";
import type { UserRole } from "../modules/users/user-role.js";

const seedDemoSchema = z.object({
  SEED_DEMO_PASSWORD: z.string().min(8).max(128)
});

const passwordHashRounds = 12;

type DemoUser = {
  name: string;
  email: string;
  role: UserRole;
  banned?: boolean;
  bio?: string;
  location?: string;
  ordersCompleted?: number;
  conversationsCount?: number;
};

type DemoMessage = {
  senderEmail: string;
  body: string;
};

type DemoConversation = {
  key: string;
  type: ConversationType;
  status: ConversationStatus;
  participantEmails: string[];
  assignedAgentEmail?: string;
  topic?: string;
  productContext?: {
    productId?: string;
    productName?: string;
  };
  messages: DemoMessage[];
};

type DemoOrder = {
  orderNumber: string;
  buyerEmail: string;
  sellerEmail: string;
  productName: string;
  amount: number;
  status: OrderStatus;
  conversationKey?: string;
  daysAgo: number;
};

const demoUsers: DemoUser[] = [
  { name: "Gabriel Bamiduro", email: "bamiduroeniolagabriel@gmail.com", role: "admin", location: "Lagos, NG" },
  { name: "Gabriel Torres", email: "gabriel@example.com", role: "customer", location: "Lagos, NG" },
  { name: "Kwame Boateng", email: "kwame.b@example.com", role: "customer", location: "Accra, GH" },
  { name: "Nadia Petrov", email: "nadia.p@example.com", role: "customer", location: "Abuja, NG" },
  { name: "Alice Johnson", email: "alice@example.com", role: "designer", bio: "Brand identity and digital product design. Clean, intentional work.", location: "Lagos, NG", ordersCompleted: 38, conversationsCount: 52 },
  { name: "Brandify Studio", email: "studio@brandify.com", role: "designer", bio: "Full-service creative studio. Strategy, identity, and visual systems.", location: "Abuja, NG", ordersCompleted: 61, conversationsCount: 89 },
  { name: "Sofia Reyes", email: "sofia.reyes@example.com", role: "designer", bio: "Editorial graphics and polished campaign systems for launch teams.", location: "Dakar, SN", ordersCompleted: 29, conversationsCount: 44 },
  { name: "Zara Osei", email: "zara@example.com", role: "designer", bio: "Motion and UI designer. Bringing interfaces to life with purpose.", location: "Accra, GH", ordersCompleted: 22, conversationsCount: 31 },
  { name: "Ike Design", email: "ike@ikedesign.com", role: "designer", bio: "Packaging and print. Tactile design that stands on shelf.", location: "Enugu, NG", ordersCompleted: 17, conversationsCount: 24 },
  { name: "Nora Visuals", email: "nora@nora-visuals.com", role: "designer", bio: "Product photography direction, social templates, and launch visuals.", location: "Kigali, RW", ordersCompleted: 33, conversationsCount: 47 },
  { name: "TechStore", email: "hello@techstore.com", role: "merchant", bio: "Consumer electronics and accessories. Fast shipping, no hassle returns.", location: "Port Harcourt, NG", ordersCompleted: 124, conversationsCount: 207 },
  { name: "Urban Shop", email: "hello@urbanshop.com", role: "merchant", bio: "Streetwear and lifestyle goods curated for modern taste.", location: "Lagos, NG", ordersCompleted: 88, conversationsCount: 113 },
  { name: "NovaMart", email: "hello@novamart.com", role: "merchant", bio: "Home goods, kitchen, and decor. Trusted by over 2,000 customers.", location: "Kano, NG", ordersCompleted: 213, conversationsCount: 340 },
  { name: "GreenLeaf Market", email: "info@greenleaf.com", role: "merchant", bio: "Organic food and wellness products sourced from local farms.", location: "Ibadan, NG", ordersCompleted: 56, conversationsCount: 78 },
  { name: "James Adeyemi", email: "jadeyemi@example.com", role: "merchant", bio: "Premium bags, leather goods, and everyday accessories.", location: "Lagos, NG", ordersCompleted: 71, conversationsCount: 96 },
  { name: "Tunde Fashola", email: "tunde.f@example.com", role: "merchant", bio: "Seasonal sportswear and fitness gear.", location: "Abeokuta, NG", ordersCompleted: 42, conversationsCount: 68, banned: true },
  { name: "Amara Osei", email: "amara.osei@worknoon.io", role: "agent", location: "Lagos, NG", conversationsCount: 148 },
  { name: "Lena Kovac", email: "lena.kovac@worknoon.io", role: "agent", location: "Abuja, NG", conversationsCount: 132 },
  { name: "Maya Chen", email: "maya@worknoon.com", role: "agent", location: "Remote", conversationsCount: 117 },
  { name: "James Okafor", email: "james@worknoon.com", role: "agent", location: "Port Harcourt, NG", conversationsCount: 121 }
];

const demoConversations: DemoConversation[] = [
  {
    key: "designer-alice-logo-feedback",
    type: "direct",
    status: "open",
    participantEmails: ["gabriel@example.com", "alice@example.com"],
    topic: "Alice Johnson",
    messages: [
      { senderEmail: "gabriel@example.com", body: "Hi Alice, I love this design!" },
      { senderEmail: "alice@example.com", body: "Hi! Thank you so much." },
      { senderEmail: "alice@example.com", body: "Would you like any changes to the colors?" },
      { senderEmail: "gabriel@example.com", body: "Yes, can you make the background darker and the text white?" },
      { senderEmail: "alice@example.com", body: "Sure. Give me a few minutes." }
    ]
  },
  {
    key: "merchant-techstore-headphones",
    type: "direct",
    status: "open",
    participantEmails: ["gabriel@example.com", "hello@techstore.com"],
    topic: "TechStore",
    productContext: { productId: "WNC-1042", productName: "Wireless Headphones" },
    messages: [
      { senderEmail: "gabriel@example.com", body: "Hey, I placed an order but have not received a confirmation." },
      { senderEmail: "hello@techstore.com", body: "Hello. How can I help you today?" },
      { senderEmail: "gabriel@example.com", body: "Hi. When will my order be shipped?" },
      { senderEmail: "hello@techstore.com", body: "Thank you. I will check it." }
    ]
  },
  {
    key: "support-refund",
    type: "support",
    status: "assigned",
    assignedAgentEmail: "amara.osei@worknoon.io",
    participantEmails: ["gabriel@example.com", "amara.osei@worknoon.io"],
    topic: "Refund request",
    messages: [
      { senderEmail: "gabriel@example.com", body: "Hi, I need help with a refund." },
      { senderEmail: "amara.osei@worknoon.io", body: "I can help with that. What is the issue?" },
      { senderEmail: "amara.osei@worknoon.io", body: "Please provide your order ID." }
    ]
  },
  {
    key: "designer-brandify-variations",
    type: "direct",
    status: "open",
    participantEmails: ["gabriel@example.com", "studio@brandify.com"],
    topic: "Brandify Studio",
    messages: [
      { senderEmail: "gabriel@example.com", body: "Hey, can you share the logo variations?" },
      { senderEmail: "studio@brandify.com", body: "Of course. Working on them now." },
      { senderEmail: "studio@brandify.com", body: "Here is the preview you asked for." }
    ]
  },
  {
    key: "merchant-urban-jacket",
    type: "direct",
    status: "open",
    participantEmails: ["gabriel@example.com", "hello@urbanshop.com"],
    topic: "Urban Shop",
    productContext: { productId: "WNC-1038", productName: "Urban Jacket (Size L)" },
    messages: [
      { senderEmail: "gabriel@example.com", body: "Do you carry this jacket in size L?" },
      { senderEmail: "hello@urbanshop.com", body: "Hi. Let me check our stock." },
      { senderEmail: "hello@urbanshop.com", body: "Of course. We have size L." }
    ]
  },
  {
    key: "support-return-request",
    type: "support",
    status: "resolved",
    assignedAgentEmail: "lena.kovac@worknoon.io",
    participantEmails: ["nadia.p@example.com", "lena.kovac@worknoon.io"],
    topic: "Return request",
    productContext: { productId: "WNC-1024", productName: "Leather Tote Bag" },
    messages: [
      { senderEmail: "nadia.p@example.com", body: "I need to return a bag from my last order." },
      { senderEmail: "lena.kovac@worknoon.io", body: "I have reviewed it. Your return has been approved." }
    ]
  },
  {
    key: "support-payment-queue",
    type: "support",
    status: "escalated",
    participantEmails: ["sofia.reyes@example.com"],
    topic: "Payment not reflecting",
    messages: [
      { senderEmail: "sofia.reyes@example.com", body: "My payment has not reflected after three days." }
    ]
  }
];

const demoOrders: DemoOrder[] = [
  { orderNumber: "WNC-1042", buyerEmail: "gabriel@example.com", sellerEmail: "hello@techstore.com", productName: "Wireless Headphones", amount: 89.99, status: "delivered", conversationKey: "merchant-techstore-headphones", daysAgo: 18 },
  { orderNumber: "WNC-1038", buyerEmail: "gabriel@example.com", sellerEmail: "hello@urbanshop.com", productName: "Urban Jacket (Size L)", amount: 145, status: "shipped", conversationKey: "merchant-urban-jacket", daysAgo: 9 },
  { orderNumber: "WNC-1031", buyerEmail: "gabriel@example.com", sellerEmail: "alice@example.com", productName: "Logo Design Package", amount: 250, status: "delivered", conversationKey: "designer-alice-logo-feedback", daysAgo: 24 },
  { orderNumber: "WNC-1027", buyerEmail: "gabriel@example.com", sellerEmail: "studio@brandify.com", productName: "Brand Identity Kit", amount: 450, status: "processing", conversationKey: "designer-brandify-variations", daysAgo: 3 },
  { orderNumber: "WNC-1019", buyerEmail: "gabriel@example.com", sellerEmail: "hello@techstore.com", productName: "Minimalist Watch", amount: 199, status: "cancelled", daysAgo: 31 },
  { orderNumber: "WNC-1011", buyerEmail: "gabriel@example.com", sellerEmail: "hello@urbanshop.com", productName: "Custom Hoodie Print", amount: 75, status: "returned", daysAgo: 45 },
  { orderNumber: "WNC-1007", buyerEmail: "gabriel@example.com", sellerEmail: "hello@urbanshop.com", productName: "Leather Wallet", amount: 55, status: "delivered", daysAgo: 60 },
  { orderNumber: "WNC-1003", buyerEmail: "gabriel@example.com", sellerEmail: "alice@example.com", productName: "Social Media Kit", amount: 120, status: "delivered", daysAgo: 72 },
  { orderNumber: "WNC-0998", buyerEmail: "gabriel@example.com", sellerEmail: "hello@techstore.com", productName: "Bluetooth Speaker", amount: 64.99, status: "delivered", daysAgo: 85 },
  { orderNumber: "WNC-0991", buyerEmail: "gabriel@example.com", sellerEmail: "studio@brandify.com", productName: "Branding Consultation", amount: 180, status: "delivered", daysAgo: 99 },
  { orderNumber: "WNC-2044", buyerEmail: "kwame.b@example.com", sellerEmail: "hello@novamart.com", productName: "Ceramic Dinner Set", amount: 132.5, status: "processing", daysAgo: 2 },
  { orderNumber: "WNC-2037", buyerEmail: "kwame.b@example.com", sellerEmail: "zara@example.com", productName: "Animated Product Reel", amount: 320, status: "delivered", daysAgo: 16 },
  { orderNumber: "WNC-3022", buyerEmail: "nadia.p@example.com", sellerEmail: "jadeyemi@example.com", productName: "Leather Tote Bag", amount: 210, status: "delivered", conversationKey: "support-return-request", daysAgo: 14 },
  { orderNumber: "WNC-3014", buyerEmail: "nadia.p@example.com", sellerEmail: "info@greenleaf.com", productName: "Wellness Pantry Box", amount: 58.75, status: "pending", daysAgo: 1 }
];

async function upsertDemoUsers(passwordHash: string) {
  const userByEmail = new Map<string, Types.ObjectId>();

  for (const demoUser of demoUsers) {
    const user = await UserModel.findOneAndUpdate(
      { email: demoUser.email },
      {
        $set: {
          name: demoUser.name,
          email: demoUser.email,
          passwordHash,
          role: demoUser.role,
          bio: demoUser.bio,
          location: demoUser.location,
          ordersCompleted: demoUser.ordersCompleted ?? 0,
          conversationsCount: demoUser.conversationsCount ?? 0,
          banned: demoUser.banned ?? false,
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
      throw new Error(`Demo user seed failed for ${demoUser.email}`);
    }

    userByEmail.set(user.email, user._id);
  }

  return userByEmail;
}

function requireUserId(userByEmail: Map<string, Types.ObjectId>, email: string) {
  const userId = userByEmail.get(email);
  if (!userId) {
    throw new Error(`Demo user missing: ${email}`);
  }
  return userId;
}

async function upsertDemoConversations(userByEmail: Map<string, Types.ObjectId>) {
  const conversationByKey = new Map<string, Types.ObjectId>();

  for (const demoConversation of demoConversations) {
    const participantIds = demoConversation.participantEmails.map((email) =>
      requireUserId(userByEmail, email)
    );
    const assignedAgentId = demoConversation.assignedAgentEmail
      ? requireUserId(userByEmail, demoConversation.assignedAgentEmail)
      : undefined;
    const update = {
      $set: {
        type: demoConversation.type,
        status: demoConversation.status,
        ...(assignedAgentId ? { assignedAgentId } : {}),
        participantKey: `demo:${demoConversation.key}`,
        participants: participantIds.map((userId, index) => ({
          userId,
          readAt: index === 0 ? new Date() : undefined
        })),
        topic: demoConversation.topic,
        productContext: demoConversation.productContext
      },
      ...(!assignedAgentId ? { $unset: { assignedAgentId: "" } } : {})
    };

    const conversation = await ConversationModel.findOneAndUpdate(
      { participantKey: `demo:${demoConversation.key}` },
      update,
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true
      }
    );

    if (!conversation) {
      throw new Error(`Demo conversation seed failed for ${demoConversation.key}`);
    }

    conversationByKey.set(demoConversation.key, conversation._id);

    for (const [index, demoMessage] of demoConversation.messages.entries()) {
      await createConversationMessage(conversation, requireUserId(userByEmail, demoMessage.senderEmail).toString(), {
        body: demoMessage.body,
        clientMessageId: `demo-${demoConversation.key}-${index + 1}`
      });
    }
  }

  return conversationByKey;
}

async function upsertDemoOrders(
  userByEmail: Map<string, Types.ObjectId>,
  conversationByKey: Map<string, Types.ObjectId>
) {
  for (const demoOrder of demoOrders) {
    const buyerId = requireUserId(userByEmail, demoOrder.buyerEmail);
    const sellerId = requireUserId(userByEmail, demoOrder.sellerEmail);
    const seller = demoUsers.find((user) => user.email === demoOrder.sellerEmail);
    if (!seller || (seller.role !== "designer" && seller.role !== "merchant")) {
      throw new Error(`Demo order seller must be a designer or merchant: ${demoOrder.sellerEmail}`);
    }

    const conversationId = demoOrder.conversationKey
      ? conversationByKey.get(demoOrder.conversationKey)
      : undefined;

    await OrderModel.findOneAndUpdate(
      { orderNumber: demoOrder.orderNumber },
      {
        $set: {
          orderNumber: demoOrder.orderNumber,
          buyerId,
          sellerId,
          productName: demoOrder.productName,
          amount: demoOrder.amount,
          status: demoOrder.status,
          sellerRole: seller.role,
          placedAt: new Date(Date.now() - demoOrder.daysAgo * 86_400_000),
          ...(conversationId ? { conversationId } : {})
        },
        ...(!conversationId ? { $unset: { conversationId: "" } } : {})
      },
      {
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
        upsert: true
      }
    );
  }
}

async function seedDemo() {
  const input = seedDemoSchema.parse(process.env);
  const passwordHash = await bcrypt.hash(input.SEED_DEMO_PASSWORD, passwordHashRounds);
  const userByEmail = await upsertDemoUsers(passwordHash);
  const conversationByKey = await upsertDemoConversations(userByEmail);
  await upsertDemoOrders(userByEmail, conversationByKey);

  console.log(`Seeded ${demoUsers.length} demo users.`);
  console.log(`Seeded ${demoConversations.length} demo conversations.`);
  console.log(`Seeded ${demoOrders.length} demo orders.`);
  console.log("All demo accounts use SEED_DEMO_PASSWORD.");
}

try {
  await connectDatabase();
  await seedDemo();
} finally {
  await mongoose.disconnect();
}
