import { APP_NAME } from "@/lib/constants/colors";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public errors?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!response.ok || !data.success) {
    throw new ApiError(
      data.message ?? "An unexpected error occurred",
      response.status,
      data.errors
    );
  }

  return data;
}

export interface PaginatedApiResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function apiClientPaginated<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<{ items: T[]; pagination: NonNullable<PaginatedApiResponse<T>["pagination"]> }> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data: PaginatedApiResponse<T> = await response.json();

  if (!response.ok || !data.success || !data.pagination) {
    throw new ApiError(
      data.message ?? "An unexpected error occurred",
      response.status,
      data.errors
    );
  }

  return { items: data.data ?? [], pagination: data.pagination };
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const data = await apiClient("/api/health");
    return data.success === true;
  } catch {
    return false;
  }
}

export { APP_NAME };
