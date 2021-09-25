import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { FrontendService } from '../frontend.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  @Output() logout = new EventEmitter<Object>()

  constructor(
    private frontend: FrontendService,
    private router: Router
  ) { }

  ngOnInit(): void {
  }

  closeSession(){
    this.frontend.deleteToken()
    this.logout.emit("close")
  }
  mainIcon(){
    let url = '/'
    this.router.navigateByUrl(url)
  }
}
