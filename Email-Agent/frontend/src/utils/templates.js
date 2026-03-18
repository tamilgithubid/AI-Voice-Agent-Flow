// Message Templates for quick sends

const TEMPLATES = {
  'running late': {
    whatsapp: "Hey! I'm running a few minutes late. Will be there shortly!",
    email: {
      subject: 'Running Late',
      body: "Hi,\n\nI wanted to let you know that I'm running a few minutes behind schedule. I'll be there shortly.\n\nApologies for any inconvenience.\n\nBest regards",
    },
  },
  'leave request': {
    whatsapp: "Hi, I'd like to request leave for tomorrow. I'll make sure all pending work is covered.",
    email: {
      subject: 'Leave Request',
      body: "Dear Manager,\n\nI am writing to request a leave of absence for tomorrow due to personal reasons. I have ensured that all my pending tasks are up to date and have arranged for coverage during my absence.\n\nPlease let me know if you need any further information.\n\nThank you for your understanding.\n\nBest regards",
    },
  },
  'meeting reminder': {
    whatsapp: "Hi! Just a friendly reminder about our meeting today. Looking forward to it!",
    email: {
      subject: 'Meeting Reminder',
      body: "Dear Team,\n\nThis is a gentle reminder about our meeting scheduled for today. Please ensure you have reviewed the agenda and come prepared with any relevant updates.\n\nLooking forward to a productive discussion.\n\nBest regards",
    },
  },
  'thank you': {
    whatsapp: "Thank you so much! I really appreciate your help.",
    email: {
      subject: 'Thank You',
      body: "Dear [Name],\n\nI wanted to take a moment to express my sincere gratitude for your help and support. Your assistance has been invaluable and greatly appreciated.\n\nThank you once again.\n\nWarm regards",
    },
  },
  'follow up': {
    whatsapp: "Hi! Just following up on our earlier conversation. Any updates?",
    email: {
      subject: 'Follow Up',
      body: "Dear [Name],\n\nI hope this email finds you well. I wanted to follow up on our recent conversation regarding the discussed matter.\n\nI would appreciate any updates you might have at your earliest convenience.\n\nThank you for your time.\n\nBest regards",
    },
  },
  'sick leave': {
    whatsapp: "Hi, I'm not feeling well today and won't be able to come in. Will keep you updated.",
    email: {
      subject: 'Sick Leave Notification',
      body: "Dear Manager,\n\nI am writing to inform you that I am feeling unwell and will not be able to come to work today. I will keep you updated on my condition and plan to resume work as soon as possible.\n\nI apologize for any inconvenience caused.\n\nBest regards",
    },
  },
};

export function findTemplate(query) {
  const q = query.toLowerCase().trim();

  // Exact match
  if (TEMPLATES[q]) return { name: q, ...TEMPLATES[q] };

  // Partial match
  for (const [name, template] of Object.entries(TEMPLATES)) {
    if (q.includes(name) || name.includes(q)) {
      return { name, ...template };
    }
  }

  return null;
}

export function getTemplateNames() {
  return Object.keys(TEMPLATES);
}

export function getTemplate(name) {
  return TEMPLATES[name] || null;
}
