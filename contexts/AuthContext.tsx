import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const USER_STORAGE_KEY = '@votum_user';

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load user from AsyncStorage on mount
        const loadStoredUser = async () => {
            try {
                const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Error loading stored user:', error);
            }
        };

        loadStoredUser();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            console.log('Auth state changed:', firebaseUser ? 'User logged in' : 'User logged out');
            if (firebaseUser) {
                // Fetch user data from Firestore
                const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
                if (userDoc.exists()) {
                    const userData = { uid: firebaseUser.uid, ...userDoc.data() } as User;
                    setUser(userData);
                    // Store user in AsyncStorage
                    await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
                }
            } else {
                setUser(null);
                // Clear user from AsyncStorage
                await AsyncStorage.removeItem(USER_STORAGE_KEY);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string, name: string, role: UserRole) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const userData: Omit<User, 'uid'> = {
            email,
            name,
            role,
            createdAt: new Date(),
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
    };

    const logout = async () => {
        try {
            console.log('Starting logout process...');
            await signOut(auth);
            console.log('Firebase signOut completed');
            await AsyncStorage.removeItem(USER_STORAGE_KEY);
            console.log('AsyncStorage cleared');
            setUser(null);
            console.log('User state cleared - logout complete');
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    };

    const refreshUser = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = { uid: user.uid, ...userDoc.data() } as User;
                setUser(userData);
                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
            }
        } catch (error) {
            console.error('Error refreshing user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};
