const calculatePriority = require('../utils/calculatePriority');

describe('calculatePriority', () => {
  test('Wi-Fi down for entire hostel -> Critical', () => {
    const { priority } = calculatePriority({
      category: 'Wi-Fi',
      severity: 'high',
      affectedCount: 150,
      createdAt: new Date(Date.now() - 80 * 60 * 60 * 1000), // 80h pending
    });
    expect(priority).toBe('Critical');
  });

  test('Broken classroom fan (single room) -> low/medium, not critical', () => {
    const { priority } = calculatePriority({
      category: 'Classroom',
      severity: 'low',
      affectedCount: 1,
      createdAt: new Date(),
    });
    expect(['Low', 'Medium']).toContain(priority);
  });

  test('Minor cleanliness issue -> Low', () => {
    const { priority } = calculatePriority({
      category: 'Cleanliness',
      severity: 'low',
      affectedCount: 1,
      createdAt: new Date(),
    });
    expect(priority).toBe('Low');
  });
});
