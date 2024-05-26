import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { User } from '../interfaces';
import { NavController } from '@ionic/angular';
import { MySwal, ToastError, ToastInfo, ToastSuccess } from '../utils';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DeviceMotionAccelerationData } from '@awesome-cordova-plugins/device-motion/ngx';
import { DeviceMotion } from '@awesome-cordova-plugins/device-motion';
import { CapacitorFlash } from '@capgo/capacitor-flash';
import { Haptics } from '@capacitor/haptics';

declare type Position = undefined | 'laying' | 'standing' | 'right' | 'left';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit, OnDestroy {
  protected userInSession: User | null;
  private userPass!: string;
  isActivated: boolean = false;
  motionSub?: Subscription;
  isAudioPlaying: boolean = false;
  isSettingDevice: boolean = true;

  constructor(public auth: AuthService, protected navCtrl: NavController, private deviceMotion: DeviceMotion) {
    const navigation = inject(Router).getCurrentNavigation();
    const userPass: string = navigation?.extras?.state?.['userPass'];

    if (!userPass) this.signOut();
    else this.userPass = userPass;

    this.userInSession = auth.UserInSession;
  }

  async ngOnInit() {
    await MySwal.fire({
      title: 'Atención',
      html: 'Para un buen funcionamiento de la aplicación, <b>acueste el celular boca arriba</b>.',
      icon: 'warning',
      showConfirmButton: true,
      confirmButtonText: 'Aceptar',
    });
    console.log('△ Init');
  }

  async toggleAlarm() {
    const prevState = this.isActivated;
    if (!prevState) {
      this.isActivated = true;
      this.isSettingDevice = true;
      setTimeout(() => {
        this.isSettingDevice = false;
      }, 1500);
      console.log('△ Activated');
      ToastSuccess.fire('Alarma activada');
      this.listenMotion();
    } else {
      await MySwal.fire({
        input: 'password',
        inputPlaceholder: 'Ingrese su contraseña...',
        inputAttributes: {
          'aria-label': 'Ingrese su contraseña'
        },
        showCancelButton: true,
        preConfirm: async (pass: string) => {
          if (this.isAudioPlaying) return null;
          if (pass === this.userPass) return true;

          MySwal.showValidationMessage('La contraseña es incorrecta.');
          this.isAudioPlaying = true;
          Haptics.vibrate({ duration: 5100 });
          CapacitorFlash.switchOn({ intensity: 100 });
          const audio = new Audio('../../assets/sounds/police-siren.mp3');
          audio.play();

          await this.delay(5100);
          audio.pause();
          CapacitorFlash.switchOff();
          this.isAudioPlaying = false;
          return false;
        }
      }).then(async (res) => {
        if (res.isConfirmed && res.value) {
          this.motionSub?.unsubscribe();
          this.isActivated = false;
          console.log('△ Deactivated');
          ToastSuccess.fire('Alarma desactivada');
        }
      })
    }
  }

  prevPos: Position = 'laying';
  listenMotion() {
    let currentPos: Position;
    this.motionSub = this.deviceMotion.watchAcceleration({ frequency: 500 })
      .subscribe(async (acceleration: DeviceMotionAccelerationData) => {

        if (acceleration.x > 5) {
          currentPos = 'left';
        } else if (acceleration.x < -5) {
          currentPos = 'right';
        } else if (acceleration.y >= 9) {
          currentPos = 'standing';
        } else if (acceleration.z >= 9 && acceleration.y >= -1 && acceleration.y <= 1 && acceleration.x >= -1 && acceleration.x <= 1) {
          currentPos = 'laying';
        }

        await this.handleMotion(currentPos);
      });
  }

  async handleMotion(position: Position) {
    if (this.isSettingDevice || this.isAudioPlaying || this.prevPos === position) return;
    console.log('△ Handling: ' + position);

    const audio = new Audio(`../../assets/sounds/${position}.mp3`);
    this.isAudioPlaying = true;
    switch (position) {
      case 'laying':
        Haptics.vibrate({ duration: 5100 });
        audio.play();
        await this.delay(5000);
        this.isAudioPlaying = false;
        break;
      case 'standing':
        CapacitorFlash.switchOn({ intensity: 100 });
        audio.play();
        await this.delay(5100);
        CapacitorFlash.switchOff();
        this.isAudioPlaying = false;
        break;
      case 'left':
      case 'right':
        await audio.play();
        this.isAudioPlaying = false;
        break;
    }

    this.prevPos = position;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  signOut() {
    this.auth.signOut();
    ToastInfo.fire('Sesión cerrada.');
    this.navCtrl.navigateRoot(['/login']);
  }

  ngOnDestroy() {
    this.auth.signOut();
  }
}
