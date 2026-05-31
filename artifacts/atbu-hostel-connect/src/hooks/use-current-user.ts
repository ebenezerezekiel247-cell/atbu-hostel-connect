import { useAuthContext, type UserProfile } from "@/context/auth-context";

export type { UserProfile };

export function useCurrentUser(): UserProfile {
  const { profile } = useAuthContext();
  if (!profile) {
    throw new Error(
      "useCurrentUser called outside of an authenticated context"
    );
  }
  return profile;
}
