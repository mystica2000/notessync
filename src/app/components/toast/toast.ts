import { Component, Input } from '@angular/core';

@Component({
  selector: 'toast',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss'
})
export class Toast {
  @Input({ required: true }) text: string = "";
}
