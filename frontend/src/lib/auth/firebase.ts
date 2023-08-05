import { GithubAuthProvider, GoogleAuthProvider, getAuth } from "firebase/auth"
import { initializeApp } from "firebase/app"

const firebaseConfig = {
	apiKey: "AIzaSyDQVIz_bvOEOj_sQvDo9aZboyFVbsIApDU",
	authDomain: "the-conchess.firebaseapp.com",
	projectId: "the-conchess",
	storageBucket: "the-conchess.appspot.com",
	messagingSenderId: "155314807303",
	appId: "1:155314807303:web:c2bcb2957c73ca5faac0a2",
	measurementId: "G-MHKB0PW85V"
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth()

export const googleProvider = new GoogleAuthProvider()

googleProvider.addScope("https://www.googleapis.com/auth/userinfo.email")

export const githubProvider = new GithubAuthProvider()

githubProvider.addScope("user:email")
