export default function Timeline() {
  const tasks = [
    {
      date: "Nov 5",
      title: "Find 3 academic sources.",
      duration: "30 mins",
      category: "Research",
      icon: "library_books",
      completed: true,
    },
    {
      date: "Nov 7",
      title: "Read sources and highlight 5 key quotes.",
      duration: "45 mins",
      category: "Analysis",
      icon: "edit_note",
      completed: false,
    },
    {
      date: "Nov 10",
      title: "Write a rough outline with a thesis statement.",
      duration: "20 mins",
      category: "Drafting",
      icon: "format_list_bulleted",
      completed: false,
    },
    {
      date: "Nov 12",
      title: "Write the Intro and Body Paragraph 1.",
      duration: "40 mins",
      category: "Writing",
      icon: "history_edu",
      completed: false,
    },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-hanken">
      {/* TopAppBar */}
      <header className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-container-padding-mobile md:px-container-padding-desktop py-4 max-w-focus-width mx-auto sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <span className="text-xl font-bold text-primary">BiteSize</span>
          <nav className="hidden md:flex items-center gap-6">
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="/">Focus</a>
            <a className="text-primary border-b-2 border-primary font-bold pb-1 text-sm hover:text-primary/80 transition-colors" href="/timeline">Timeline</a>
            <a className="text-on-surface-variant text-sm font-medium hover:text-primary transition-colors" href="#">Archive</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-primary">account_circle</span>
        </div>
      </header>

      {/* SideNavBar (Desktop only) */}
      <aside className="hidden lg:flex flex-col h-full w-64 fixed left-0 top-0 bg-surface-container-low border-r border-outline-variant p-6 pt-24">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-primary">BiteSize</h2>
          <p className="text-sm font-medium text-on-surface-variant">Tiny steps, big results.</p>
        </div>
        <nav className="flex flex-col gap-2">
          <a className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all active:scale-[0.98]" href="/">
            <span className="material-symbols-outlined">edit_note</span>
            <span className="text-sm font-medium">Plan</span>
          </a>
          <a className="flex items-center gap-3 p-3 bg-secondary-container text-on-secondary-container rounded-xl font-bold transition-all active:scale-[0.98]" href="/timeline">
            <span className="material-symbols-outlined">checklist</span>
            <span className="text-sm font-bold">Micro-Tasks</span>
          </a>
          <a className="flex items-center gap-3 p-3 text-on-surface-variant hover:bg-surface-container-high rounded-xl transition-all active:scale-[0.98]" href="#">
            <span className="material-symbols-outlined">settings</span>
            <span className="text-sm font-medium">Settings</span>
          </a>
        </nav>
        <div className="mt-auto p-4 bg-primary-container rounded-xl">
          <p className="text-xs font-bold text-on-primary-container">Next Milestone:</p>
          <p className="text-base font-bold text-on-primary-container">Source Search</p>
          <div className="w-full bg-on-primary-container/20 h-1.5 rounded-full mt-2 overflow-hidden">
            <div className="bg-on-primary-container h-full rounded-full w-1/3"></div>
          </div>
        </div>
      </aside>

      <main className="max-w-[720px] mx-auto px-container-padding-mobile md:px-0 py-section-gap w-full lg:ml-[25%] xl:ml-[35%]">
        {/* Success Header */}
        <div className="mb-12 text-center md:text-left">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-container text-on-primary-container mb-4">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
          </div>
          <h1 className="text-3xl font-bold text-on-surface mb-2">We&apos;ve broken it down for you.</h1>
          <p className="text-lg text-on-surface-variant leading-relaxed">Your Research Paper project is now in manageable chunks.</p>
        </div>

        {/* Timeline Section */}
        <div className="relative space-y-12">
          {tasks.map((task, index) => (
            <div key={index} className="relative pl-10">
              {index !== tasks.length - 1 && <div className="timeline-line"></div>}
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full bg-surface border-2 flex items-center justify-center z-10 ${task.completed ? 'border-primary' : 'border-outline-variant'}`}>
                {task.completed && <div className="w-2 h-2 rounded-full bg-primary"></div>}
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl task-card-shadow transition-all active:scale-[0.98] cursor-pointer hover:border-primary/30">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`text-xs font-bold uppercase tracking-wider mb-1 block ${task.completed ? 'text-primary' : 'text-on-surface-variant'}`}>{task.date}</span>
                    <h3 className="text-lg font-bold text-on-surface leading-tight">{task.title}</h3>
                  </div>
                  <input 
                    className="w-6 h-6 rounded border-outline text-primary focus:ring-primary cursor-pointer" 
                    type="checkbox" 
                    defaultChecked={task.completed}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-surface-container rounded-full text-on-surface-variant">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span className="text-xs font-semibold">{task.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary-container/30 rounded-full text-secondary">
                    <span className="material-symbols-outlined text-[18px]">{task.icon}</span>
                    <span className="text-xs font-semibold">{task.category}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Export Actions */}
        <section className="mt-section-gap border-t border-outline-variant/30 pt-12">
          <h2 className="text-xl font-bold text-on-surface mb-6 text-center">Ready to get started?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center gap-2 py-3 px-6 border border-outline text-on-surface rounded-xl hover:bg-surface-container-high transition-all active:scale-95">
              <span className="material-symbols-outlined">ios_share</span>
              <span className="text-sm font-bold">Export to Notion</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-6 border border-outline text-on-surface rounded-xl hover:bg-surface-container-high transition-all active:scale-95">
              <span className="material-symbols-outlined">download</span>
              <span className="text-sm font-bold">Download PDF</span>
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-6 bg-primary text-on-primary rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-sm">
              <span className="material-symbols-outlined">calendar_add_on</span>
              <span className="text-sm font-bold">Add to Calendar</span>
            </button>
          </div>
        </section>

        {/* Aesthetic Imagery */}
        <div className="mt-section-gap">
          <div className="rounded-3xl overflow-hidden h-[300px] border border-outline-variant bg-surface-container-low relative shadow-inner">
            <img 
              alt="Minimalist workspace" 
              className="w-full h-full object-cover opacity-60" 
              src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 text-center">
              <p className="text-2xl font-semibold text-on-surface italic tracking-tight tracking-wide">&quot;Focus on the step, not the mountain.&quot;</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer (Mobile/Tablet only) */}
      <footer className="lg:hidden flex flex-col md:flex-row justify-between items-center w-full py-8 px-container-padding-mobile max-w-focus-width mx-auto text-center md:text-left border-t border-outline-variant/30 mt-12">
        <div className="font-bold text-primary mb-4 md:mb-0">BiteSize</div>
        <div className="text-xs font-semibold text-on-surface-variant opacity-70 mb-4 md:mb-0">© 2024 BiteSize Productivity</div>
        <div className="flex gap-6">
          <a className="text-xs font-semibold text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" href="#">Privacy</a>
          <a className="text-xs font-semibold text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" href="#">Terms</a>
          <a className="text-xs font-semibold text-on-surface-variant opacity-70 hover:opacity-100 transition-opacity" href="#">Support</a>
        </div>
      </footer>
    </div>
  );
}
