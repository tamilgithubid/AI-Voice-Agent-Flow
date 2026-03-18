const { get_resume, analyze_resume, improve_resume, save_resume } = require('../src/services/tools');

describe('Resume Tools', () => {
  describe('get_resume', () => {
    it('should return seeded resume for user-1', async () => {
      const result = await get_resume({ userId: 'user-1' });
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('John Doe');
      expect(result.data.skills).toContain('JavaScript');
    });

    it('should return error for non-existent user', async () => {
      const result = await get_resume({ userId: 'non-existent' });
      expect(result.success).toBe(false);
      expect(result.error).toBe('Resume not found');
    });
  });

  describe('analyze_resume', () => {
    const sampleResume = {
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+1-555-0200',
      summary: 'Experienced software engineer with expertise in cloud architecture and distributed systems with over 8 years of professional experience.',
      experience: [
        {
          company: 'BigCo',
          role: 'Staff Engineer',
          duration: '2020 - Present',
          description: 'Lead architect for platform services',
          highlights: ['Reduced infrastructure costs by 35%', 'Led migration of 50+ microservices'],
        },
      ],
      skills: ['Go', 'Kubernetes', 'AWS', 'Terraform', 'Python', 'PostgreSQL'],
      education: [{ institution: 'MIT', degree: 'M.S. Computer Science', year: '2016' }],
    };

    it('should analyze a complete resume', async () => {
      const result = await analyze_resume({ resumeData: sampleResume });
      expect(result.success).toBe(true);
      expect(result.data.overallScore).toBeGreaterThan(0);
      expect(result.data.sections).toHaveProperty('summary');
      expect(result.data.sections).toHaveProperty('experience');
      expect(result.data.sections).toHaveProperty('skills');
      expect(result.data.atsCompatibility.score).toBe(80);
    });

    it('should flag missing sections', async () => {
      const result = await analyze_resume({ resumeData: { name: 'Empty Resume' } });
      expect(result.success).toBe(true);
      expect(result.data.sections.summary.score).toBe(0);
      expect(result.data.suggestions.length).toBeGreaterThan(0);
    });

    it('should detect missing contact info for ATS', async () => {
      const result = await analyze_resume({ resumeData: { name: 'No Contact' } });
      expect(result.data.atsCompatibility.issues).toContain('Missing email address');
      expect(result.data.atsCompatibility.issues).toContain('Missing phone number');
    });
  });

  describe('improve_resume', () => {
    const sampleResume = {
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: [{ company: 'Co', role: 'Dev', duration: '2020-2023' }],
    };

    it('should suggest summary improvements', async () => {
      const result = await improve_resume({ resumeData: sampleResume, section: 'summary' });
      expect(result.success).toBe(true);
      expect(result.data.suggestions.length).toBeGreaterThan(0);
      expect(result.data.rewrittenContent).toBeTruthy();
    });

    it('should suggest experience improvements', async () => {
      const result = await improve_resume({ resumeData: sampleResume, section: 'experience' });
      expect(result.success).toBe(true);
      expect(result.data.suggestions).toContainEqual(expect.stringContaining('action verbs'));
    });

    it('should tailor suggestions to target role', async () => {
      const result = await improve_resume({
        resumeData: sampleResume,
        section: 'summary',
        targetRole: 'Senior Frontend Engineer',
      });
      expect(result.data.rewrittenContent).toContain('Senior Frontend Engineer');
    });
  });

  describe('save_resume', () => {
    it('should save a new resume', async () => {
      const result = await save_resume({
        userId: 'test-user',
        resumeData: { name: 'Test User', skills: ['Testing'] },
      });
      expect(result.success).toBe(true);
      expect(result.data.userId).toBe('test-user');

      // Verify it was saved
      const fetched = await get_resume({ userId: 'test-user' });
      expect(fetched.success).toBe(true);
      expect(fetched.data.name).toBe('Test User');
    });

    it('should update an existing resume', async () => {
      await save_resume({ userId: 'update-user', resumeData: { name: 'Original' } });
      await save_resume({ userId: 'update-user', resumeData: { name: 'Updated', skills: ['New'] } });
      const fetched = await get_resume({ userId: 'update-user' });
      expect(fetched.data.name).toBe('Updated');
      expect(fetched.data.skills).toContain('New');
    });
  });
});
