
export const mockUser = {
  name: "Alex Chen",
  role: "Computer Science Student",
  university: "Stanford University",
  avatar: "https://i.pravatar.cc/150?u=alex",
  skills: [
    { name: "React", level: 90, category: "Frontend" },
    { name: "Node.js", level: 85, category: "Backend" },
    { name: "TypeScript", level: 88, category: "Language" },
    { name: "Python", level: 75, category: "Language" },
    { name: "PostgreSQL", level: 70, category: "Database" },
    { name: "AWS", level: 60, category: "Cloud" },
  ],
  experience: [
    {
      role: "Frontend Intern",
      company: "TechStart Inc.",
      duration: "Jun 2024 - Aug 2024",
      description: "Built dashboard components using React and Tailwind."
    }
  ]
};

export const mockJobs = [
  {
    id: 1,
    title: "Junior Frontend Engineer",
    company: "Vercel",
    location: "Remote / San Francisco",
    salary: "$100k - $130k",
    matchScore: 96,
    posted: "2 days ago",
    matchReasons: [
      "Strong React expertise matches requirements",
      "Experience with Next.js ecosystem",
      "TypeScript proficiency"
    ],
    description: "We are looking for a junior engineer who loves building high-performance UIs...",
    logo: "V"
  },
  {
    id: 2,
    title: "Software Engineer New Grad",
    company: "Stripe",
    location: "Seattle, WA",
    salary: "$140k - $170k",
    matchScore: 88,
    posted: "5 days ago",
    matchReasons: [
      "Backend knowledge (Node.js)",
      "Strong algorithmic foundation",
      "Previous internship experience"
    ],
    description: "Join our payments team to build the future of global commerce...",
    logo: "S"
  },
  {
    id: 3,
    title: "Full Stack Developer",
    company: "Linear",
    location: "Remote",
    salary: "$110k - $150k",
    matchScore: 82,
    posted: "1 week ago",
    matchReasons: [
      "Appreciation for craft and design",
      "React & TypeScript skills"
    ],
    description: "Help us build the standard for modern software development...",
    logo: "L"
  }
];

export const mockInterviewPrep = {
  role: "Frontend Engineer",
  company: "Airbnb",
  topics: [
    {
      title: "React Internals",
      description: "Deep dive into Fiber, Reconciliation, and Hooks.",
      importance: "High",
      questions: [
        "Explain the Virtual DOM and how React uses it.",
        "What is the difference between useMemo and useCallback?",
        "How does the useEffect dependency array work?"
      ]
    },
    {
      title: "Web Performance",
      description: "Core Web Vitals, LCP, CLS, and optimization.",
      importance: "High",
      questions: [
        "How would you optimize a slow loading React app?",
        "Explain Critical Rendering Path.",
        "What are different ways to reduce bundle size?"
      ]
    },
    {
      title: "JavaScript Fundamentals",
      description: "Closures, Event Loop, and Async/Await.",
      importance: "Medium",
      questions: [
        "Explain the Event Loop in Node.js vs Browser.",
        "What is a closure? Give a practical example.",
        "Explain Prototypal Inheritance."
      ]
    }
  ]
};
