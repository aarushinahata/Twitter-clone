import { createContext, useContext, useEffect, useState } from "react";
// import {
//     createUserWithEmailAndPassword,
//     signInWithEmailAndPassword,
//     onAuthStateChanged,
//     signOut,
//     GoogleAuthProvider,
//     signInWithPopup,
// } from "firebase/auth";
// import { auth } from "./firbase";

 const userAuthContext = createContext();

export function UserAuthContextProvider( props ) {
    const [user, setUser] = useState({
        // Temporary mock user for testing notifications
        email: "test@example.com",
        displayName: "Test User",
        photoURL: null
    });

    function logIn(email, password) {
        // Mock login for testing
        console.log("Mock login:", email, password);
        return Promise.resolve({ user: { email, displayName: "Test User" } });
    }
    
    function signUp(email, password) {
        // Mock signup for testing
        console.log("Mock signup:", email, password);
        return Promise.resolve({ user: { email, displayName: "Test User" } });
    }
    
    function logOut() {
        // Mock logout for testing
        console.log("Mock logout");
        return Promise.resolve();
    }
    
    function googleSignIn() {
        // Mock Google signin for testing
        console.log("Mock Google signin");
        return Promise.resolve({ user: { email: "test@example.com", displayName: "Test User" } });
    }

    // useEffect(() => {
    //     const unsubscribe = onAuthStateChanged(auth, (currentuser) => {
    //         console.log("Auth", currentuser);
    //         setUser(currentuser);
    //     });

    //     return () => {
    //         unsubscribe();
    //     };
    // }, []);

    return (
        <userAuthContext.Provider
            value={{ user, logIn, signUp, logOut, googleSignIn }}
        >
            {props.children}
        </userAuthContext.Provider>
    );
}

export function useUserAuth() {
    return useContext(userAuthContext);
}