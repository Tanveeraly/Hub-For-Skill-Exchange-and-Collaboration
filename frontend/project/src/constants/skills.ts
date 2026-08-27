export interface SkillCategory {
    name: string;
    skills: string[];
}

export const SKILL_CATEGORIES: SkillCategory[] = [
    {
        name: "Technology & Software",
        skills: [
            "JavaScript", "TypeScript", "React", "Node.js", "Python", "Java", "C++", "C#",
            "Ruby on Rails", "PHP", "Laravel", "Swift", "Kotlin", "Go", "Rust", "SQL",
            "MongoDB", "PostgreSQL", "MySQL", "Redis", "Docker", "Kubernetes", "AWS",
            "Azure", "Google Cloud", "Git", "REST API", "GraphQL", "Redux", "TailwindCSS",
            "Bootstrap", "Material-UI", "Next.js", "Vue.js", "Angular", "Svelte", "Flutter",
            "React Native", "Machine Learning", "Deep Learning", "Data Analysis",
            "Cybersecurity", "Blockchain", "DevOps", "CI/CD", "Testing (Jest/Selenium)",
            "Web3", "Terraform", "Ansible", "Cloud Computing"
        ]
    },
    {
        name: "Design & Creative",
        skills: [
            "Graphic Design", "UI/UX Design", "Figma", "Adobe Photoshop", "Adobe Illustrator",
            "Adobe After Effects", "Adobe Premiere Pro", "3D Modeling (Blender)",
            "Motion Graphics", "Typography", "Branding", "User Research", "Prototyping",
            "Video Editing", "Photography", "Digital Illustration", "Web Design",
            "Product Design", "Design Systems"
        ]
    },
    {
        name: "Business & Management",
        skills: [
            "Project Management", "Product Management", "Agile/Scrum", "Business Analysis",
            "Digital Marketing", "SEO", "Content Strategy", "Sales", "Entrepreneurship",
            "Finances", "Public Speaking", "Lead Generation", "Market Research",
            "Strategic Planning", "Customer Success", "Human Resources"
        ]
    },
    {
        name: "Writing & Communication",
        skills: [
            "Technical Writing", "Copywriting", "Content Writing", "Blogging",
            "Creative Writing", "Editing & Proofreading", "Social Media Management",
            "Email Marketing", "Public Relations", "Translation", "Transcription"
        ]
    },
    {
        name: "Education & Science",
        skills: [
            "Tutoring", "Curriculum Development", "Instructional Design", "Data Science",
            "Statistics", "Mathematis", "Physics", "Chemistry", "Biology", "Research Methods",
            "Public Health", "Economics", "Psychology"
        ]
    },
    {
        name: "Languages",
        skills: [
            "English", "Spanish", "French", "German", "Mandarin", "Japanese", "Arabic",
            "Hindi", "Portuguese", "Russian", "Italian", "Urdu", "Korean"
        ]
    },
    {
        name: "Lifestyle & Music",
        skills: [
            "Cooking", "Photography", "Yoga", "Fitness Training", "Music Production",
            "Guitar", "Piano", "Audio Engineering", "Singing", "Dance", "Meditation",
            "Personal Styling", "Gardening"
        ]
    }
];

export const ALL_SKILLS = SKILL_CATEGORIES.flatMap(c => c.skills);
