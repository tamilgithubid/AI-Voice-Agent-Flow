const logger = require('../utils/logger');

// In-memory store (replace with database in production)
const resumeStore = new Map();

// Seed some sample data
resumeStore.set('user-1', {
  userId: 'user-1',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1-555-0100',
  summary: 'Software engineer with 5 years of experience in web development.',
  experience: [
    {
      company: 'Tech Corp',
      role: 'Senior Developer',
      duration: '2021 - Present',
      description: 'Led a team of 5 engineers building microservices architecture.',
      highlights: ['Reduced API latency by 40%', 'Mentored 3 junior developers'],
    },
    {
      company: 'StartupXYZ',
      role: 'Full Stack Developer',
      duration: '2019 - 2021',
      description: 'Built and maintained e-commerce platform.',
      highlights: ['Increased conversion rate by 15%', 'Implemented CI/CD pipeline'],
    },
  ],
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
  education: [
    {
      institution: 'State University',
      degree: 'B.S. Computer Science',
      year: '2019',
    },
  ],
  updatedAt: new Date().toISOString(),
});

// Tool: Get Resume
async function get_resume({ userId }) {
  logger.info(`Tool: get_resume called for user ${userId}`);

  const resume = resumeStore.get(userId);
  if (!resume) {
    return {
      success: false,
      error: 'Resume not found',
      message: `No resume found for user ${userId}. Would you like to create one?`,
    };
  }

  return { success: true, data: resume };
}

// Tool: Analyze Resume
async function analyze_resume({ resumeData, focusAreas }) {
  logger.info('Tool: analyze_resume called');

  const analysis = {
    overallScore: 0,
    sections: {},
    atsCompatibility: {},
    suggestions: [],
  };

  // Score summary section
  if (resumeData.summary) {
    const summaryLength = resumeData.summary.split(' ').length;
    const summaryScore = summaryLength >= 20 && summaryLength <= 50 ? 85 : summaryLength < 20 ? 50 : 60;
    analysis.sections.summary = {
      score: summaryScore,
      feedback:
        summaryScore >= 80
          ? 'Good summary length and content.'
          : 'Consider making your summary 20-50 words for optimal impact.',
    };
  } else {
    analysis.sections.summary = { score: 0, feedback: 'Missing professional summary. This is critical for ATS.' };
    analysis.suggestions.push('Add a professional summary (2-3 sentences).');
  }

  // Score experience
  if (resumeData.experience && resumeData.experience.length > 0) {
    const hasHighlights = resumeData.experience.every((e) => e.highlights && e.highlights.length > 0);
    const hasQuantified = resumeData.experience.some((e) =>
      e.highlights?.some((h) => /\d+%?/.test(h))
    );
    let expScore = 60;
    if (hasHighlights) expScore += 15;
    if (hasQuantified) expScore += 15;
    analysis.sections.experience = {
      score: expScore,
      feedback: hasQuantified
        ? 'Good use of quantified achievements.'
        : 'Add quantified achievements (e.g., "Increased sales by 25%").',
    };
  } else {
    analysis.sections.experience = { score: 0, feedback: 'No experience listed.' };
    analysis.suggestions.push('Add work experience with quantified achievements.');
  }

  // Score skills
  if (resumeData.skills && resumeData.skills.length > 0) {
    const skillScore = resumeData.skills.length >= 6 ? 85 : resumeData.skills.length >= 3 ? 70 : 50;
    analysis.sections.skills = {
      score: skillScore,
      feedback: `${resumeData.skills.length} skills listed. ${skillScore >= 80 ? 'Good variety.' : 'Consider adding more relevant skills.'}`,
    };
  } else {
    analysis.sections.skills = { score: 0, feedback: 'No skills listed.' };
    analysis.suggestions.push('Add a skills section with 6-10 relevant skills.');
  }

  // Score education
  if (resumeData.education && resumeData.education.length > 0) {
    analysis.sections.education = { score: 80, feedback: 'Education section is present.' };
  } else {
    analysis.sections.education = { score: 30, feedback: 'Consider adding education background.' };
  }

  // ATS compatibility
  analysis.atsCompatibility = {
    score: resumeData.email && resumeData.phone ? 80 : 50,
    issues: [],
  };
  if (!resumeData.email) analysis.atsCompatibility.issues.push('Missing email address');
  if (!resumeData.phone) analysis.atsCompatibility.issues.push('Missing phone number');
  if (!resumeData.summary) analysis.atsCompatibility.issues.push('Missing summary/objective');

  // Calculate overall score
  const sectionScores = Object.values(analysis.sections).map((s) => s.score);
  analysis.overallScore = Math.round(
    sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length
  );

  return { success: true, data: analysis };
}

// Tool: Improve Resume
async function improve_resume({ resumeData, section, targetRole }) {
  logger.info(`Tool: improve_resume called for section: ${section}`);

  const improvements = {
    section,
    targetRole: targetRole || 'general',
    suggestions: [],
    rewrittenContent: null,
  };

  switch (section.toLowerCase()) {
    case 'summary':
      improvements.suggestions = [
        'Start with your years of experience and primary expertise',
        'Include 2-3 key achievements or specializations',
        'Mention the target role or industry',
        'Keep it between 2-4 sentences',
      ];
      improvements.rewrittenContent = targetRole
        ? `Results-driven ${targetRole} with ${resumeData.experience?.length || 'several'} years of progressive experience. Proven track record in delivering high-impact solutions and driving team performance. Seeking to leverage expertise in a challenging ${targetRole} position.`
        : `Experienced professional with a strong background in ${resumeData.skills?.slice(0, 3).join(', ') || 'technology'}. Demonstrated ability to deliver results and collaborate effectively across teams.`;
      break;

    case 'experience':
      improvements.suggestions = [
        'Use action verbs to start each bullet point (Led, Developed, Implemented)',
        'Quantify achievements with numbers and percentages',
        'Focus on impact and results, not just responsibilities',
        'Tailor bullet points to match target job requirements',
        'Include 3-5 bullet points per role',
      ];
      break;

    case 'skills':
      improvements.suggestions = [
        'Group skills by category (Languages, Frameworks, Tools)',
        'List most relevant skills first',
        'Include both technical and soft skills',
        'Match skills to common job description keywords',
      ];
      if (targetRole) {
        improvements.additionalSkills = [
          'Project Management',
          'Agile/Scrum',
          'System Design',
          'Technical Documentation',
        ];
      }
      break;

    default:
      improvements.suggestions = [
        `Review the ${section} section for clarity and relevance`,
        'Ensure consistent formatting throughout',
        'Remove outdated or irrelevant information',
      ];
  }

  return { success: true, data: improvements };
}

// Tool: Save Resume
async function save_resume({ userId, resumeData }) {
  logger.info(`Tool: save_resume called for user ${userId}`);

  const existing = resumeStore.get(userId) || {};
  const updated = {
    ...existing,
    ...resumeData,
    userId,
    updatedAt: new Date().toISOString(),
  };

  resumeStore.set(userId, updated);

  return {
    success: true,
    message: 'Resume saved successfully',
    data: { userId, updatedAt: updated.updatedAt },
  };
}

module.exports = {
  get_resume,
  analyze_resume,
  improve_resume,
  save_resume,
};
