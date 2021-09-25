import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FrontendService } from '../frontend.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  @Output() token = new EventEmitter<Object>()
  user: string
  password: string
  errorPassword = 0



  constructor(private frontend: FrontendService) { }

  ngOnInit(): void {
    this.verifyCookies()
  }

  /*
   * Login petition
   */
  async login(){
      //Send request
      if(this.user == "" || this.password == "") return 0
      let response$ = await this.frontend.login(this.user,this.password)
      response$.subscribe(data => {
        try{
          //Evaluate response
          let token = data.value.token
          if(token!=0){
            //set token
            this.token.emit(data.value)
            this.frontend.setToken(data.value.token)
            return data.value
          }
        }catch(e){
            return 0
        }
      }, () =>
      console.log("No response on login"));
      return 0
  }

  //Send cookies to parent manager
  verifyCookies(){
    try{
      let token = this.frontend.getToken()
      if(token!=""){
        this.token.emit( { token: token })
      }
    }catch(e){

    }
  }



}
