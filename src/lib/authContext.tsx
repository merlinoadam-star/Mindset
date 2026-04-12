import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { Account, AccountRole } from "../types";

interface AuthContextValue {
  /** True when Supabase is set up (env vars present). */
  configured: boolean;
  /** Loading while the initial session resolves. */
  loading: boolean;
  session: Session | null;
  user: User | null;
  account: Account | null;
  signUp: (
    email: string,
    password: string,
    displayName: string,
    role: AccountRole
  ) => Promise<{ error?: string }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error?: string }>;
  refreshAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<Account | null>(null);

  const loadAccount = useCallback(async (u: User) => {
    if (!supabase) return;
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", u.id)
      .single();
    if (data) {
      setAccount({
        id: data.id,
        email: data.email,
        displayName: data.display_name,
        role: data.role,
        createdAt: data.created_at,
        avatarEmoji: data.avatar_emoji ?? undefined,
      });
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      return;
    }

    // Initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadAccount(data.session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        loadAccount(newSession.user);
      } else {
        setAccount(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadAccount]);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
      role: AccountRole
    ): Promise<{ error?: string }> => {
      if (!supabase) return { error: "Sign-up isn't available yet." };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName, role },
        },
      });
      if (error) return { error: error.message };
      // Create the accounts row
      if (data.user) {
        const { error: insertErr } = await supabase.from("accounts").insert({
          id: data.user.id,
          email,
          display_name: displayName,
          role,
        });
        if (insertErr && insertErr.code !== "23505") {
          // 23505 = unique violation (row may already exist from a trigger)
          return { error: insertErr.message };
        }
      }
      return {};
    },
    []
  );

  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error?: string }> => {
      if (!supabase) return { error: "Sign-in isn't available yet." };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: error.message };
      return {};
    },
    []
  );

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setAccount(null);
  }, []);

  const sendMagicLink = useCallback(
    async (email: string): Promise<{ error?: string }> => {
      if (!supabase) return { error: "Magic link isn't available yet." };
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) return { error: error.message };
      return {};
    },
    []
  );

  const refreshAccount = useCallback(async () => {
    if (user) await loadAccount(user);
  }, [user, loadAccount]);

  const value: AuthContextValue = {
    configured: isSupabaseConfigured,
    loading,
    session,
    user,
    account,
    signUp,
    signIn,
    signOut,
    sendMagicLink,
    refreshAccount,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
