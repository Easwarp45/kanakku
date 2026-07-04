import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import {
  clearAuthFailures,
  getRemainingLockoutMs,
  isAuthLockedOut,
  registerAuthFailure,
} from "@/lib/authRateLimit";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const isMountedRef = useRef(true);

  const ensureProfile = async (nextUser: User | null) => {
    if (!nextUser) return;

    const displayName =
      (nextUser.user_metadata?.display_name as string | undefined) ||
      nextUser.email?.split("@")[0] ||
      "User";

    const { error } = await supabase
      .from("profiles")
      .upsert(
        {
          user_id: nextUser.id,
          display_name: displayName,
          currency: "INR",
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.error("Failed to ensure user profile:", error);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;

    // CQ-3: First get the initial session, THEN set loading=false.
    // This prevents a flash of the login page for already-authenticated users.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMountedRef.current) return;
      setSession(session);
      setUser(session?.user ?? null);
      void ensureProfile(session?.user ?? null);
      setLoading(false);
    });

    // Listen for future auth state changes (sign in, sign out, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMountedRef.current) return;
      setSession(session);
      setUser(session?.user ?? null);
      void ensureProfile(session?.user ?? null);
      // Do NOT set loading=false here — loading is only controlled by getSession above.
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName || email.split("@")[0],
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();

    // NOTE: This is a UX-level client-side rate limit only.
    // Real security rate limiting is enforced server-side by Supabase GoTrue.
    // A determined attacker can bypass this by clearing localStorage — that is acceptable.
    if (isAuthLockedOut(normalizedEmail)) {
      const remainingMs = getRemainingLockoutMs(normalizedEmail);
      const remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));

      return {
        error: new Error(`Too many failed login attempts. Try again in ${remainingMinutes} minute(s).`),
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      registerAuthFailure(normalizedEmail);
      return { error };
    }

    clearAuthFailures(normalizedEmail);
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}