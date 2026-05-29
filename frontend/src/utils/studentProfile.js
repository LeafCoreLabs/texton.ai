const PROFILE_KEY = 'texton_student_profile';

const DEFAULT_PROFILE = {
  gradeLevel: '',
  examBoard: '',
  subjects: [],
};

export function loadStudentProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export function saveStudentProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

/** One-line context for API / prompts */
export function profileContextLine(profile) {
  if (!profile) return '';
  const parts = [];
  if (profile.gradeLevel?.trim()) parts.push(profile.gradeLevel.trim());
  if (profile.subjects?.length) parts.push(`studying ${profile.subjects.join(', ')}`);
  if (profile.examBoard?.trim()) parts.push(`preparing for ${profile.examBoard.trim()}`);
  if (!parts.length) return '';
  return `Student context: ${parts.join('; ')}. `;
}

export function isOnboardingDone() {
  return localStorage.getItem('texton_onboarding_done') === '1';
}

export function setOnboardingDone() {
  localStorage.setItem('texton_onboarding_done', '1');
}
