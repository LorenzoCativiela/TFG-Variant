  /*
   * Parent Manager: This module encapsulates the parent application, choosing when
   * to display its components
   * Does a function of routing inside the module, this allows to implement various application modules
   * inside the same web
   */
import { Component, OnInit } from '@angular/core';

import { FrontendService } from '../../frontend.service';
import { Router , NavigationEnd , NavigationStart, ActivatedRoute} from '@angular/router';
import { Location } from '@angular/common';

import { ParentDetailsComponent } from '../parent-details/parent-details.component';
import { ParentFamilyComponent } from '../parent-family/parent-family.component';

@Component({
  selector: 'app-parent-manager',
  templateUrl: './parent-manager.component.html',
  styleUrls: ['./parent-manager.component.css']
})
export class ParentManagerComponent implements OnInit {

  private details: ParentDetailsComponent
  private family: ParentFamilyComponent
  //Message response
  parentData = {petition:'', status:'', message:'', value: {asin:'',
  marketplace:'', asinInfo:'',  relations:''}}

  /*
   * This makes the components appear
   */
  display = {
    displayMain: 0,
    displayLog: 0,
    displaySearch: 0,
    displayDetails: 0,
    displayFamily: 0,
    displayCreate: 0
  }

  //Declaration of submodules
  constructor(
    private frontend: FrontendService,
    private router: Router,
    private route: ActivatedRoute,
    private location: Location
  ) {

    location.subscribe(val => this.updateview())

    router.events.forEach((event) => {
      if(event instanceof NavigationStart) {
        this.updateview()
      }
    });

   }

  ngOnInit(): void {
    this.updateview()
  }

  /*
   * Update the view of the parent module
   */
  updateview(): void{

    let url = this.router.url

      /*
      * This module matches the routes provided by the router and sets the components in the screen
      * accordingly
      */

     if(url.match(/\/search\/B[A-Z0-9]+\/[A-Z][A-Z]/)){
      //Product search input
      let asin = this.route.snapshot.paramMap.get("asin")
      let market = this.route.snapshot.paramMap.get("marketplace")

      try{
        if(asin!=null || market!=null){
          //Search for ASIN in the market
          let result$ = this.frontend.getAsin(asin,market)
          result$.subscribe(data => {
            if(data != undefined){
              //Set data for children components to access
              this.parentData = data

              //Set new components
              this.resetDisplay()
              if(data.status==0) this.display.displayFamily = 1
              this.display.displayDetails = 1
            } else{
              throw Error("Error receiving data")
            }
          }, () => this.resetDisplay())
        }
      }catch(e){
        this.router.navigateByUrl('/404')
      }

    } else if(url.match(/\/search/)){
      //ASIN Search
        this.resetDisplay()
        this.display.displaySearch = 1

    } else if(url.match(/\/log/)){
      //Log display
      this.resetDisplay()
      this.display.displayLog = 1

    }else if(url.match(/\/create/)){
      //Create parent
      this.resetDisplay()
      this.display.displayCreate = 1

    }else{
      //Main page
      this.resetDisplay()
      this.display.displayMain = 1
    }

  }

  //Turn everything off
  resetDisplay(): void{
    this.display = {
      displayMain: 0,
      displayLog: 0,
      displaySearch: 0,
      displayDetails: 0,
      displayFamily: 0,
      displayCreate: 0
    }
  }

  //Verify if result is children
  isChildren(data): boolean{
    try{
      if(Object.keys(data.value.asinInfo.Relationships[0]).length==1) return true
      return false
    }catch(e){
      return false
    }

  }
}
