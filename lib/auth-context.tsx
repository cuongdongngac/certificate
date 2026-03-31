"use client";

import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  profile: { role: string } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{ role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Kiểm tra biến môi trường
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)
    ) {
      console.error(
        "Thiếu biến môi trường Supabase! Hãy kiểm tra file .env hoặc cấu hình trên Vercel.",
      );
    }

    // Kiểm tra session hiện tại
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch (error) {
        console.error("Lỗi khởi tạo Auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Lắng nghe thay đổi trạng thái auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) {
        // Nếu không tìm thấy profile, có thể do RLS hoặc record chưa được tạo
        console.error("Lỗi fetchProfile:", error);
        setProfile(null);
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("Lỗi fetchProfile:", err);
      setProfile(null);
    }
  };

  const signOut = async () => {
    try {
      console.log("Đang đăng xuất...");
      setLoading(true);

      // Xóa trạng thái cục bộ ngay lập tức để UI cập nhật ngay
      setUser(null);
      setProfile(null);

      // Không dùng await cho signOut nếu nó quá chậm, hoặc đặt timeout
      supabase.auth.signOut().then(({ error }) => {
        if (error) console.error("Lỗi khi gọi signOut API:", error);
        console.log("Đã gọi signOut API xong");
      });

      // Redirect ngay lập tức nếu cần thiết hoặc để Navbar xử lý
    } catch (error) {
      console.error("Lỗi trong hàm signOut:", error);
    } finally {
      setLoading(false);
    }
  };

  const contextValue = useMemo(
    () => ({
      user,
      profile,
      loading,
      signOut,
    }),
    [user, profile, loading],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
