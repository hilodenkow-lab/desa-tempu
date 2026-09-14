import { JadwalKunjungan } from '../types';

export class GoogleCalendarService {
  /**
   * Create an event in user's primary Google Calendar
   */
  public static async createCalendarEvent(token: string, jadwal: JadwalKunjungan): Promise<string> {
    if (token.startsWith('simulated_')) {
      await new Promise(r => setTimeout(r, 300));
      return `cal-sim-${Date.now()}`;
    }

    const startDateTime = `${jadwal.tanggal}T${jadwal.waktuMulai || '09:00'}:00`;
    const endDateTime = `${jadwal.tanggal}T${jadwal.waktuSelesai || '12:00'}:00`;

    const description = [
      `📍 PEMBINAAN ADMINISTRASI DESA KECAMATAN TEMPUNAK`,
      `================================================`,
      `🏛️ Desa Tujuan: ${jadwal.namaDesa}`,
      `👥 Tim Pembina: ${jadwal.timPembina}`,
      `🎯 Fokus Agenda: ${jadwal.agenda}`,
      `📌 Lokasi: ${jadwal.lokasi}`,
      jadwal.catatanPersiapan ? `📝 Catatan Persiapan: ${jadwal.catatanPersiapan}` : '',
      `\n🔗 Dicatat via Aplikasi BINA DESA TEMPU (Kecamatan Tempunak)`
    ].filter(Boolean).join('\n');

    const eventPayload = {
      summary: `[Bina Desa] Pembinaan Desa ${jadwal.namaDesa}`,
      location: jadwal.lokasi,
      description,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: 'Asia/Pontianak'
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: 'Asia/Pontianak'
      },
      colorId: '2', // Sage / Green
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 24 * 60 }, // 1 hari sebelumnya
          { method: 'popup', minutes: 120 },     // 2 jam sebelumnya
          { method: 'email', minutes: 24 * 60 }
        ]
      }
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal menambahkan jadwal ke Google Calendar');
    }

    const created = await res.json();
    return created.id;
  }

  /**
   * Delete an event from Google Calendar
   */
  public static async deleteCalendarEvent(token: string, eventId: string): Promise<boolean> {
    if (token.startsWith('simulated_')) {
      return true;
    }
    try {
      const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.ok || res.status === 404;
    } catch (e) {
      console.warn('Failed to delete Google Calendar event:', e);
      return false;
    }
  }

  /**
   * Update an existing event in Google Calendar
   */
  public static async updateCalendarEvent(token: string, eventId: string, jadwal: JadwalKunjungan): Promise<void> {
    if (token.startsWith('simulated_')) {
      await new Promise(r => setTimeout(r, 200));
      return;
    }

    const startDateTime = `${jadwal.tanggal}T${jadwal.waktuMulai || '09:00'}:00`;
    const endDateTime = `${jadwal.tanggal}T${jadwal.waktuSelesai || '12:00'}:00`;

    const description = [
      `📍 PEMBINAAN ADMINISTRASI DESA KECAMATAN TEMPUNAK`,
      `================================================`,
      `🏛️ Desa Tujuan: ${jadwal.namaDesa}`,
      `👥 Tim Pembina: ${jadwal.timPembina}`,
      `🎯 Fokus Agenda: ${jadwal.agenda}`,
      `📌 Lokasi: ${jadwal.lokasi}`,
      `📊 Status Kunjungan: ${jadwal.status}`,
      jadwal.catatanPersiapan ? `📝 Catatan Persiapan: ${jadwal.catatanPersiapan}` : '',
      `\n🔗 Terkoneksi ke Aplikasi BINA DESA TEMPU`
    ].filter(Boolean).join('\n');

    const eventPayload = {
      summary: `[Bina Desa] ${jadwal.status === 'Dibatalkan' ? '[BATAL] ' : ''}Pembinaan Desa ${jadwal.namaDesa}`,
      location: jadwal.lokasi,
      description,
      start: {
        dateTime: new Date(startDateTime).toISOString(),
        timeZone: 'Asia/Pontianak'
      },
      end: {
        dateTime: new Date(endDateTime).toISOString(),
        timeZone: 'Asia/Pontianak'
      },
      colorId: jadwal.status === 'Selesai' ? '10' : jadwal.status === 'Dibatalkan' ? '11' : '2'
    };

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventPayload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Gagal memperbarui jadwal di Google Calendar');
    }
  }
}
