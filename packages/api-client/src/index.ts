/**
 * Pre-configured openapi-fetch client factory for Project ATLAS API.
 *
 * @example
 * ```tsx
 * import { createApiClient } from "@atlas/api-client";
 *
 * const client = createApiClient({
 *   getToken: async () => await getToken(),
 * });
 *
 * const { data, error } = await client.GET("/api/admin/rooms");
 * ```
 */

import type { paths } from "@atlas/api-types";
import createClient from "openapi-fetch";

type OpenApiFetchClient = ReturnType<typeof createClient>;
type UseParam0 = Parameters<OpenApiFetchClient["use"]>[0];
export type Middleware = UseParam0 extends readonly (infer M)[] ? M : UseParam0;

export interface ApiClientOptions {
  /**
   * Function to retrieve the authentication token.
   * Typically from Clerk's useAuth().getToken()
   */
  getToken: () => Promise<string | null>;

  /**
   * Base URL for the API. Defaults to empty string (uses relative URLs).
   * When using Next.js rewrites, leave this empty.
   */
  baseUrl?: string;

  /**
   * Additional middleware to apply to requests.
   */
  middleware?: Middleware[];
}

/**
 * Creates a type-safe API client for the Project ATLAS backend.
 *
 * @param options - Configuration options for the client
 * @returns A fully typed openapi-fetch client
 *
 * @example
 * ```tsx
 * "use client";
 * import { useAuth } from "@clerk/nextjs";
 * import { createApiClient } from "@atlas/api-client";
 *
 * function MyComponent() {
 *   const { getToken } = useAuth();
 *   const client = createApiClient({ getToken });
 *
 *   // Fully typed!
 *   const { data, error } = await client.GET("/api/admin/rooms/{id}", {
 *     params: { path: { id: "123" } }
 *   });
 * }
 * ```
 */
export function createApiClient(options: ApiClientOptions) {
  const { getToken, baseUrl = "", middleware = [] } = options;

  const client = createClient<paths>({
    baseUrl,
  });

  const authMiddleware: Middleware = {
    async onRequest({ request }) {
      const token = await getToken();

      if (!token) {
        throw new Error("No authentication token available. User may not be logged in.");
      }

      request.headers.set("Authorization", `Bearer ${token}`);
      return request;
    },
  };

  client.use(authMiddleware);
  for (const mw of middleware) {
    client.use(mw);
  }

  return client;
}

/**
 * Creates an API client without authentication.
 * Use for public endpoints only.
 */
export function createPublicApiClient(baseUrl = "") {
  return createClient<paths>({ baseUrl });
}
