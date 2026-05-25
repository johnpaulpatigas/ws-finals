const prisma = require('../db');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Generates a series of micro-tasks for a given assignment.
 * It attempts to use Gemini AI for smart breakdown, 
 * falling back to a rule-based approach if AI is unavailable.
 */
async function generateTasks(assignment) {
  const apiKey = process.env.GEMINI_API_KEY;
  let tasks = [];

  if (apiKey) {
    try {
      tasks = await generateWithAI(assignment, apiKey);
    } catch (error) {
      console.error('AI Task Generation failed, falling back to rule-based:', error);
      tasks = generateWithRules(assignment);
    }
  } else {
    tasks = generateWithRules(assignment);
  }

  // Bulk create tasks
  await prisma.task.createMany({
    data: tasks.map(t => ({
      ...t,
      assignmentId: assignment.id,
      completed: false
    }))
  });

  return tasks;
}

async function generateWithAI(assignment, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Break down the following assignment into 5-8 specific, actionable micro-tasks.
    Assignment Title: "${assignment.title}"
    Current Date: ${new Date().toDateString()}
    Target Due Date: ${new Date(assignment.dueDate).toDateString()}
    The user works ${assignment.workingDays || 5} days per week.

    Guidelines:
    - Each task should take 15-60 minutes.
    - Be extremely specific (e.g., "Find 3 primary sources" instead of "Research").
    - Assign a "phase" (0.1 to 0.9) representing the relative position in the project timeline.
    
    Return the response as a valid JSON array of objects. Each object must have:
    - title: (string) Specific task name
    - category: (string) One of: Planning, Research, Analysis, Drafting, Writing, Review
    - icon: (string) A relevant Material Icon name (e.g., edit, search, book, menu_book, draw, rate_review)
    - duration: (string) Estimated time (e.g., "30 mins", "1 hour")
    - phase: (number) 0.1 to 0.9

    JSON only, no markdown:
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Clean potential markdown code blocks
  const cleanJson = text.replace(/```json|```/g, '').trim();
  const aiTasks = JSON.parse(cleanJson);

  return scheduleTasks(aiTasks, assignment);
}

function scheduleTasks(tasks, assignment) {
  const startDate = new Date();
  const endDate = new Date(assignment.dueDate);
  const workingDaysPerWeek = assignment.workingDays || 5;

  return tasks.map(task => {
    // 1. Calculate ideal date based on phase (percentage between start and end)
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let taskDate = new Date(startDate);
    const daysToAdd = Math.floor(diffDays * (task.phase || 0.5));
    taskDate.setDate(startDate.getDate() + daysToAdd);

    // 2. Adjust for weekends (always skip Sat/Sun if workingDays <= 5)
    // If workingDays is 6, we skip only Sunday. If 7, we skip nothing.
    let dayOfWeek = taskDate.getDay(); // 0 = Sun, 6 = Sat
    
    if (workingDaysPerWeek <= 5) {
      if (dayOfWeek === 0) taskDate.setDate(taskDate.getDate() + 1); // Sun -> Mon
      else if (dayOfWeek === 6) taskDate.setDate(taskDate.getDate() + 2); // Sat -> Mon
    } else if (workingDaysPerWeek === 6) {
      if (dayOfWeek === 0) taskDate.setDate(taskDate.getDate() + 1); // Sun -> Mon
    }

    // Ensure we don't exceed the due date
    if (taskDate > endDate) taskDate = new Date(endDate);

    return {
      title: task.title,
      category: task.category,
      icon: task.icon,
      duration: task.duration,
      date: taskDate
    };
  });
}

function generateWithRules(assignment) {
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

  return scheduleTasks(taskTemplates, assignment);
}

module.exports = { generateTasks };
