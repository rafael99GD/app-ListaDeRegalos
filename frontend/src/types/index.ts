export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  isVerified: boolean;
  createdAt?: string;
}

export type Visibility = 'PUBLIC' | 'PRIVATE';
export type ImageType = 'URL' | 'LOCAL' | 'NONE';

export interface Item {
  id: string;
  wishlistId: string;
  title: string;
  price: number | null;
  currency: string;
  url: string | null;
  imageType: ImageType;
  imageUrl: string | null;
  priority: number;
  isPurchased: boolean;
  status?: 'RESERVED' | 'AVAILABLE';
  purchasedBy: string | null;
  purchasedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WhitelistUser {
  id: string;
  wishlistId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
  };
}

export interface Wishlist {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  occasion: string | null;
  visibility: Visibility;
  shareSlug: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    username: string;
  };
  items: Item[];
  whitelistUsers?: WhitelistUser[];
  _count?: {
    items: number;
    savedByUsers?: number;
    whitelistUsers?: number;
  };
  isOwner?: boolean;
  isWhitelisted?: boolean;
  isSaved?: boolean;
}

export interface SteamWishlistItem {
  appId: number;
  title: string;
  price: number | null;
  currency: string;
  url: string;
  imageUrl: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  [key: string]: any;
}

// ==========================================
// Tipos para Sistema Social de Amigos (Feature 2/4)
// ==========================================
export type FriendshipStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface Friend {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  friendshipId: string;
  since: string;
  wishlistsCount: number;
}

export interface FriendRequest {
  id: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
    createdAt?: string;
  };
}

export interface FriendSearchResult {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string | null;
  status: 'FRIEND' | 'REQUEST_SENT' | 'REQUEST_RECEIVED' | 'NONE';
  requestId?: string;
}

// ==========================================
// Tipos para Amigo Invisible / Secret Santa (Feature 3/4)
// ==========================================
export type SecretSantaStatus = 'DRAFT' | 'DRAWN' | 'COMPLETED';

export interface SecretSantaMember {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  };
  hasAssignment?: boolean;
  assignedTo?: {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  } | null;
}

export interface SecretSantaGroupListItem {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  exchangeDate: string | null;
  status: SecretSantaStatus;
  creator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  };
  isCreator: boolean;
  membersCount: number;
  hasAssignment: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecretSantaAssignedWishlist {
  id: string;
  title: string;
  description: string | null;
  occasion: string | null;
  visibility: Visibility;
  shareSlug: string;
  _count?: {
    items: number;
  };
}

export interface SecretSantaGroupDetail {
  id: string;
  title: string;
  description: string | null;
  budget: number;
  exchangeDate: string | null;
  status: SecretSantaStatus;
  creator: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  };
  isCreator: boolean;
  members: SecretSantaMember[];
  myAssignedTo?: {
    id: string;
    username: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    avatarUrl?: string | null;
  } | null;
  myAssignedWishlists?: SecretSantaAssignedWishlist[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSecretSantaPayload {
  title: string;
  description?: string;
  budget?: number;
  exchangeDate?: string | null;
  memberIds: string[];
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  username: string;
  email?: string;
  currentPassword?: string;
  newPassword?: string;
}



