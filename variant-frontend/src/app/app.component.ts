import { Component } from '@angular/core';
import { FrontendService } from './frontend.service';
import {enableProdMode} from '@angular/core';

enableProdMode();
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'variant-frontend';

  //Variable that shows that we are logged, shows login if not true
  login = 0

  token = {}


 /*
  * Display page or login
  */
  onLogin(token: Object){
    this.login = 1
    this.token = token
  }

  logout(){
    this.login = 0
  }
}
