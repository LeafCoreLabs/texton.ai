import React, { useState, useEffect } from 'react';
import { User, Save } from 'lucide-react';
import { loadStudentProfile, saveStudentProfile } from '../../utils/studentProfile';

const GRADE_OPTIONS = ['Year 9', 'Year 10', 'Year 11', 'Year 12', 'Undergraduate', 'Other'];
const SUBJECT_PRESETS = ['Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'History', 'CS', 'Economics'];

const StudentProfileSection = ({ onSaved }) => {
  const [profile, setProfile] = useState(() => loadStudentProfile());
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setProfile(loadStudentProfile());
  }, []);

  const toggleSubject = (s) => {
    setProfile(p => ({
      ...p,
      subjects: p.subjects.includes(s) ? p.subjects.filter(x => x !== s) : [...p.subjects, s],
    }));
    setSaved(false);
  };

  const handleSave = () => {
    saveStudentProfile(profile);
    setSaved(true);
    onSaved?.(profile);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <User className="h-4 w-4 text-indigo-600" />
        I&apos;m studying for…
      </h3>
      <label className="mb-1 block text-xs text-slate-600">Grade / level</label>
      <select
        value={profile.gradeLevel}
        onChange={e => setProfile(p => ({ ...p, gradeLevel: e.target.value }))}
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Select level</option>
        {GRADE_OPTIONS.map(g => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>
      <label className="mb-1 block text-xs text-slate-600">Exam board (optional)</label>
      <input
        value={profile.examBoard}
        onChange={e => setProfile(p => ({ ...p, examBoard: e.target.value }))}
        placeholder="e.g. CBSE, A-Levels, AP"
        className="mb-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
      />
      <label className="mb-2 block text-xs text-slate-600">Subjects</label>
      <div className="mb-3 flex flex-wrap gap-2">
        {SUBJECT_PRESETS.map(s => (
          <button
            key={s}
            type="button"
            onClick={() => toggleSubject(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              profile.subjects.includes(s)
                ? 'bg-indigo-600 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-indigo-200'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white"
      >
        <Save className="h-4 w-4" />
        {saved ? 'Saved!' : 'Save profile'}
      </button>
      <p className="mt-2 text-[10px] text-slate-500">Personalizes AI tutor replies on this device.</p>
    </section>
  );
};

export default StudentProfileSection;
