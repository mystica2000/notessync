import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './app-header.html',
  styleUrl: './app-header.scss'
})
export class AppHeader {
  showBack = input(false);

  location = inject(Location);

  onBack() {
    this.location.back()
  }
}
