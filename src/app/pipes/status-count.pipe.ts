import { Pipe, PipeTransform } from '@angular/core';
import { Order } from '../models';

@Pipe({ name: 'statusCount' })
export class StatusCountPipe implements PipeTransform {
  transform(orders: Order[], status: string): number {
    return orders.filter(o => o.status === status).length;
  }
}