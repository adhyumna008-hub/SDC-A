import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  getRedirectResult, 
  signOut as firebaseSignOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured, ADMIN_WHITELIST, INTERNAL_COLLEGE_DOMAIN } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  role: UserRole;
  isDemoMode: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, college?: string, roll?: string) => Promise<{ isNewUser: boolean; emailVerified: boolean }>;
  resendVerificationEmail: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  signOutUser: () => Promise<void>;
  setDemoRole: (role: UserRole) => void;
  updateProfileDetails: (collegeName: string, rollNumber: string) => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const isDummyRoll = (val?: string): boolean => {
  if (!val) return true;
  const clean = val.trim().toLowerCase();
  if (clean === '' || clean === 'undefined' || clean === 'null') return true;
  if (/^(reg|adm|demo|usr|test|student)([-_]|$)/i.test(clean)) return true;
  if (/2026-000/i.test(clean)) return true;
  if (/^demo/i.test(clean)) return true;
  return false;
};

// Preset demo profiles for optional testing
export const DEMO_PROFILES: Record<UserRole, UserProfile> = {
  admin: {
    uid: 'usr-admin-01',
    email: 'adhyumna008@gmail.com',
    displayName: 'Adhyumna Chowdary (Admin)',
    photoURL: '/default-avatar.svg',
    role: 'admin',
    collegeName: 'Vardhaman College of Engineering',
    rollNumber: '',
    qrToken: 'SDC_TICKET:usr-admin-01',
    emailVerified: true
  },
  member: {
    uid: 'usr-member-1',
    email: 'alex.dev@vardhaman.org',
    displayName: 'Alex Rivers',
    photoURL: '/default-avatar.svg',
    role: 'member',
    collegeName: 'Vardhaman College of Engineering',
    rollNumber: '',
    qrToken: 'SDC_TICKET:usr-member-1',
    emailVerified: true
  },
  guest: {
    uid: 'usr-guest-1',
    email: 'johndoe@gmail.com',
    displayName: 'John Doe (Guest)',
    photoURL: '/default-avatar.svg',
    role: 'guest',
    collegeName: 'IIT Hyderabad',
    rollNumber: '',
    qrToken: 'SDC_TICKET:usr-guest-1',
    emailVerified: true
  }
};

export const determineRoleFromEmail = (email: string): UserRole => {
  if (!email) return 'guest';
  const cleanEmail = email.toLowerCase().trim();
  if (ADMIN_WHITELIST.includes(cleanEmail)) return 'admin';
  if (
    cleanEmail.endsWith(`@${INTERNAL_COLLEGE_DOMAIN}`) ||
    cleanEmail.endsWith(`@student.${INTERNAL_COLLEGE_DOMAIN}`) ||
    cleanEmail.endsWith(`.${INTERNAL_COLLEGE_DOMAIN}`)
  ) {
    return 'member';
  }
  return 'guest';
};

