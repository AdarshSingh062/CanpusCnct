const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth', () => {
  test('registers a new student', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Test Student',
      email: 'test1@campusconnect.demo',
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.role).toBe('student');
    expect(res.body.token).toBeDefined();
  });

  test('rejects duplicate email registration', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'A',
      email: 'dup@campusconnect.demo',
      password: 'Password123!',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'B',
      email: 'dup@campusconnect.demo',
      password: 'Password123!',
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('logs in with correct credentials and rejects wrong password', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Login User',
      email: 'login@campusconnect.demo',
      password: 'Password123!',
    });

    const good = await request(app).post('/api/auth/login').send({
      email: 'login@campusconnect.demo',
      password: 'Password123!',
    });
    expect(good.statusCode).toBe(200);
    expect(good.body.token).toBeDefined();

    const bad = await request(app).post('/api/auth/login').send({
      email: 'login@campusconnect.demo',
      password: 'wrongpassword',
    });
    expect(bad.statusCode).toBe(401);
  });

  test('blocks protected route without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);
  });

  test('allows protected route with valid token', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      name: 'Me User',
      email: 'me@campusconnect.demo',
      password: 'Password123!',
    });
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data.email).toBe('me@campusconnect.demo');
  });
});

describe('Role-based authorization', () => {
  async function registerAndLogin(role, email) {
    const res = await request(app).post('/api/auth/register').send({
      name: `User ${role}`,
      email,
      password: 'Password123!',
      role,
    });
    return res.body.token;
  }

  test('student cannot create an event (faculty/clubadmin/superadmin only)', async () => {
    const studentToken = await registerAndLogin('student', 'stud@campusconnect.demo');
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Event',
        description: 'Should fail',
        category: 'Workshop',
        date: new Date(),
        time: '10:00 AM',
        venue: 'Somewhere',
        capacity: 10,
      });
    expect(res.statusCode).toBe(403);
  });

  test('faculty CAN create an event', async () => {
    const facultyToken = await registerAndLogin('faculty', 'fac@campusconnect.demo');
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${facultyToken}`)
      .send({
        title: 'Authorized Event',
        description: 'Should succeed',
        category: 'Workshop',
        date: new Date(),
        time: '10:00 AM',
        venue: 'Somewhere',
        capacity: 10,
      });
    expect(res.statusCode).toBe(201);
    expect(res.body.data.title).toBe('Authorized Event');
  });

  test('non-superadmin cannot access admin analytics', async () => {
    const studentToken = await registerAndLogin('student', 'stud2@campusconnect.demo');
    const res = await request(app).get('/api/admin/analytics/overview').set('Authorization', `Bearer ${studentToken}`);
    expect(res.statusCode).toBe(403);
  });

  test('superadmin CAN access admin analytics', async () => {
    // role 'superadmin' isn't self-assignable via /register in production logic,
    // so create directly via the model to simulate a seeded admin account.
    const admin = await User.create({
      name: 'Admin',
      email: 'admin2@campusconnect.demo',
      password: 'Password123!',
      role: 'superadmin',
    });
    const login = await request(app).post('/api/auth/login').send({
      email: 'admin2@campusconnect.demo',
      password: 'Password123!',
    });
    const res = await request(app)
      .get('/api/admin/analytics/overview')
      .set('Authorization', `Bearer ${login.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty('totalStudents');
  });
});
