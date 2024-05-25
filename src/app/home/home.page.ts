import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces';
import { NavController } from '@ionic/angular';
import { MySwal, ToastError, ToastInfo } from '../utils';
import { AccelListenerEvent, Motion, OrientationListenerEvent } from '@capacitor/motion';
import { PluginListenerHandle } from '@capacitor/core';
import { Router } from '@angular/router';

declare interface FullUser extends User { pass: string };
enum Position { None = 'none', Laying = 'laying', Standing = 'standing' };
enum LayingTilt { None = 'none', Right = 'right', Left = 'left' };
// const THRESHOLD: number = 30;
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit {
  protected userInSession: User | null;
  activated: boolean = false;
  orientListener?: PluginListenerHandle;
  private userPass!: string;

  constructor(public auth: AuthService, protected navCtrl: NavController) {
    const navigation = inject(Router).getCurrentNavigation();
    const userPass: string = navigation?.extras?.state?.['userPass'];
    if (!userPass) {
      // auth.signOut();
      // this.navCtrl.navigateRoot(['/login']); //TODO: UNCOMMENT THIS
      ToastError.fire('Hubo un error.');
    } else this.userPass = userPass;

    this.userInSession = auth.UserInSession;
  }

  async ngOnInit() {
    // this.auth.userInSessionObs.subscribe((user) => this.userInSession = user);
    /* await MySwal.fire({
      title: 'Atención',
      html: 'Para un buen funcionamiento de la aplicación, <b>acueste el celular boca arriba</b>.',
      icon: 'warning',
      showConfirmButton: true,
      confirmButtonText: 'Aceptar',
    });
    this.startMotionListener(); TODO: UNCOMMENT THIS */
    console.log('△ Init');
  }

  async toggleAlarm() {
    const prevState = this.activated;
    if (!prevState) {
      if (!this.orientListener) {
        this.orientListener = await Motion.addListener('orientation', async (orient) => {
          await this.handleOrientEv(orient);
        });
      }
      this.activated = true;
    } else {
      await MySwal.fire({
        input: "password",
        inputPlaceholder: "Ingrese su contraseña...",
        inputAttributes: {
          "aria-label": "Ingrese su contraseña"
        },
        showCancelButton: true,
        preConfirm: (pass: string) => {
          /* if (pass !== this.userPass) {
            return MySwal.showValidationMessage('La contraseña es incorrecta.');
          } else return true; TODO: UNCOMMENT THIS*/
        }
      }).then(async (res) => {
        if (res.isConfirmed && res.value) {
          await this.orientListener?.remove();
          this.orientListener = undefined;
          this.activated = false;
        }
      })
    }
  }

  beta: number = 0;
  gamma: number = 0;
  prevPos: Position = Position.Laying;
  prevTilt: LayingTilt = LayingTilt.None;

  position: Position = Position.None;
  tilt: LayingTilt = LayingTilt.None;
  readonly threshold: number = 30;
  async handleOrientEv(event: OrientationListenerEvent) {
    //Beta: -10 ~ 10 = Laying / 80 ~ 100 = Standing
    //Gamma: 30 ~ 60 Right / -60 ~ -30 Left

    let currentPos: Position = this.prevPos;
    let currentTilt: LayingTilt = this.prevTilt;
    if (event.beta > -10 && event.beta < 10) {
      currentPos = Position.Laying;
      if (event.gamma > 30 && event.gamma < 60)
        currentTilt = LayingTilt.Right;
      else if (event.gamma > -60 && event.gamma < -30)
        currentTilt = LayingTilt.Left;
      else
        currentTilt = LayingTilt.None;
    } else if (event.beta > 80 && event.beta < 100) {
      currentPos = Position.Standing;
      currentTilt = LayingTilt.None;
    } else currentPos = Position.None;

    const betaChange = Math.abs(this.beta - event.beta);
    const gammaChange = Math.abs(this.gamma - event.gamma);
    console.log('△ Beta', event.beta, betaChange);
    console.log('△ Gamma', event.gamma, gammaChange);
    
    this.beta = event.beta;
    this.gamma = event.gamma;
    // if (betaChange > 30 || gammaChange > 30) {
      if (currentPos !== Position.None && (this.prevPos !== currentPos
        || (currentPos === Position.Laying && this.prevTilt !== currentTilt))) {
        let audioName: string | undefined;
        if (currentPos === Position.Laying) {
          switch (currentTilt) {
            case LayingTilt.Right:
              audioName = LayingTilt.Right //TODO: 'a dónde me llevás?' (borrar comment)
              break;
            case LayingTilt.Left:
              audioName = LayingTilt.Left //TODO: 'soltamee' (borrar comment)
              break;
            case LayingTilt.None:
              audioName = Position.Laying //TODO: 'qué tocás?' (borrar comment)
              //TODO: Vibrate
              break;
          }
        } else if (currentPos === Position.Standing) {
          audioName = Position.Standing //TODO: 'sáca la mano' (borrar comment)
          //TODO: Turn on torch
        }
        console.log('△', audioName);

        if (audioName)
          await new Audio(`../../assets/sounds/${audioName}.mp3`).play()
      }
    // }

    this.position = currentPos;
    this.tilt = currentTilt;
    this.prevPos = currentPos;
    this.prevTilt = currentTilt;
  }

  /*
  previousX: number = 0;
  previousY: number = 0;
  previousZ: number = 0;
   
  startMotionListener() {
    Motion.addListener('accel', (event) => {
      if (!this.activated) return;
  
      const { x, y, z } = event.accelerationIncludingGravity;
      let currentPosition: Position | undefined;
      // if (this.isFlat(x, y, z)) {
      if (this.isFlat(z)) {
        currentPosition = Position.Flat;
      // } else if (this.isStanding(x, y, z)) {
      } else if (this.isStanding(y)) {
        currentPosition = Position.Standing;
      // } else if (this.isSlidingLeft(x, y, z)) {
      } else if (this.isSlidingLeft(x)) {
        currentPosition = Position.Left;
      // } else if (this.isSlidingRight(x, y, z)) {
      } else if (this.isSlidingRight(x)) {
        currentPosition = Position.Right;
      }
  
      if (currentPosition && currentPosition !== this.lastPosition) {
        console.log(`△ Current Pos: ${this.parsePos(currentPosition)}`);
        new Audio(`../../assets/sounds/reaction-${currentPosition}.mp3`).play();
        this.lastPosition = currentPosition;
      }
      
      this.previousX = x;
      this.previousY = y;
      this.previousZ = z;
    });
  }
  
  parsePos = (pos: Position) => {
    switch (pos) {
      case Position.Flat:
        return 'Flat';
      case Position.Standing:
        return 'Standing';
      case Position.Right:
        return 'Right';
      default:
        return 'Left';
    }
  } */

  /* isFlat(x: number, y: number, z: number): boolean {
    return (z > 9 || z < -9) && Math.abs(x) < 1 && Math.abs(y) < 1;
  }
  
  isStanding(x: number, y: number, z: number): boolean {
    return (y > 9 || y < -9) && Math.abs(x) < 1 && Math.abs(z) < 1;
  }
  
  isLeft(x: number, y: number, z: number): boolean {
    return x < -3 && Math.abs(y) < 9 && Math.abs(z) < 9;
  }
  
  isRight(x: number, y: number, z: number): boolean {
    return x > 3 && Math.abs(y) < 9 && Math.abs(z) < 9;
  }
  */
  isFlat(z: number): boolean {
    return (z > 9 || z < -9);
  }

  isStanding(y: number): boolean {
    return (y > 9 || y < -9);
  }

  /*  isSlidingLeft(currentX: number): boolean {
     const deltaX = this.previousX - currentX;
     return deltaX > 2; // Adjust the threshold value as needed
   }
   
   isSlidingRight(currentX: number): boolean {
     const deltaX = currentX - this.previousX;
     return deltaX > 2; // Adjust the threshold value as needed
   } */

  signOut() {
    this.auth.signOut();
    ToastInfo.fire('Sesión cerrada.');
    this.navCtrl.navigateBack('/login');
  }
}
