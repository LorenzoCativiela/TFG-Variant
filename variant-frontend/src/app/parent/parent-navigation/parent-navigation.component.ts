  /*
   * Sidebar
   */
import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-parent-navigation',
  templateUrl: './parent-navigation.component.html',
  styleUrls: ['./parent-navigation.component.css']
})
export class ParentNavigationComponent implements OnInit {

  @Input() showEdit =  0
  //Get what link is active
  @Input() display = {
    displayMain:0,
    displayLog: 0,
    displaySearch: 0,
    displayDetails: 0,
    displayFamily: 0,
    displayCreate: 0
  }
  constructor() { }

  ngOnInit(): void {

  }
  //Marks selection with another color
  getSelected(input){
    if(this.display[input]){
      return "selected"
    }
    return ""
  }



}
