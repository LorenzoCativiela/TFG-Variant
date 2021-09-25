import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';


import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CookieService } from 'ngx-cookie-service';

import { LoginComponent } from './login/login.component';
import { HeaderComponent } from './header/header.component';


import { ParentSearchComponent } from './parent/parent-search/parent-search.component';
import { ParentDetailsComponent } from './parent/parent-details/parent-details.component';
import { ParentFamilyComponent } from './parent/parent-family/parent-family.component';
import { LogDisplayComponent } from './parent/log-display/log-display.component';
import { ParentManagerComponent } from './parent/parent-manager/parent-manager.component';
import { ParentNavigationComponent } from './parent/parent-navigation/parent-navigation.component';
import { ParentMainComponent } from './parent/parent-main/parent-main.component';
import { ParentCreateComponent } from './parent/parent-create/parent-create.component';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';


@NgModule({
  declarations: [
    AppComponent,
    ParentSearchComponent,
    ParentDetailsComponent,
    ParentFamilyComponent,
    LogDisplayComponent,
    ParentManagerComponent,
    ParentNavigationComponent,
    LoginComponent,
    HeaderComponent,
    ParentMainComponent,
    ParentCreateComponent,
    PageNotFoundComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule
  ],
  providers: [CookieService],
  bootstrap: [AppComponent]
})
export class AppModule { }
