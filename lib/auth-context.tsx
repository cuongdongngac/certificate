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
    // Kiểm tra session hiện tại
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    // Lắng nghe thay đổi trạng thái auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);

      if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
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
