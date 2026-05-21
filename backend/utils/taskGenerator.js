const prisma = require('../db');

/**
 * Generates a series of micro-tasks for a given assignment.
 * For now, it uses a rule-based approach to distribute tasks
 * from today until the due date.
 */
async function generateTasks(assignment) {
  const startDate = new Date();
  const endDate = new Date(assignment.dueDate);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // Basic template for assignment breakdown
  const taskTemplates = [
    { title: "Define scope and initial goals", category: "Planning", icon: "edit_note", duration: "15 mins", phase: 0.1 },
    { title: "Research and gather 3 key sources", category: "Research", icon: "library_books", duration: "30 mins", phase: 0.2 },
    { title: "Review materials and take notes", category: "Analysis", icon: "search", duration: "45 mins", phase: 0.3 },
    { title: "Create a detailed outline", category: "Drafting", icon: "format_list_bulleted", duration: "20 mins", phase: 0.4 },
    { title: "Write the introduction and main argument", category: "Writing", icon: "history_edu", duration: "45 mins", phase: 0.6 },
    { title: "Draft the body paragraphs", category: "Writing", icon: "edit", duration: "60 mins", phase: 0.7 },
    { title: "Write the conclusion", category: "Writing", icon: "article", duration: "30 mins", phase: 0.8 },
    { title: "Final proofreading and formatting", category: "Review", icon: "done_all", duration: "20 mins", phase: 0.9 },
  ];

  const tasks = taskTemplates.map(template => {
    // Distribute tasks chronologically based on their phase (0 to 1)
    const taskDate = new Date(startDate);
    const daysToAdd = Math.floor(diffDays * template.phase);
    taskDate.setDate(startDate.getDate() + daysToAdd);
    
    // Ensure task date doesn't exceed the due date
    if (taskDate > endDate) {
      taskDate.setTime(endDate.getTime());
    }

    return {
      assignmentId: assignment.id,
      title: template.title,
      date: taskDate,
      duration: template.duration,
      category: template.category,
      icon: template.icon,
      completed: false
    };
  });

  // Bulk create tasks
  await prisma.task.createMany({
    data: tasks
  });

  return tasks;
}

module.exports = { generateTasks };
