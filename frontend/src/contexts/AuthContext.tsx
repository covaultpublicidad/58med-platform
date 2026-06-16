"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import axios from "@/lib/axios";

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  specialty?: string;
  medical_license?: string;
  college_number?: string;
  dni?: string;
  tenant_id?: number;
  is_profile_complete: boolean;
  appointment_duration?: number;
  buffer_time?: number;
  email_verified_at: string | null;
  created_at: string;
  tenant?: {
    name: string;
    address: string;
    subscription_plan?: string;
    logo_url?: string;
    stamp_url?: string;
    billing_enabled?: boolean;
  };
  patient_profile?: {
    blood_type?: string;
    gender?: string;
    height?: number;
    weight?: number;
    allergies?: string;
    preexisting_conditions?: string;
    address?: string;
    emergency_contact_name?: string;
    emergency_contact_relation?: string;
    emergency_contact_phone?: string;
  };
  bio?: string;
  profile_photo_url?: string;
  cover_photo_url?: string;
  signature_url?: string;
  roles?: { name: string }[];
  assigned_doctors?: any[];
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  checkUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isVerifyRoute = pathname.startsWith("/verify-email");
  const isPublicRoute = pathname === "/" || pathname.startsWith("/medico") || pathname.startsWith("/book");

  useEffect(() => {
    checkUser();
  }, [pathname]);

  const checkUser = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get("/api/user");
      const userData = response.data;
      setUser(userData);
      
      if (!userData.email_verified_at) {
        if (!isVerifyRoute && !isPublicRoute) router.push("/verify-email");
      } else if (!userData.is_profile_complete) {
        if (!isOnboardingRoute && !isPublicRoute) router.push("/onboarding");
      } else {
        if (isAuthRoute || isOnboardingRoute || isVerifyRoute) {
          const redirectUrl = searchParams.get("redirect");
          router.push(redirectUrl || "/dashboard");
        }
      }
    } catch (error) {
      setUser(null);
      if (!isAuthRoute && !isPublicRoute) {
        router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: any) => {
    await axios.get("/sanctum/csrf-cookie");
    await axios.post("/api/login", data);
    await checkUser();
  };

  const register = async (data: any) => {
    await axios.get("/sanctum/csrf-cookie");
    await axios.post("/api/register", data);
    await checkUser();
  };

  const logout = async () => {
    await axios.post("/api/logout");
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, checkUser }}>
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
