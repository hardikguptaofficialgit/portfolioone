export interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  link?: string
  year: number
}

export interface Experience {
  id: string
  title: string
  company: string
  duration: string
  description: string
  technologies: string[]
}

export const PORTFOLIO_DATA = {
  about: {
    name: "Portfolio",
    bio: "Creative developer passionate about building exceptional digital experiences. Combining design thinking with robust engineering to create products that delight users.",
    tagline: "Crafting interfaces that work beautifully.",
  },
  experience: [
    {
      id: "exp-1",
      title: "Senior Designer",
      company: "Creative Studio",
      duration: "2022 - Present",
      description:
        "Leading design initiatives and mentoring junior designers on modern design systems and accessibility.",
      technologies: ["Figma", "React", "TypeScript"],
    },
    {
      id: "exp-2",
      title: "Product Designer",
      company: "Tech Company",
      duration: "2020 - 2022",
      description:
        "Designed user interfaces for web and mobile applications, focusing on user research and usability testing.",
      technologies: ["UI/UX", "Prototyping", "User Research"],
    },
    {
      id: "exp-3",
      title: "Frontend Developer",
      company: "Startup",
      duration: "2018 - 2020",
      description: "Built responsive web applications and implemented component libraries from scratch.",
      technologies: ["React", "Next.js", "Tailwind CSS"],
    },
  ] as Experience[],
  projects: [
    {
      id: "proj-1",
      title: "Design System",
      description: "Comprehensive component library with 100+ reusable components and documentation.",
      tags: ["React", "TypeScript", "Storybook"],
      year: 2024,
      link: "#",
    },
    {
      id: "proj-2",
      title: "AI Dashboard",
      description: "Real-time analytics platform with interactive visualizations and ML insights.",
      tags: ["Next.js", "D3.js", "AI/ML"],
      year: 2024,
      link: "#",
    },
    {
      id: "proj-3",
      title: "Mobile App",
      description: "Native iOS and Android app with 100k+ downloads and 4.8 star rating.",
      tags: ["React Native", "Firebase", "Mobile"],
      year: 2023,
      link: "#",
    },
    {
      id: "proj-4",
      title: "E-commerce Platform",
      description: "Full-stack marketplace with payments, reviews, and seller dashboard.",
      tags: ["Next.js", "Stripe", "PostgreSQL"],
      year: 2023,
      link: "#",
    },
  ] as Project[],
  links: [
    { name: "GitHub", url: "#", icon: "🐙" },
    { name: "LinkedIn", url: "#", icon: "💼" },
    { name: "Twitter", url: "#", icon: "𝕏" },
    { name: "Email", url: "mailto:hello@example.com", icon: "✉️" },
  ],
  acknowledgments: [
    "Design inspiration from modern OS interfaces",
    "Built with React, Next.js, and TypeScript",
    "Styling powered by Tailwind CSS",
    "State management with Zustand",
    "Icons from Lucide React",
  ],
}
