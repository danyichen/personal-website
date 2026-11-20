import dynamic from 'next/dynamic';

const PersonalTabs = dynamic(() => import('../../personal/PersonalTabs'));

export default function Personal() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold mb-2 text-amber-200 text-center">Personal Pursuits</h1>
      <div className="mb-8 text-lg text-amber-100/80 text-center">What you won't find on my resume</div>
      <PersonalTabs />
    </div>
  );
}
