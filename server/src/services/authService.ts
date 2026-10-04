import { prisma } from './database/prisma.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAuthToken } from '../utils/token.js';
import { RegisterInput, LoginInput, ChangePasswordInput } from '../validators/authValidator.js';
import { RatingCategory } from '@prisma/client';

export interface SafeUser {
  id: string;
  username: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  country: string | null;
  bio: string | null;
  createdAt: Date;
  settings?: {
    theme: string;
    boardTheme: string;
    pieceSet: string;
    soundEnabled: boolean;
    animationEnabled: boolean;
    showLegalMoves: boolean;
    showCoordinates: boolean;
    highlightLastMove: boolean;
    confirmMoves: boolean;
    autoQueen: boolean;
    animationSpeed: string;
  } | null;
  ratings?: {
    category: RatingCategory;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    draws: number;
  }[];
}

export class AuthService {
  /**
   * Safe user projection excluding sensitive fields
   */
  public toSafeUser(user: {
    id: string;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    country: string | null;
    bio: string | null;
    createdAt: Date;
    settings?: any;
    ratings?: any[];
  }): SafeUser {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      country: user.country,
      bio: user.bio,
      createdAt: user.createdAt,
      settings: user.settings
        ? {
            theme: user.settings.theme,
            boardTheme: user.settings.boardTheme,
            pieceSet: user.settings.pieceSet,
            soundEnabled: user.settings.soundEnabled,
            animationEnabled: user.settings.animationEnabled,
            showLegalMoves: user.settings.showLegalMoves,
            showCoordinates: user.settings.showCoordinates,
            highlightLastMove: user.settings.highlightLastMove,
            confirmMoves: user.settings.confirmMoves,
            autoQueen: user.settings.autoQueen,
            animationSpeed: user.settings.animationSpeed,
          }
        : null,
      ratings: user.ratings
        ? user.ratings.map((r) => ({
            category: r.category,
            rating: r.rating,
            gamesPlayed: r.gamesPlayed,
            wins: r.wins,
            losses: r.losses,
            draws: r.draws,
          }))
        : undefined,
    };
  }

  /**
   * Register a new user with atomic settings and default rating creation
   */
  async register(input: RegisterInput): Promise<{ user: SafeUser; token: string }> {
    const cleanUsername = input.username.trim();
    const cleanEmail = input.email.trim().toLowerCase();

    // Check duplicate username (case-insensitive query)
    const existingUserByUsername = await prisma.user.findFirst({
      where: {
        username: {
          equals: cleanUsername,
          mode: 'insensitive',
        },
      },
    });

    if (existingUserByUsername) {
      const error: any = new Error('Username is already taken');
      error.statusCode = 409;
      error.code = 'USERNAME_TAKEN';
      throw error;
    }

    // Check duplicate email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUserByEmail) {
      const error: any = new Error('Email is already registered');
      error.statusCode = 409;
      error.code = 'EMAIL_TAKEN';
      throw error;
    }

    // Hash password
    const passwordHash = await hashPassword(input.password);

    // Atomically create User + UserSettings + 4 default Rating categories
    const createdUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          username: cleanUsername,
          email: cleanEmail,
          passwordHash,
          settings: {
            create: {
              theme: 'dark',
              boardTheme: 'classic',
              pieceSet: 'classic',
              soundEnabled: true,
              animationEnabled: true,
              showLegalMoves: true,
              showCoordinates: true,
              highlightLastMove: true,
              confirmMoves: false,
              autoQueen: false,
              animationSpeed: 'normal',
            },
          },
        },
        include: {
          settings: true,
        },
      });

      // Create default ratings for standard categories
      const ratingCategories: RatingCategory[] = [
        RatingCategory.BULLET,
        RatingCategory.BLITZ,
        RatingCategory.RAPID,
        RatingCategory.CLASSICAL,
      ];

      await tx.rating.createMany({
        data: ratingCategories.map((category) => ({
          userId: user.id,
          category,
          rating: 1500,
          gamesPlayed: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        })),
      });

      const ratings = await tx.rating.findMany({
        where: { userId: user.id },
      });

      return {
        ...user,
        ratings,
      };
    });

    const token = signAuthToken({
      userId: createdUser.id,
      username: createdUser.username,
      email: createdUser.email,
    });

    return {
      user: this.toSafeUser(createdUser),
      token,
    };
  }

  /**
   * Authenticate user with username OR email
   */
  async login(input: LoginInput): Promise<{ user: SafeUser; token: string }> {
    const cleanIdentifier = input.identifier.trim();
    const isEmail = cleanIdentifier.includes('@');

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: cleanIdentifier.toLowerCase() }
        : {
            username: {
              equals: cleanIdentifier,
              mode: 'insensitive',
            },
          },
      include: {
        settings: true,
        ratings: true,
      },
    });

    if (!user) {
      const error: any = new Error('Invalid username/email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    if (!user.isActive) {
      const error: any = new Error('This account has been deactivated');
      error.statusCode = 403;
      error.code = 'ACCOUNT_DEACTIVATED';
      throw error;
    }

    const isValidPassword = await verifyPassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      const error: any = new Error('Invalid username/email or password');
      error.statusCode = 401;
      error.code = 'INVALID_CREDENTIALS';
      throw error;
    }

    // Update lastSeenAt
    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeenAt: new Date() },
    });

    const token = signAuthToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      user: this.toSafeUser(user),
      token,
    };
  }

  /**
   * Get safe user details by ID
   */
  async getSafeUserById(userId: string): Promise<SafeUser | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        settings: true,
        ratings: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return this.toSafeUser(user);
  }

  /**
   * Change user password securely
   */
  async changePassword(userId: string, input: ChangePasswordInput): Promise<{ token: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      error.code = 'USER_NOT_FOUND';
      throw error;
    }

    const isCurrentValid = await verifyPassword(input.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      const error: any = new Error('Current password is incorrect');
      error.statusCode = 400;
      error.code = 'CURRENT_PASSWORD_INCORRECT';
      throw error;
    }

    const newPasswordHash = await hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    const token = signAuthToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return { token };
  }
}

export const authService = new AuthService();
