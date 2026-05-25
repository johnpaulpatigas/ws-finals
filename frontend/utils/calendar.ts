export interface CalendarEvent {
  title: string;
  description: string;
  startDate: Date;
  endDate: Date;
}

export function generateICS(events: CalendarEvent[]): string {
  const formatICSDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BiteSize//NONSGML v1.0//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events.forEach(event => {
    icsContent.push('BEGIN:VEVENT');
    icsContent.push(`DTSTART:${formatICSDate(event.startDate)}`);
    icsContent.push(`DTEND:${formatICSDate(event.endDate)}`);
    icsContent.push(`SUMMARY:${event.title}`);
    icsContent.push(`DESCRIPTION:${event.description}`);
    icsContent.push('END:VEVENT');
  });

  icsContent.push('END:VCALENDAR');

  return icsContent.join('\r\n');
}

export function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
