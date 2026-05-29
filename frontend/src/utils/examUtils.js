export function daysUntilExam(examDate) {
  if (!examDate) return null;
  const d = new Date(examDate);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

export function sortExamsByDate(exams) {
  return [...(exams || [])].sort((a, b) => {
    if (!a.examDate && !b.examDate) return 0;
    if (!a.examDate) return 1;
    if (!b.examDate) return -1;
    return new Date(a.examDate) - new Date(b.examDate);
  });
}

export function topicProgressPercent(topics) {
  if (!topics?.length) return 0;
  const studied = topics.filter(t => t.status === 'STUDIED').length;
  return Math.round((studied / topics.length) * 100);
}
