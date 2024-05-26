import { Component } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-splash',
  templateUrl: './splash.page.html',
  styleUrls: ['./splash.page.scss'],
})
export class SplashPage {
  constructor(private navCtrl: NavController, private auth: AuthService) {
    setTimeout(() => {
      const audio = new Audio('../../assets/sounds/bing.mp3');
      audio.play();
    }, 3150);
    
    const redirRoute = auth.UserInSession ? '/home' : '/login';
    setTimeout(() => {
      navCtrl.navigateRoot([redirRoute]);
      history.pushState(null, '');
    }, 4650);
  }
}
