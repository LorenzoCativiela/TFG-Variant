  /*
   * Display asin information
   */
import { Component, OnInit, Input, SimpleChanges, SimpleChange} from '@angular/core';
import { Router } from '@angular/router';




@Component({
  selector: 'app-parent-details',
  templateUrl: './parent-details.component.html',
  styleUrls: ['./parent-details.component.css']
})
export class ParentDetailsComponent implements OnInit {

  @Input ()parentData = {petition:'', status:'', message:'', value: {asin:'',
  marketplace:'', asinInfo:'',  relations:''}}
  opMode = -1;
  isChildren = 0;

  constructor( private router: Router) { }

  ngOnInit(): void {
  }

  /*
   * This module triggers, when parent manager delivers some product details
   */
  ngOnChanges(change: SimpleChanges){
    try{
      this.opMode = Number(this.parentData.status);
      if(this.opMode==0){
        //Status 0: ASIN exists
        let value = this.parentData.value;
        let relationships = this.parentData.value.relations

        //Verify if this is a children listing
       if(relationships.length>0){
         if(Object.keys(relationships[0]).length==1){
          this.isChildren = 1;
         }
       }
      }
    }catch(e){
      console.log(e)
      this.opMode = -1;
    }
  }

  goSearch(){
    this.router.navigateByUrl("/search");
  }

  getCountry(){
    return this.router.url.slice(-2)
  }









}
