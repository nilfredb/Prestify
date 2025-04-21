import { createContext, useContext, useEffect, useState } from "react";
import { AuthContextType, UserType } from "@/types";
import { onAuthStateChanged, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/config/firebase";
import { create } from "react-test-renderer";
import { firestore } from "@/config/firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { getDoc } from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import { useRouter } from "expo-router";
import { 
    EmailAuthProvider, 
    reauthenticateWithCredential, 
    verifyBeforeUpdateEmail 
  } from "firebase/auth";


const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserType>(null);
    const router = useRouter();

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, firebaseUser => {
            if (firebaseUser) {
                setUser({
                    uid: firebaseUser?.uid,
                    email: firebaseUser?.email,
                    name: firebaseUser?.displayName
                    
                });
                updateUserData(firebaseUser?.uid);
                router.replace('/(dashboard)');
            } else {
                setUser(null);
            }
        });

        return () => unsub();

    },[])

    const login = async (email: string, password: string) => {
        try{
            await signInWithEmailAndPassword(auth, email, password);
            return {success: true};
        }catch(error: any){
            let msg = error.message;
            console.log('error message', msg);
            if(msg.includes("(auth/invalid-credential)")) msg = "Invalid credentials";
            else if(msg.includes("(auth/user-not-found)")) msg = "User not found";
            //else if(msg.includes("(auth/wrong-password)")) msg = "Wrong password";
            else if(msg.includes("(auth/too-many-requests)")) msg = "Too many requests, please try again later";
            //else if(msg.includes("(auth/invalid-email)")) msg = "Invalid email address";
            else if(msg.includes("(auth/network-request-failed)")) msg = "Network error, please try again later";
            return {success: false, msg};
        }
    };
    const register = async (email: string, password: string, name: string) => {
        try{
            let response = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            await setDoc(doc(firestore, "users", response?.user?.uid), {
                name,
                email,
                uid: response?.user?.uid,
            });

            return {success: true};
        }   catch(error: any){
            let msg = error.message;
            console.log('error', error);
            if(msg.includes("(auth/email-already-in-use)")) msg = "Email already in use";
            else if(msg.includes("(auth/invalid-email)")) msg = "Invalid email address";

            return {success: false, msg};
        }
        
    };
    const updateEmailWithVerification = async (newEmail: string, currentPassword: string) => {
        try {
          const currentUser = auth.currentUser;
          if (!currentUser || !currentUser.email) throw new Error("User not found");
      
          const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
          await reauthenticateWithCredential(currentUser, credential);
      
          await verifyBeforeUpdateEmail(currentUser, newEmail);
      
          return {
            success: true,
            msg: "Verification email sent to " + newEmail,
          };
        } catch (error: any) {
          let msg = "Failed to update email";
          if (error.code === 'auth/wrong-password') {
            msg = "Current password is incorrect";
          } else if (error.code === 'auth/email-already-in-use') {
            msg = "Email is already in use";
          } else if (error.code === 'auth/invalid-email') {
            msg = "Invalid email format";
          } else if (error.code === 'auth/requires-recent-login') {
            msg = "Please log in again to perform this operation";
          } else if (error.code === 'auth/operation-not-allowed') {
            msg = "This operation is not allowed. Check your Firebase settings.";
          }
      
          return { success: false, msg };
        }
      };

    const updateUserData = async (uid: string) => {
        try{
            const docRef = doc(firestore, "users", uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const data = docSnap.data();
                const userData: UserType = {
                    uid: data.uid,
                    email: data.email || null,
                    name: data.name  || null,
                    image: data.image || null,
                };
                setUser({...userData });
            }
        }   catch(error: any){
            console.error("Email verification error", error);
            let msg = error.message;
            //return {success: false, msg};
            console.log('error', error);
        }
    };

    const contextValue: AuthContextType = {
        user,
        setUser,
        login,
        register,
        updateUserData,
        updateEmailWithVerification,
      };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );

};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;

};