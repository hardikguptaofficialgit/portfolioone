import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const portfolioPath = path.join(root, 'content', 'portfolio.json');
if (!fs.existsSync(portfolioPath)) {
  console.error('content/portfolio.json not found. Content is already split under content/*.json');
  process.exit(1);
}
const portfolio = JSON.parse(fs.readFileSync(portfolioPath, 'utf8'));

const write = (name, data) => {
  fs.writeFileSync(path.join(root, 'content', name), JSON.stringify(data, null, 2) + '\n', 'utf8');
};

write('site.json', {
  version: portfolio.version,
  profile: portfolio.profile,
  socialLinks: portfolio.socialLinks,
  sections: portfolio.sections,
  education: portfolio.education,
  achievements: portfolio.achievements,
  certifications: portfolio.certifications,
});

write('skills.json', {
  skillCategories: portfolio.skillCategories,
  skillsFlat: portfolio.skillsFlat,
});

write('projects.json', { projects: portfolio.projects });
write('experience.json', {
  experience: portfolio.experience,
  simplifiedExperience: portfolio.simplifiedExperience ?? [],
});
write('blogs.json', { blogPosts: portfolio.blogPosts ?? [] });
write('photos.json', { photoEvents: portfolio.photoEvents ?? [] });

console.log('Split content/portfolio.json into site, skills, projects, experience, blogs, photos.');
