import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ParentManagerComponent } from './parent/parent-manager/parent-manager.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

const routes: Routes = [
  { path: '', component: ParentManagerComponent },
  { path: 'search', component: ParentManagerComponent },
  { path: 'create', component: ParentManagerComponent },
  { path: 'search/:asin/:marketplace', component: ParentManagerComponent },
  { path: 'log', component: ParentManagerComponent },
  { path: '**', pathMatch: 'full', component: PageNotFoundComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
