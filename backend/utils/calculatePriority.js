/**
 * Smart Complaint Priority Engine
 * -------------------------------
 * Scores a complaint on category weight, severity, how many students are
 * affected, and how long it's been pending, then maps the score to a
 * Low/Medium/High/Critical label. Admins can always override the result
 * (see Complaint.priorityOverridden).
 *
 * This is intentionally simple/explainable (a weighted-sum heuristic) rather
 * than an ML model — in an interview you can describe it as a rules engine
 * that's easy to reason about and tune, with room to swap in a trained
 * classifier later using the same feature set.
 */

const CATEGORY_WEIGHT = {
  'Wi-Fi': 3,
  Electricity: 3,
  Water: 3,
  Security: 4,
  Hostel: 2,
  Mess: 2,
  Classroom: 2,
  Library: 1,
  Cleanliness: 1,
  Other: 1,
};

const SEVERITY_WEIGHT = { low: 1, medium: 2, high: 3 };

function calculatePriority({ category, severity = 'medium', affectedCount = 1, createdAt = new Date() }) {
  const categoryScore = CATEGORY_WEIGHT[category] ?? 1;
  const severityScore = SEVERITY_WEIGHT[severity] ?? 2;

  // Affected-count score: diminishing-return log-ish buckets.
  let affectedScore;
  if (affectedCount >= 100) affectedScore = 4; // whole hostel/dept
  else if (affectedCount >= 30) affectedScore = 3;
  else if (affectedCount >= 5) affectedScore = 2;
  else affectedScore = 1;

  // Time-pending score: complaints that have sat unresolved get bumped up.
  const hoursPending = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60);
  let timeScore;
  if (hoursPending >= 72) timeScore = 3;
  else if (hoursPending >= 24) timeScore = 2;
  else timeScore = 1;

  const totalScore = categoryScore + severityScore + affectedScore + timeScore;

  // Max possible ~14 (4 + 3 + 4 + 3). Bucket into 4 priority levels.
  let priority;
  if (totalScore >= 11) priority = 'Critical';
  else if (totalScore >= 8) priority = 'High';
  else if (totalScore >= 5) priority = 'Medium';
  else priority = 'Low';

  return { priority, score: totalScore, breakdown: { categoryScore, severityScore, affectedScore, timeScore } };
}

module.exports = calculatePriority;
