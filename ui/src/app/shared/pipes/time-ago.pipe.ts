import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'timeAgo', standalone: true })
export class TimeAgoPipe implements PipeTransform {
  transform(value: Date): string {
    const now = new Date();
    const seconds = Math.round(
      Math.abs((now.getTime() - value.getTime()) / 1000),
    );
    const minutes = Math.round(seconds / 60);
    const hours = Math.round(minutes / 60);
    const days = Math.round(hours / 24);
    const months = Math.round(days / 30);
    const years = Math.round(months / 12);

    if (seconds < 60) {
      return seconds + ' seconds ago';
    } else if (minutes < 60) {
      return minutes + ' minutes ago';
    } else if (hours < 24) {
      return hours + ' hours ago';
    } else if (days < 30) {
      return days + ' days ago';
    } else if (months < 12) {
      return months + ' months ago';
    } else {
      return years + ' years ago';
    }
  }
}
