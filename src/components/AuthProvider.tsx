'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { IUser } from '@/models/User';
import { usePathname, useRouter } from 'next/navigation';

interface AuthContextType {
    user: FirebaseUser | null;
    profile: IUser | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchProfile = async (uid: string) => {
        try {
            const res = await fetch(`/api/users/${uid}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data.user);
            } else {
                if (res.status === 404) {
                    setProfile(null);
                } else {
                    console.error('Failed to fetch user profile', res.statusText);
                    setProfile(null);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchProfile(firebaseUser.uid);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Protect routes & Enforce guidelines
    useEffect(() => {
        if (loading) return;

        const publicRoutes = ['/', '/login', '/signup'];
        const isPublic = publicRoutes.includes(pathname);

        if (!user) {
            // Not logged in: Redirect to login if trying to access protected route
            if (!isPublic) {
                router.replace('/login');
            }
        } else {
            // Logged in
            if (!loading) {
                // If user is logged in but profile is missing (and not loading), it's an error state or sync issue.
                // Redirect to login to attempt re-sync, unless already there.
                if (!profile) {
                    if (pathname !== '/login') router.replace('/login');
                } 
                // Enforce guidelines: Must be accepted to access ANY page (except login)
                else if (!profile.acceptedGuidelines && pathname !== '/login') {
                    router.replace('/login');
                }
            }
        }
    }, [loading, user, profile, pathname, router]);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
