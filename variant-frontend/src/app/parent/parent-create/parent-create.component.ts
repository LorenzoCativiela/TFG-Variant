  /*
   * Parent creation component
   */
import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';

import { Router } from '@angular/router';
import { FrontendService } from '../../frontend.service';
@Component({
  selector: 'app-parent-create',
  templateUrl: './parent-create.component.html',
  styleUrls: ['./parent-create.component.css']
})
export class ParentCreateComponent implements OnInit {

  marketplaces = ['ES','DE','FR','IT','GB','NL','PL','SE','USA'];
  productTypes = ['Furniture'];
  showError = [0,0,0,0]
  newListing = new FormGroup({
    sku: new FormControl (''), //PARENT ASIN CODE
    marketplace: new FormControl(''),
    variation: new FormControl(''),
    productType: new FormControl('')
  });
  variationList = [['Size','Color'],['Color'],['Size'],['Material']]


  constructor(
    private frontend: FrontendService,
    private router: Router
    ) { }

  ngOnInit(): void {
  }

  /*
   * User creates paren
   */
  onSubmit() {
    try{
      let error = 0;
      //Error values for displaying messages
      this.showError=[0,0,0,0,0]

      //Retrieve information
      let sku = this.newListing.get('sku').value;
      let productType = this.newListing.get('productType').value;
      let marketplace = this.newListing.get('marketplace').value;
      let variation = this.newListing.get('variation').value

      //Activate errors
      if(sku==''){
        this.showError[0]=1;
      } else if(marketplace==''){
        this.showError[1]=1;
      } else if(productType==''){
        this.showError[2]=1;
      } else if(variation==''){
        this.showError[3]=1;
      } else {

        //Create parent
        let result$ = this.frontend.createParent(sku,marketplace,productType,variation)
        result$.subscribe(data => {
          //Operation started, send to log
          if(data.status==0){
            let url = '/log'
            this.router.navigateByUrl(url)
          }
        });
      }
    }catch(e){
      console.log(e)
      this.showError[4]=1;
    }
  }

}
