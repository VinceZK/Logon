import { Injectable } from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private messages: Message[] = [];
  private messageSource = new BehaviorSubject<Message[]>([]);

  currentMessageObserver = this.messageSource.asObservable();

  constructor() { }

  pushMessage(message: Message) {
    this.messages.push(message);
    this.messageSource.next(this.messages);
  }

  clearMessages() {
    this.messages = [];
  }

  removeMessage(message: Message) {
    const idx = this.messages.map(ele => ele.msgCat + ele.msgName)
      .indexOf(message.msgCat + message.msgName);
    if ( idx > -1 ) {
      this.messages.splice(idx, 1);
    }
  }
}

export class Message {
  msgCat: string;
  msgName: string;
  msgType: messageType;
  msgShortText: string;
  msgLongText: string;
}

export enum messageType {
  Error = 'E',
  Warning = 'W',
  Success = 'S',
  Information = 'I',
  Exception = 'X',
}
