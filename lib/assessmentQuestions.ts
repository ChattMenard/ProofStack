// Assessment Question Bank
// Centralized repository of all skill assessment questions

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation?: string
}

export interface AssessmentQuiz {
  title: string
  targetLevel: 'junior' | 'mid' | 'senior' | 'lead'
  type: 'technical_quiz' | 'coding_challenge' | 'portfolio_review' | 'project_complexity'
  durationMinutes: number
  passingScore: number
  questions: QuizQuestion[]
}

export const assessmentQuestions: Record<string, AssessmentQuiz> = {
  // ========== JUNIOR LEVEL ==========
  'junior-quiz-1': {
    title: 'JavaScript Fundamentals',
    targetLevel: 'junior',
    type: 'technical_quiz',
    durationMinutes: 20,
    passingScore: 70,
    questions: [
      {
        question: 'What is the output of: typeof null?',
        options: ['null', 'object', 'undefined', 'number'],
        correctAnswer: 1,
        explanation: 'typeof null returns "object" - this is a known JavaScript quirk'
      },
      {
        question: 'Which method is used to add an element to the end of an array?',
        options: ['unshift()', 'push()', 'pop()', 'shift()'],
        correctAnswer: 1,
        explanation: 'push() adds elements to the end, unshift() adds to the beginning'
      },
      {
        question: 'What does "use strict" do in JavaScript?',
        options: [
          'Enables stricter parsing and error handling',
          'Makes code run faster',
          'Prevents all errors',
          'Enables ES6 features'
        ],
        correctAnswer: 0
      },
      {
        question: 'How do you declare a constant variable?',
        options: ['var x = 5', 'let x = 5', 'const x = 5', 'constant x = 5'],
        correctAnswer: 2
      },
      {
        question: 'What is a closure in JavaScript?',
        options: [
          'A function that returns another function',
          'A function with access to its outer scope',
          'A way to close browser windows',
          'A loop structure'
        ],
        correctAnswer: 1
      },
      {
        question: 'Which is the correct way to create a function in JavaScript?',
        options: [
          'function = myFunc() {}',
          'function myFunc() {}',
          'def myFunc() {}',
          'func myFunc() {}'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the difference between == and ===?',
        options: [
          'No difference',
          '=== checks type and value, == only checks value',
          '== is faster',
          '=== is deprecated'
        ],
        correctAnswer: 1
      },
      {
        question: 'How do you write a comment in JavaScript?',
        options: ['# comment', '<!-- comment -->', '// comment', '/* comment'],
        correctAnswer: 2
      },
      {
        question: 'What is an array in JavaScript?',
        options: [
          'A function',
          'An ordered list of values',
          'A type of loop',
          'A database'
        ],
        correctAnswer: 1
      },
      {
        question: 'Which keyword is used to check if a property exists in an object?',
        options: ['in', 'has', 'exists', 'contains'],
        correctAnswer: 0
      }
    ]
  },

  'junior-code-1': {
    title: 'Array Manipulation',
    targetLevel: 'junior',
    type: 'coding_challenge',
    durationMinutes: 30,
    passingScore: 70,
    questions: [
      {
        question: 'What does the Array.map() method do?',
        options: [
          'Filters array elements',
          'Creates a new array with transformed elements',
          'Finds a single element',
          'Sorts the array'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the output of: [1, 2, 3].filter(x => x > 1)?',
        options: ['[1]', '[2, 3]', '[1, 2, 3]', 'undefined'],
        correctAnswer: 1
      },
      {
        question: 'How do you combine two arrays in JavaScript?',
        options: [
          'arr1.concat(arr2)',
          'arr1 + arr2',
          'arr1.merge(arr2)',
          'arr1.join(arr2)'
        ],
        correctAnswer: 0
      },
      {
        question: 'What does Array.reduce() do?',
        options: [
          'Removes elements from an array',
          'Reduces array size',
          'Accumulates array values into a single value',
          'Filters duplicates'
        ],
        correctAnswer: 2
      },
      {
        question: 'Which method removes the last element from an array?',
        options: ['shift()', 'pop()', 'remove()', 'delete()'],
        correctAnswer: 1
      }
    ]
  },

  // ========== MID LEVEL ==========
  'mid-quiz-1': {
    title: 'React & State Management',
    targetLevel: 'mid',
    type: 'technical_quiz',
    durationMinutes: 30,
    passingScore: 75,
    questions: [
      {
        question: 'What is the purpose of useEffect in React?',
        options: [
          'To manage component state',
          'To handle side effects and lifecycle events',
          'To create components',
          'To style components'
        ],
        correctAnswer: 1
      },
      {
        question: 'When does React re-render a component?',
        options: [
          'Every second',
          'When state or props change',
          'Only on page load',
          'When you refresh the browser'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the difference between state and props?',
        options: [
          'No difference',
          'State is mutable, props are immutable',
          'Props are faster',
          'State is deprecated'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the Virtual DOM?',
        options: [
          'A real DOM element',
          'A JavaScript representation of the DOM',
          'A database',
          'A CSS framework'
        ],
        correctAnswer: 1
      },
      {
        question: 'Which hook would you use to store data that persists across renders?',
        options: ['useState', 'useEffect', 'useRef', 'useMemo'],
        correctAnswer: 2
      },
      {
        question: 'What is prop drilling?',
        options: [
          'A React performance optimization',
          'Passing props through multiple nested components',
          'A debugging technique',
          'A component lifecycle method'
        ],
        correctAnswer: 1
      },
      {
        question: 'What does useMemo do?',
        options: [
          'Manages component state',
          'Memoizes expensive computations',
          'Creates side effects',
          'Handles async operations'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is Context API used for?',
        options: [
          'Styling components',
          'Global state management',
          'Routing',
          'API calls'
        ],
        correctAnswer: 1
      }
    ]
  },

  'mid-code-1': {
    title: 'API Design',
    targetLevel: 'mid',
    type: 'coding_challenge',
    durationMinutes: 45,
    passingScore: 75,
    questions: [
      {
        question: 'What HTTP status code indicates a successful POST request?',
        options: ['200 OK', '201 Created', '204 No Content', '301 Moved'],
        correctAnswer: 1
      },
      {
        question: 'What is REST?',
        options: [
          'A database',
          'An architectural style for APIs',
          'A programming language',
          'A testing framework'
        ],
        correctAnswer: 1
      },
      {
        question: 'Which HTTP method is idempotent?',
        options: ['POST', 'GET', 'PATCH', 'All of the above'],
        correctAnswer: 1,
        explanation: 'GET, PUT, DELETE are idempotent; POST is not'
      },
      {
        question: 'What is CORS?',
        options: [
          'A database type',
          'Cross-Origin Resource Sharing - security feature',
          'A CSS framework',
          'A routing library'
        ],
        correctAnswer: 1
      },
      {
        question: 'What status code should you return for "Not Found"?',
        options: ['400', '401', '404', '500'],
        correctAnswer: 2
      },
      {
        question: 'What is the purpose of API versioning?',
        options: [
          'Speed optimization',
          'Maintain backward compatibility',
          'Security',
          'No purpose'
        ],
        correctAnswer: 1
      }
    ]
  },

  // ========== SENIOR LEVEL ==========
  'senior-quiz-1': {
    title: 'System Design',
    targetLevel: 'senior',
    type: 'technical_quiz',
    durationMinutes: 45,
    passingScore: 80,
    questions: [
      {
        question: 'What is horizontal scaling?',
        options: [
          'Adding more power to existing servers',
          'Adding more servers to distribute load',
          'Reducing server count',
          'Using faster CPUs'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the CAP theorem?',
        options: [
          'A deployment strategy',
          'Consistency, Availability, Partition tolerance - pick 2',
          'A testing methodology',
          'A security framework'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is eventual consistency?',
        options: [
          'Data is always consistent',
          'Data becomes consistent over time',
          'Data is never consistent',
          'Consistency is optional'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is a load balancer?',
        options: [
          'A database tool',
          'Distributes traffic across multiple servers',
          'A caching layer',
          'A security firewall'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is database sharding?',
        options: [
          'Deleting old data',
          'Partitioning data across multiple databases',
          'Encrypting data',
          'Backing up data'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is a CDN?',
        options: [
          'A database',
          'Content Delivery Network - distributed servers for static assets',
          'A programming language',
          'A security protocol'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the purpose of caching?',
        options: [
          'Security',
          'Improve performance by storing frequently accessed data',
          'Data backup',
          'No real purpose'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is a microservice architecture?',
        options: [
          'Very small servers',
          'Independent, loosely coupled services',
          'A monolithic app',
          'A database design pattern'
        ],
        correctAnswer: 1
      }
    ]
  },

  'senior-code-1': {
    title: 'Complex Algorithms',
    targetLevel: 'senior',
    type: 'coding_challenge',
    durationMinutes: 60,
    passingScore: 80,
    questions: [
      {
        question: 'What is the time complexity of binary search?',
        options: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'],
        correctAnswer: 1
      },
      {
        question: 'What data structure uses LIFO (Last In, First Out)?',
        options: ['Queue', 'Stack', 'Array', 'Hash Table'],
        correctAnswer: 1
      },
      {
        question: 'What is a hash collision?',
        options: [
          'A security breach',
          'Two keys mapping to the same hash value',
          'A database error',
          'A network issue'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is memoization?',
        options: [
          'Memory management',
          'Caching function results to avoid recomputation',
          'Data encryption',
          'Error handling'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the space complexity of mergesort?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        correctAnswer: 2
      }
    ]
  },

  // ========== LEAD LEVEL ==========
  'lead-quiz-1': {
    title: 'Engineering Leadership',
    targetLevel: 'lead',
    type: 'technical_quiz',
    durationMinutes: 45,
    passingScore: 85,
    questions: [
      {
        question: 'What is technical debt?',
        options: [
          'Money owed to contractors',
          'Cost of maintaining suboptimal code decisions',
          'Cloud computing costs',
          'Team salaries'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the purpose of a postmortem?',
        options: [
          'Blame individuals',
          'Learn from incidents and prevent recurrence',
          'Fire underperformers',
          'Celebrate successes'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is Agile development?',
        options: [
          'Writing code fast',
          'Iterative development with frequent feedback',
          'Working long hours',
          'A programming language'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is the role of a tech lead?',
        options: [
          'Only write code',
          'Guide technical decisions and mentor team',
          'Manage budgets',
          'Handle HR issues'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is pair programming?',
        options: [
          'Two people on separate tasks',
          'Two developers collaborating on same code',
          'Code review process',
          'A testing methodology'
        ],
        correctAnswer: 1
      },
      {
        question: 'What is continuous integration (CI)?',
        options: [
          'Manual deployments',
          'Automatically testing code changes frequently',
          'A project management tool',
          'A database strategy'
        ],
        correctAnswer: 1
      },
      {
        question: 'How do you handle a disagreement between senior engineers?',
        options: [
          'Pick the loudest voice',
          'Facilitate discussion, data-driven decision',
          'Flip a coin',
          'Ignore it'
        ],
        correctAnswer: 1
      }
    ]
  }
}
