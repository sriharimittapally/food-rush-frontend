import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject }   from 'rxjs';
import { Client, IMessage }      from '@stomp/stompjs';
import SockJS                    from 'sockjs-client';
import { environment }           from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {

  private client!: Client;
  private connected = false;

  connect(): void {
    if (this.connected) return;

    this.client = new Client({
      webSocketFactory: () =>
        new SockJS(`${environment.apiUrl.replace('/api', '')}/ws`),
      reconnectDelay: 5000,
      onConnect: () => {
        this.connected = true;
        console.log('WebSocket connected');
      },
      onDisconnect: () => {
        this.connected = false;
      }
    });

    this.client.activate();
  }

  // Subscribe to a specific order's status updates
  subscribeToOrder(orderId: number): Observable<any> {
    return new Observable(observer => {
      const waitForConnection = setInterval(() => {
        if (this.client?.connected) {
          clearInterval(waitForConnection);
          this.client.subscribe(
            `/topic/orders/${orderId}`,
            (message: IMessage) => {
              observer.next(JSON.parse(message.body));
            }
          );
        }
      }, 100);
    });
  }

  disconnect(): void {
    if (this.client?.connected) {
      this.client.deactivate();
      this.connected = false;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}