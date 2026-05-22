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
    Due Date: ${assignment.dueDate}
    
    Return the response as a valid JSON array of objects. Each object must have:
    - title: (string) Specific task name
    - category: (string) One of: Planning, Research, Analysis, Drafting, Writing, Review
    - icon: (string) A relevant Material Icon name (e.g., edit, search, book, done)
    - duration: (string) Estimated time (e.g., "30 mins")
    - phase: (number) A value between 0.1 and 0.9 representing when this should occur in the timeline.

    JSON only, no markdown:
  `;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Clean potential markdown code blocks
  const cleanJson = text.replace(/```json|```/g, '').trim();
  const aiTasks = JSON.parse(cleanJson);

  const startDate = new Date();
  const endDate = new Date(assignment.dueDate);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return aiTasks.map(task => {
    const taskDate = new Date(startDate);
    const daysToAdd = Math.floor(diffDays * (task.phase || 0.5));
    taskDate.setDate(startDate.getDate() + daysToAdd);
    
    if (taskDate > endDate) taskDate.setTime(endDate.getTime());

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
  const startDate = new Date();
  const endDate = new Date(assignment.dueDate);
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
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

  return taskTemplates.map(template => {
    const taskDate = new Date(startDate);
    const daysToAdd = Math.floor(diffDays * template.phase);
    taskDate.setDate(startDate.getDate() + daysToAdd);
    
    if (taskDate > endDate) taskDate.setTime(endDate.getTime());

    return {
      title: template.title,
      date: taskDate,
      duration: template.duration,
      category: template.category,
      icon: template.icon
    };
  });
}

module.exports = { generateTasks };