const mapFirebaseUser = (fbUser: FirebaseUser, extra?: { collegeName?: string; rollNumber?: string }): UserProfile => {
  const email = fbUser.email || '';
  const role = determineRoleFromEmail(email);
  const cleanRoll = extra?.rollNumber && !isDummyRoll(extra.rollNumber) ? extra.rollNumber.trim().toUpperCase() : '';
  return {
    uid: fbUser.uid,
    email,
    displayName: fbUser.displayName || email.split('@')[0] || 'SDC Member',
    photoURL: fbUser.photoURL || undefined,
    role,
    collegeName: extra?.collegeName || (role === 'member' || role === 'admin' ? 'Vardhaman College of Engineering' : 'External College'),
    rollNumber: cleanRoll,
    qrToken: `SDC_TICKET:${fbUser.uid}`,
    emailVerified: fbUser.emailVerified
  };
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  useEffect(() => {
    if (isFirebaseConfigured) {
      // 1. Process redirect result if returning from accounts.google.com
      getRedirectResult(auth)
        .then((result) => {
          if (result && result.user) {
            console.log('Redirect sign in success for:', result.user.email);
            setUser(mapFirebaseUser(result.user));
            setIsDemoMode(false);
          }
        })
        .catch((err) => {
          console.warn('Redirect result error or standard load:', err);
        });

      // 2. Process email verification action code if user clicked the link in their email
      const urlParams = new URLSearchParams(window.location.search);
      const mode = urlParams.get('mode');
      const actionCode = urlParams.get('oobCode');

      if (mode === 'verifyEmail' && actionCode) {
        import('firebase/auth').then(({ applyActionCode }) => {
          applyActionCode(auth, actionCode)
            .then(async () => {
              console.log('Email verified successfully via email link action code!');
              if (auth.currentUser) {
                await auth.currentUser.reload();
                setUser(mapFirebaseUser(auth.currentUser));
              }
              // Clean URL query parameters smoothly without reloading
              window.history.replaceState({}, document.title, window.location.pathname);
            })
            .catch((err) => {
              console.warn('Action code verification error:', err);
            });
        });
      }

      // 3. Listen to active auth state
      const unsubscribe = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
        if (fbUser) {
          setUser(mapFirebaseUser(fbUser));
          setIsDemoMode(false);
        } else {
          setUser(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async () => {
    if (isFirebaseConfigured) {
      try {
        // Try popup first; if popup is blocked by browser/Brave, seamlessly use redirect!
        const res = await signInWithPopup(auth, googleProvider);
        if (res.user) {
          setUser(mapFirebaseUser(res.user));
        }
      } catch (err: any) {
        console.warn('Popup blocked/failed, switching to Google redirect:', err);
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error('Redirect sign in error', redirectErr);
          throw redirectErr;
        }
      }
    } else {
      alert('Firebase API keys not configured. Enabling Demo Admin Mode for testing.');
      setUser(DEMO_PROFILES.admin);
      setIsDemoMode(true);
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const cleanEmail = email.trim();
    if (isFirebaseConfigured) {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, pass);
      if (res.user) {
        setUser(mapFirebaseUser(res.user));
      }
    } else {
      const role = determineRoleFromEmail(cleanEmail);
      setUser({
        uid: `demo-${Date.now()}`,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        role,
        collegeName: role === 'member' || role === 'admin' ? 'Vardhaman College of Engineering' : 'External College',
        rollNumber: '',
        qrToken: `SDC_TICKET:demo`
      });
      setIsDemoMode(true);
    }
  };

  const signUpWithEmail = async (
    email: string, 
    pass: string, 
    name: string, 
    college?: string, 
    roll?: string
  ): Promise<{ isNewUser: boolean; emailVerified: boolean }> => {
    const cleanEmail = email.trim();
    const cleanName = (name || cleanEmail.split('@')[0]).trim();
    const cleanRoll = roll && !isDummyRoll(roll) ? roll.trim().toUpperCase() : '';
    if (isFirebaseConfigured) {
      try {
        const res = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
        if (res.user) {
          // Asynchronously update displayName without blocking UI transition
          updateProfile(res.user, { displayName: cleanName }).catch((profileErr) => {
            console.warn('Profile update warning:', profileErr);
          });

          // Dispatch verification email in background; never block user UI transition
          const sendVerification = async (u: FirebaseUser) => {
            try {
              // Standard call works robustly across all domains & environments
              await sendEmailVerification(u);
              console.log('Standard email verification dispatched to:', cleanEmail);
            } catch (verifErr: any) {
              console.warn('Standard verification send note, attempting with origin:', verifErr?.message);
              try {
                await sendEmailVerification(u, {
                  url: window.location.origin,
                  handleCodeInApp: false
                });
                console.log('Email verification with origin dispatched to:', cleanEmail);
              } catch (secondErr: any) {
                console.warn('Could not dispatch verification email:', secondErr?.message);
              }
            }
          };

          sendVerification(res.user);
          setUser(mapFirebaseUser(res.user, { collegeName: college, rollNumber: cleanRoll }));
          return { isNewUser: true, emailVerified: false };
        }
        return { isNewUser: true, emailVerified: false };
      } catch (err: any) {
        // If email already exists, gracefully attempt direct sign-in with the provided password!
        if (err.code === 'auth/email-already-in-use') {
          console.log('Account already exists. Attempting direct sign-in...');
          try {
            const signRes = await signInWithEmailAndPassword(auth, cleanEmail, pass);
            if (signRes.user) {
              setUser(mapFirebaseUser(signRes.user, { collegeName: college, rollNumber: cleanRoll }));
              if (!signRes.user.emailVerified) {
                sendEmailVerification(signRes.user).catch((e) => {
                  console.warn('Background verification dispatch note:', e?.message);
                });
              }
              return { isNewUser: false, emailVerified: signRes.user.emailVerified };
            }
          } catch (signInErr: any) {
            const customErr: any = new Error('This email is already registered. Please switch to Sign In or enter the correct password.');
            customErr.code = 'auth/email-already-in-use';
            throw customErr;
          }
        }
        throw err;
      }
    } else {
      const role = determineRoleFromEmail(cleanEmail);
      setUser({
        uid: `demo-${Date.now()}`,
        email: cleanEmail,
        displayName: cleanName,
        role,
        collegeName: college || (role === 'member' || role === 'admin' ? 'Vardhaman College of Engineering' : 'External College'),
        rollNumber: cleanRoll,
        qrToken: `SDC_TICKET:demo`,
        emailVerified: true
      });
      setIsDemoMode(true);
      return { isNewUser: true, emailVerified: true };
    }
  };

  const resendVerificationEmail = async () => {
    if (isFirebaseConfigured && auth.currentUser) {
      const u = auth.currentUser;
      const sendPromise = (async () => {
        try {
          await sendEmailVerification(u);
        } catch (e) {
          await sendEmailVerification(u, {
            url: window.location.origin,
            handleCodeInApp: false
          });
        }
      })();

      // Cap wait time to 3 seconds max so UI never freezes
      await Promise.race([
        sendPromise,
        new Promise((resolve) => setTimeout(resolve, 3000))
      ]);
      console.log('Verification link re-sent request initiated for:', auth.currentUser.email);
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    if (isFirebaseConfigured && auth.currentUser) {
      try {
        await Promise.race([
          auth.currentUser.reload(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Reload timeout')), 4000))
        ]);
        const verified = auth.currentUser.emailVerified;
        if (verified && user) {
          setUser({ ...user, emailVerified: true });
        }
        return verified;
      } catch (err) {
        console.warn('Reload check error:', err);
        return auth.currentUser.emailVerified;
      }
    }
    return true;
  };

  const signOutUser = async () => {
    if (isFirebaseConfigured && auth.currentUser) {
      await firebaseSignOut(auth);
    }
    setUser(null);
    setIsDemoMode(false);
  };

  const setDemoRole = (targetRole: UserRole) => {
    setUser(DEMO_PROFILES[targetRole]);
    setIsDemoMode(true);
  };

  const updateProfileDetails = (collegeName: string, rollNumber: string) => {
    if (user) {
      setUser({ ...user, collegeName, rollNumber });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        role: user?.role || 'guest',
        isDemoMode,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resendVerificationEmail,
        checkEmailVerification,
        signOutUser,
        setDemoRole,
        updateProfileDetails
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
