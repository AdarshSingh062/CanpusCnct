const request = require('supertest');
const app = require('../app');

async function registerAndLogin(role, email) {
  const res = await request(app).post('/api/auth/register').send({
    name: `User ${role}`,
    email,
    password: 'Password123!',
    role,
  });
  return res.body.token;
}

describe('Event registration', () => {
  test('prevents registration beyond capacity', async () => {
    const facultyToken = await registerAndLogin('faculty', 'organizer@campusconnect.demo');

    const eventRes = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Tiny Workshop',
        description: 'Only 1 seat',
        category: 'Workshop',
        date: new Date(),
        time: '10:00 AM',
        venue: 'Room 1',
        capacity: 1,
      });
    const eventId = eventRes.body.data._id;

    const studentAToken = await registerAndLogin('student', 'seatA@campusconnect.demo');
    const studentBToken = await registerAndLogin('student', 'seatB@campusconnect.demo');

    const regA = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${studentAToken}`);
    expect(regA.statusCode).toBe(201);

    const regB = await request(app)
      .post(`/api/events/${eventId}/register`)
      .set('Authorization', `Bearer ${studentBToken}`);
    expect(regB.statusCode).toBe(400);
    expect(regB.body.message).toMatch(/capacity/i);
  });
});
