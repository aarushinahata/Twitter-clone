
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAaAj4JfMzE6OlxX_wTNlpIaMoQEbCQ1eY",
  authDomain: "twiller-twitterclone-3d905.firebaseapp.com",
  projectId: "twiller-twitterclone-3d905",
  storageBucket: "twiller-twitterclone-3d905.firebasestorage.app",
  messagingSenderId: "47265740546",
  appId: "1:47265740546:web:b476b1e4a8abf76f72b41b",
  measurementId: "G-R5EL4JBKP5"
};

const app = initializeApp(firebaseConfig);
export const auth=getAuth(app)
export default app
// const analytics = getAnalytics(app);
