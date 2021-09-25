import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';


import { Router } from '@angular/router';

import { FrontendService } from '../../frontend.service';

@Component({
  selector: 'app-parent-search',
  templateUrl: './parent-search.component.html',
  styleUrls: ['./parent-search.component.css']
})
export class ParentSearchComponent implements OnInit {

  //Marketplace inputs
  marketplaces = ['ES','DE','FR','IT','GB','NL','PL','SE','USA'];

  //Input errors
  showError = [0,0,0]

  text = ""


  parentAsin = new FormGroup({
    asin: new FormControl (''), //PARENT ASIN CODE
    marketplace: new FormControl('')
  });

  constructor(
    private router: Router,
    private frontend: FrontendService
  ) { }

  ngOnInit(): void {

  }

  onSubmit(){
    try{
      let error = 0;
      this.showError=[0,0,0]
      //Get data and verify if its correct
      let asin = this.parentAsin.get('asin').value;
      let marketplace = this.parentAsin.get('marketplace').value;
      if(asin.length!=10){
        this.showError[0]=1;
      }
      if(marketplace==''){
        this.showError[1]=1;
      }

      if(!this.showError[0] && !this.showError[1] ){

        //If input its ok, check if asin exists
        let result$ = this.frontend.getAsin(asin,marketplace)


        result$.subscribe(data => {
          if(data.status==0){

            //If so, update url and parent manager will take care of the rest
            let url = '/search/'+this.parentAsin.get('asin').value+'/'+this.parentAsin.get('marketplace').value;
            this.router.navigateByUrl(url);
          }else{
            this.showError[2]=1;
          }

        }, () => this.showError[2]=1);

      }
    }catch(e){
      console.log(e)
    }


  }


}
