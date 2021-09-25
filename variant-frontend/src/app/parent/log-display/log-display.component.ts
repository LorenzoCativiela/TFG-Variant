 /*
   * Log component. Displays operation results
   */
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FrontendService } from 'src/app/frontend.service';

import {NgbAccordionConfig} from '@ng-bootstrap/ng-bootstrap'
import {NgbPanelChangeEvent} from '@ng-bootstrap/ng-bootstrap';
import { FormGroup, FormControl } from '@angular/forms';



@Component({
  selector: 'app-log-display',
  templateUrl: './log-display.component.html',
  styleUrls: ['./log-display.component.css']
})
export class LogDisplayComponent implements OnInit {

  logReport = null
  currentPage = 1
  pages = [1]

  filter = new FormGroup({
    value: new FormControl ('')
  });
  activeFilter = 0


  constructor(
    private frontend: FrontendService,
    private router: Router,
    private _config:NgbAccordionConfig
    ) {
      _config.closeOthers=false;
    }

  ngOnInit(): void {
    this.getLogs(this.currentPage)

  }

  /*
   * Get logs page from the backend
   */
  getLogs(id){
    if(id<1) id=1

    let logData$ = this.frontend.logs(id)
    logData$.subscribe(data => {
      //Show logs
      if (data['status']==0){
        let logs = data['value']['logs']
      this.logReport=logs
      this.pages = this.getPages(this.logReport.pages)
      this.currentPage = id
      }



    }, () => console.log("error"))

    console.log(this.logReport)
  }

  /*
   * User inputs a parent identifier to filter its changes
   */
  searchFilter(){
    this.activeFilter = 1
    let filter = this.filter.get('value').value;
    if(filter.length!=0){
      //Verify not empty input
      //Get data from frontend
      let logData$ = this.frontend.logFilter(filter)

      logData$.subscribe(data => {
        //Display data

      if (data['status']==0){
        let logs = data['value']['logs']
      this.logReport=logs
      this.pages = this.getPages(this.logReport.pages)
      this.currentPage = 1
      }

    }, () => console.log("error"))
    }
  }






  //Refresh logs
  refresh(){
    this.logReport = null
    this.getLogs(this.currentPage)
    this.filter.setValue({value: ""})
    this.activeFilter=0
  }

  getPages(number){
    let response = []
    for(let i = 1;i<=number;i++){
      response.push(i)
    }
    return response
  }

  getProcessing(text){
    if(text=='PROCESSING') return 1
    return 0
  }

  //Highlight current
  isCurrent(i){
    if(i==this.currentPage) return 'active'
    return ''
  }

}
