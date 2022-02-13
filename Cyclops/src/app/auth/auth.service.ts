import { Injectable,NgZone } from '@angular/core';

import { User } from "../sharedData/user";
import firebase from 'firebase/compat/app';


import { AngularFireAuth } from "@angular/fire/compat/auth";
import { AngularFirestore, AngularFirestoreDocument } from '@angular/fire/compat/firestore';
import { Router } from "@angular/router";
import { AlertController, LoadingController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  userData: any; // Save logged in user data
  authentication:boolean;
  adminAuth:boolean;
  admin:boolean;
  Login:boolean;
  constructor(
    public afs: AngularFirestore,   // Inject Firestore service
    public afAuth: AngularFireAuth, // Inject Firebase auth service
    public router: Router,  
    public ngZone: NgZone, // NgZone service to remove outside scope warning
    public alertController: AlertController,
    public loadingController: LoadingController
  ) {  
    /* this.afAuth.authState.subscribe(user => {
      if (user) {
        console.log("Get user info from firebase ");
        
      } else {
        this.userData = null;
      }
    }) */

    this.afAuth.authState.subscribe(user => {
      if (user) {
        if(user.emailVerified){
          /* localStorage.setItem('user', JSON.stringify(user.emailVerified)); */
        }else{
          localStorage.setItem('user', null);
        }
        
      } else {
        localStorage.setItem('user', null);
      }
    })
    
    
  }


  //return true if has logged in
  isLogin(){
    /* console.log("login check ",localStorage.getItem('user')) */
    if(!JSON.parse(localStorage.getItem('user'))){
      return false;
    }else{
      return true;
    }
  }
  // Sign in with email/password
  async SignIn(email, password) {

    const loading = await this.loadingController.create({
      message: 'Please wait...',
    });
    loading.present();
    return this.afAuth.signInWithEmailAndPassword(email, password)
      .then((result) => {
        loading.dismiss();
        if(result.user.emailVerified) {
          this.userData = result.user;
          localStorage.setItem('user', JSON.stringify(this.userData)); 
          this.router.navigate(['tabs/page-space-er']);  
          this.isAdmin();  
          this.SetUserData(result.user);  
             
        } else {
          this.signInErrorAlert("Email is not verified");
          return false;
        }
      }).catch((error) => {
        loading.dismiss();
        this.userData = null;
        console.log("Login error: ",error);
        if(error == 'FirebaseError: Firebase: The password is invalid or the user does not have a password. (auth/wrong-password).'){
          this.signInErrorAlert('The email or password is invalid');
        }else{
          this.signInErrorAlert('Check your internet connection.');
        }
        
      })

      
      
  }

  async signInErrorAlert(message) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Invalid',
      subHeader: '',
      message: message,
      buttons: ['Retry']
    });
    await alert.present();
  }

  // Sign up with email/password
  SignUp(email, password) {
    return this.afAuth.createUserWithEmailAndPassword(email, password)
      .then((result) => {
        /* Call the SendVerificaitonMail() function when new user sign 
        up and returns promise */
        this.SendVerificationMail();
        /* this.SetUserData(result.user); */
      }).catch((error) => {
        window.alert(error.message)
      })
  }

  // Send email verfificaiton when new user sign up
  async SendVerificationMail() {
    return (await (this.afAuth.currentUser)).sendEmailVerification()
    .then(() => {
      console.log("send email")
       this.router.navigate(['verify-email']); 
    })
  }

  async reSendVerificationMail() {
    return (await (this.afAuth.currentUser)).sendEmailVerification()
    .then(() => {
      console.log("re-send email")
      
    })
  }

  // Reset Forggot password
  ForgotPassword(passwordResetEmail) {
    return this.afAuth.sendPasswordResetEmail(passwordResetEmail)
    .then(() => {
      this.resetPasswordAlert('Thank you',"A reset password email has been send to you");
    }).catch((error) => {
      console.log(error)
      this.resetPasswordAlert('Sorry',"Check your internet Connection");
    })
  }

  async resetPasswordAlert(title, message) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: title,
      subHeader: '',
      message: message,
      buttons: ['Ok']
    });
    await alert.present();
  }

  // Returns true when user is looged in and email is verified
  get isLoggedIn(): boolean {
    const user = JSON.parse(localStorage.getItem('user'));
    return (user !== null && user.emailVerified !== false) ? true : false;
  }

  // Sign in with Google
  GoogleAuth() {
     return this.AuthLogin(new firebase.auth.GoogleAuthProvider()); 
  }

  // Auth logic to run auth providers
  AuthLogin(provider) {
    return this.afAuth.signInWithPopup(provider)
    .then((result) => {
       this.ngZone.run(() => {
          this.userData = result.user;
          localStorage.setItem('user', JSON.stringify(this.userData)); 
          this.router.navigate(['tabs/page-space-er']);  
          this.isAdmin(); 
        })
      this.SetUserData(result.user);
    }).catch((error) => {
      window.alert(error)
    })
  }

  /* Setting up user data when sign in with username/password, 
  sign up with username/password and sign in with social auth  
  provider in Firestore database using AngularFirestore + AngularFirestoreDocument service */
  SetUserData(user) {
    const userRef: AngularFirestoreDocument<any> = this.afs.doc(`users/${user.uid}`);
    const userData: User = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified
    }
    return userRef.set(userData, {
      merge: true
    })
  }

  // Sign out 
  async SignOut() {

    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      message: 'Do you want to sign-out?',
      buttons: ['Cancel', 'Yes']
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role == "cancel") {
      console.log("cancel!");
    } else { // if user confirm to logout
      return this.afAuth.signOut().then(() => {
        /* localStorage.removeItem('user'); */
        this.userData = null;
        this.admin = false;
        localStorage.setItem('user', null);
        this.router.navigate(['tabs/page-space-er']); 
      })
    }

    
  }

  SignOutAlertMessage(){
    
  }
   

  isAdmin(){
    if(this.userData){ 
      this.afs.collection("adminUsers", ref => ref.where('email', '==', this.userData.email)).snapshotChanges().subscribe(res => {
        if (res.length > 0)
        {
        console.log("Match found.");
        this.admin=true;
        }
        else
        {
        /* this.notAdminAlert(); */
        console.log("Does not exist.");
        this.admin=false;
        }
    });
      /* console.log("isAdmin: ",admin); */
    }
    else{
      /* this.noLoginAlert(); */
      console.log("Have not logged in ");
    }
    
  }

  async notAdminAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Warring',
      subHeader: '',
      message: 'You are not administrator, you can not edit articles. Contact cyclops@gmail.com for more info',
      buttons: ['Ok']
    });
    await alert.present();
  }

  async noLoginAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Warring',
      subHeader: '',
      message: "Please Log in",
      buttons: ['Ok']
    });
    await alert.present();
  }
  
}
