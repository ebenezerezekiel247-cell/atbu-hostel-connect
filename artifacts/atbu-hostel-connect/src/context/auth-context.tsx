import { createContext, useContext, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export interface UserProfile {
  id: string;
  name: string;
  email: string | null;
  regNumber: string;
  role: string;
  campus: string;
  hostel: string;
  roomNumber: string | null;
  roomUpdatedAt: string | null;
  onboardingComplete: boolean;
  avatarUrl: string | null;
  createdAt: string;
}

interface AuthContextValue {
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapProfile(raw: Record<string, unknown>): UserProfile {
  return {
    id: raw.id as string,
    name: raw.name as string,
    email: (raw.email as string | null) ?? null,
    regNumber: (raw.reg_number as string) ?? "",
    role: (raw.role as string) ?? "student",
    campus: (raw.campus as string) ?? "",
    hostel: (raw.hostel as string) ?? "",
    roomNumber: (raw.room_number as string | null) ?? null,
    roomUpdatedAt: (raw.room_updated_at as string | null) ?? null,
    onboardingComplete: (raw.onboarding_complete as boolean) ?? false,
    avatarUrl: (raw.avatar_url as string | null) ?? null,
    createdAt: (raw.created_at as string) ?? "",
  };
}

async function fetchProfileFromSupabase(
  userId: string
): Promise<UserProfile | null> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return mapProfile(data as Record<string, unknown>);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (sess: Session) => {
    const p = await fetchProfileFromSupabase(sess.user.id);
    setProfile(p);
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      setSession(sess);
      if (sess) await loadProfile(sess);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess) {
        await loadProfile(sess);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (session) await loadProfile(session);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, loading, refreshProfile, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
