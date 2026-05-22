export const userRoles = ["admin", "agent", "customer", "designer", "merchant"] as const;

export type UserRole = (typeof userRoles)[number];

export const publicRegistrationRoles = ["customer", "designer", "merchant"] as const;

export type PublicRegistrationRole = (typeof publicRegistrationRoles)[number];
