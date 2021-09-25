  /*
   * Input form component, allows the user to send variation changes to the back-end
   */
import { Component, OnInit, Input, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { FormGroup, FormControl } from '@angular/forms';
import { stringify } from 'querystring';
import { FrontendService } from '../../frontend.service';

@Component({
  selector: 'app-parent-family',
  templateUrl: './parent-family.component.html',
  styleUrls: ['./parent-family.component.css']
})
export class ParentFamilyComponent implements OnInit {
  //Input from manager
  @Input() input =  {petition:'', status:'', value: {message:'', asin:'',
  marketplace:'', asinInfo:'',  relations:''} }
  //Our stored value
  parentData = {petition:'', status:'', value: {message:'', asin:'',
  marketplace:'', asinInfo:'',  relations:''} }


  variationList = [['Size','Color'],['Color'],['Size'],['Material']]

  //Variation type form
  variationForm = new FormGroup({
    variationSelected: new FormControl ('')
  });

  //Mode of operation, shows or hides content
  opMode = 0;

  //Form of the input
  family: FormGroup;

  constructor(
    private frontend : FrontendService
  ) {
    //Creates form structure
    this.family = new FormGroup({
      variation: new FormControl(''),
      rowId: new FormControl([]),
      rows: new FormGroup({})
    });
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges){

    //Changed route
    if(changes.input.currentValue.asin!=this.parentData.value.asin){
      this.parentData = changes.input.currentValue
      this.fillForm()
    }
  }
  /*
   * Retrieve an asin information and relation list, and build a form with all the collection information
   */
  fillForm(): void {
    try{

      let relations = this.parentData.value.relations;
      if (relations.length>0){
          if(this.isParent()){
            //Parse children list
            //Create form group
            let rowId = []
            let rows = new FormGroup({})

            //Create a new row for each variation
            for (let i = 0;i<relations.length;i++) {
              let keys = Object.keys(relations[i])
              //Get variation type from first variation keys
              if(i==0){
                this.family.get('variation').setValue(keys);
              }
              let fGroup = new FormGroup({ })

              //Iterate on child data structure, and add the controllers
              for(let j of keys){
                //Identifiers, main attribute, create also the marketplace and keys information
                //This is done to mantain Amazon relation format
                if(j=="Identifiers"){
                  let identifiers = relations[i][j]
                  let fControlMarket = new FormControl(identifiers.MarketplaceASIN.MarketplaceId)
                  let fControlAsin = new FormControl(identifiers.MarketplaceASIN.ASIN)
                  let fControlKeys = new FormControl(keys)
                  fGroup.addControl("Identifiers",fControlAsin)
                  fGroup.addControl("Marketplace",fControlMarket)
                  fGroup.addControl("VariationType",fControlKeys)
                }else{
                  //Add variation keys
                  let fControl = new FormControl(relations[i][j])
                  fGroup.addControl(j,fControl)
                }
              }
              //Update the row with complete information
              rowId.push(i)
              rows.addControl(i.toString(),fGroup)
            }
            //Set data to the form
            this.family.get('rowId').setValue(rowId);
            this.family.setControl('rows',rows)


            //Show form
            this.opMode = 1;

          }else {
            //This product is a child. This module will not be spawned here
            this.opMode = 2;
          }

      }else{
        //Empty relations, show variation selection mode
        console.log("Doesnt have any relations parent/child")
        this.opMode = 3;
      }

    } catch(e) {
      console.log(e)
    }

  }


  /*
   * User clicks the add row button. Adds a row with the information of the current variation
   */
  addRow(): void{

    //Add new row to the variation
    let rowId: Array<number> = this.family.get('rowId').value;
    let newRow = rowId[rowId.length - 1] + 1
    rowId.push(newRow)
    this.family.get('rowId').setValue(rowId)

    //Get variation info
    let variation = this.family.get('variation').value;
    let fGroup = new FormGroup({});
    //Create the variation empty info
    for(let j of variation){
      if(j=="Identifiers"){
        let fControlMarketplace = new FormControl(this.parentData.value.marketplace)
        let fControlAsin = new FormControl('')
        fGroup.addControl("Identifiers",fControlAsin)
        fGroup.addControl("Marketplace",fControlMarketplace)
      }else{
        let fControl = new FormControl('')
        fGroup.addControl(j,fControl)
      }
    }
    let fControlVariationType = new FormControl(variation)
    fGroup.addControl("VariationType", fControlVariationType)
    //Add the results to the form
    let rows = this.family.get('rows') as FormGroup
    rows.addControl(newRow.toString(),fGroup)


  }

  /*
   * User removes row from the form
   */
  removeRow(id:string): void{

    //Remove Id from table
    let rowId: Array<String> = this.family.get('rowId').value;
    rowId = rowId.filter(e => e != id)
    this.family.get('rowId').setValue(rowId)

    //Remove data from row info
    let rows = this.family.get('rows') as FormGroup
    rows.removeControl(id)
    this.family.setControl('rows',rows)
  }


  /*
   * User clicks the confirm button
   */
  onSubmit():void {
    //Get data from input
    let variation = this.family.get('variation').value
    let rowId = this.family.get('rowId').value
    let data = this.family.get('rows').value
    let inputList = Object.keys(data).map((key) => data[key])
    //Parsed list
    let children = []
    try{
      //Remove from the list incomplete data
      for (let i=0;i<inputList.length;i++){
        let incomplete = false
        for(let key of Object.keys(inputList[i])){
          if(inputList[i][key]== ""){
            incomplete = true
          }
          //Check if ASIN is correct
          if(key=="Identifiers"){
            if(!this.isAsin(inputList[i][key])){
              incomplete = false

            }
          }
        }
        //Add to result list
        if(!incomplete){
          children.push(inputList[i])
        }

      }

      if(children.length>0){
        //Send operation to front-end service, this will connect with the back-end and act when it answers
        this.frontend.submitOperation(this.parentData.value.asin, this.parentData.value.marketplace, variation, children)
      }
    }catch(e){
      console.log(e)
    }
  }

  /*
   * User creates a new variation, add a first row defining variation info
   */
  createVariation() {
    try{

      //Get variation info
      let input:Array<string> = this.variationForm.get('variationSelected').value.split(',');
      input.unshift('Identifiers')

      //Create new form
      let rowId = [0]
      let rows = new FormGroup({})
      let fGroup = new FormGroup({ })

      //Populate the form with an empty form row with the variation info assigned from the user
      for(let j of input){
        if(j=="Identifiers"){
          let identifiers = ""
          let fControlMarket = new FormControl(this.parentData.value.marketplace)
          let fControlAsin = new FormControl(identifiers)
          let fControlKeys = new FormControl(input)
          fGroup.addControl("Identifiers",fControlAsin)
          fGroup.addControl("Marketplace",fControlMarket)
          fGroup.addControl("VariationType",fControlKeys)
        }else{
          let fControl = new FormControl("")
          fGroup.addControl(j,fControl)
        }

      }
      //Set data and display form
      rows.addControl("0",fGroup)
      this.family.get('variation').setValue(input);
      this.family.get('rowId').setValue(rowId);
      this.family.setControl('rows',rows)

      this.opMode = 1

    }catch(e){
      console.log(e)
    }



  }

  //Return true if is a parent with children
  isParent(): Boolean {
    try{
      let keys = Object.keys(this.parentData.value.relations[0])
      if (keys.length==1){
        return false;
      }
    }catch(e){
      console.log(e)
    }
    return true
  }

  //Return true if ASIN format
  isAsin(text): Boolean{
    try{
      if(text.length==10 && text[0]=='B'){
        return true
      }else{
        return false
      }
    }catch(e){
      console.log(e)
      return false
    }finally{

    }
  }


}
