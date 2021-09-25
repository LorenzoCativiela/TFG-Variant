  /*
   * Front-end service
   * This module connects with the back-end throught HTTP calls to retrieve info or submit operations
   */
import { Injectable } from '@angular/core';


import { Observable, of,  Subscriber,  throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

import { CookieService } from "ngx-cookie-service"


@Injectable({
  providedIn: 'root'
})
export class FrontendService {
  //Server url
  //private backendUrl = "185.254.205.202:4100";

  //Localhost url
  private backendUrl = "localhost:4100";

  httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json',
    responseType: 'json'
  })
  };


  feedId$: Observable<any>;
  isSearching = 0;



  constructor(
    private http: HttpClient,
    private router: Router,
    private cookies: CookieService
  ) { }




  /*
   * Retrieve asin info from back-end
   */
  getAsin( asin:string, marketplace: string): Observable<any>{
    console.log("Generar peticion asin: "+asin+" en "+marketplace)
    let token = this.getToken()
    let result$ = this.http.post<any>("http://"+this.backendUrl+"/searchAsin/"+asin+"/"+marketplace,{token});
    return result$
  }


  /*
   * Send login
   */
 login(user, password){
    console.log("login attempt");
    let token = this.getToken()
    let result$ = this.http.post<any>("http://"+this.backendUrl+"/login",{user, password});
    return result$
  }


  /*
   * Send edit operation
   */
  submitOperation( asin, marketplace, variation, children ){
    let token = this.getToken()
    this.feedId$ = this.http.post("http://"+this.backendUrl+"/editParent/"+asin,{ asin, marketplace, variation, children, token})
    this.feedId$.subscribe(data => {
      console.log(data)
      let url = '/log'
      this.router.navigateByUrl(url)
    }, () =>
    console.log("error"));
  }

  /*
   * Create parent operation
   */
  createParent( sku , marketplace, productType , variation){
    let token = this.getToken()
    let result$ = this.http.post<any>("http://"+this.backendUrl+"/createParentOP/"+sku+"/"+marketplace,{ productType, variation, token});
    return result$
  }


  /*
   * Log page operation
   */
  logs (page){

    let token = this.getToken()
    let logs$ = this.http.post("http://"+this.backendUrl+"/logs/"+page, {token})
    return logs$
  }

  /*
   * Filter logs
   */
  logFilter (id){
    let token = this.getToken()
    console.log(this.http.post("http://"+this.backendUrl+"/logs/get/"+id, {token}))
    let logs$ = this.http.post("http://"+this.backendUrl+"/logs/get/"+id, {token})
    return logs$
  }


  /*
   * Set token methods
   */
  setToken(token: string) {
    var now = new Date()
    var time = now.getTime();
    time += 3600 * 1000
    now.setTime(time)

    this.cookies.set("token", token, now);
  }
  getToken() {
    return this.cookies.get("token");
  }
  deleteToken(){
    this.cookies.delete("token")
  }

}
