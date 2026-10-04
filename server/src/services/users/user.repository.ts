import { prisma } from '../database/prisma.js';
import { User, UserSettings, Prisma } from '@prisma/client';

export interface CreateUserInput {
  username: string;
  email: string;
  passwordHash: string;
  displayName?: string;
  avatarUrl?: string;
  country?: string;
  bio?: string;
  settings?: Partial<Prisma.UserSettingsCreateWithoutUserInput>;
}

export class UserRepository {
  /**
   * Create a new user with default settings in a single transaction
   */
  async createUser(input: CreateUserInput): Promise<User> {
    const { settings, ...userData } = input;

    return prisma.user.create({
      data: {
        ...userData,
        settings: {
          create: settings || {},
        },
      },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Find user by unique ID (excluding passwordHash in public queries)
   */
  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Find user by username
   */
  async findUserByUsername(username: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { username },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
      include: {
        settings: true,
      },
    });
  }

  /**
   * Update user profile fields
   */
  async updateUser(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Update user preferences / settings
   */
  async updateUserSettings(
    userId: string,
    settings: Prisma.UserSettingsUpdateWithoutUserInput
  ): Promise<UserSettings> {
    return prisma.userSettings.upsert({
      where: { userId },
      update: settings,
      create: {
        userId,
        ...settings,
      } as Prisma.UserSettingsUncheckedCreateInput,
    });
  }

  /**
   * Delete user (cascades to settings, friendships, ratings)
   */
  async deleteUser(id: string): Promise<User> {
    return prisma.user.delete({
      where: { id },
    });
  }
}

export const userRepository = new UserRepository();
