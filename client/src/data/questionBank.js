const buildMultipleChoiceQuestions = () => {
  const acronyms = [
    ['CPU', 'Central Processing Unit'],
    ['GPU', 'Graphics Processing Unit'],
    ['RAM', 'Random Access Memory'],
    ['SSD', 'Solid State Drive'],
    ['HTTP', 'HyperText Transfer Protocol'],
    ['HTTPS', 'HyperText Transfer Protocol Secure'],
    ['DNS', 'Domain Name System'],
    ['API', 'Application Programming Interface'],
    ['SQL', 'Structured Query Language'],
    ['JSON', 'JavaScript Object Notation'],
    ['URL', 'Uniform Resource Locator'],
    ['UI', 'User Interface'],
    ['UX', 'User Experience'],
    ['IDE', 'Integrated Development Environment'],
    ['CDN', 'Content Delivery Network'],
    ['VPN', 'Virtual Private Network'],
  ];

  const wrongAcronymAnswers = acronyms.map((entry) => entry[1]);
  const acronymQuestions = acronyms.map(([term, answer], index) => ({
    id: `mc-acronym-${index + 1}`,
    prompt: `What does ${term} stand for?`,
    options: [
      answer,
      ...wrongAcronymAnswers.filter((value) => value !== answer).slice(index % 5, (index % 5) + 3),
    ],
    answer,
  }));

  const roleTasks = [
    ['Frontend Developer', 'Builds interactive user interfaces'],
    ['Backend Developer', 'Implements server-side logic and APIs'],
    ['QA Engineer', 'Tests software quality and reliability'],
    ['DevOps Engineer', 'Automates deployments and infrastructure'],
    ['Product Manager', 'Defines priorities and roadmap'],
    ['UX Designer', 'Designs user journeys and flows'],
    ['Data Analyst', 'Finds insights in data'],
    ['Security Engineer', 'Protects systems from threats'],
    ['Cloud Engineer', 'Runs workloads in cloud platforms'],
    ['SRE', 'Improves reliability and incident response'],
    ['Database Administrator', 'Maintains database performance and backups'],
    ['Mobile Developer', 'Builds applications for mobile devices'],
    ['Game Developer', 'Implements gameplay systems and mechanics'],
    ['Technical Writer', 'Creates clear technical documentation'],
    ['Support Engineer', 'Troubleshoots user and production issues'],
  ];

  const roleQuestions = roleTasks.map(([role, task], index) => ({
    id: `mc-role-${index + 1}`,
    prompt: `Which role most commonly: "${task}"?`,
    options: [
      role,
      roleTasks[(index + 3) % roleTasks.length][0],
      roleTasks[(index + 7) % roleTasks.length][0],
      roleTasks[(index + 11) % roleTasks.length][0],
    ],
    answer: role,
  }));

  const tools = [
    ['Git', 'Version control for source code'],
    ['Figma', 'Interface and design prototyping'],
    ['Postman', 'API request testing and debugging'],
    ['Docker', 'Containerize application environments'],
    ['Jira', 'Track tickets and team tasks'],
    ['Kubernetes', 'Orchestrate container workloads'],
    ['VS Code', 'Edit and navigate code'],
    ['Wireshark', 'Inspect network packets'],
    ['Grafana', 'Visualize metrics dashboards'],
    ['Prometheus', 'Collect and query time-series metrics'],
    ['MongoDB', 'Store flexible document-oriented data'],
    ['Redis', 'Fast in-memory cache and queue'],
    ['Nginx', 'Serve traffic as reverse proxy'],
    ['Jest', 'Run JavaScript unit tests'],
    ['Cypress', 'Run end-to-end browser tests'],
    ['Terraform', 'Provision infrastructure as code'],
    ['Vite', 'Bundle and serve modern frontend apps'],
    ['Webpack', 'Build and optimize frontend assets'],
    ['Notion', 'Capture notes and project docs'],
  ];

  const toolQuestions = tools.map(([tool, purpose], index) => ({
    id: `mc-tool-${index + 1}`,
    prompt: `Which tool is best known to: "${purpose}"?`,
    options: [
      tool,
      tools[(index + 4) % tools.length][0],
      tools[(index + 9) % tools.length][0],
      tools[(index + 13) % tools.length][0],
    ],
    answer: tool,
  }));

  return [...acronymQuestions, ...roleQuestions, ...toolQuestions];
};

const buildTrueFalseQuestions = () => {
  const truths = [
    'A REST API commonly uses HTTP verbs like GET and POST.',
    'Strong passwords should be unique per account.',
    'Caching can reduce response time for repeated requests.',
    'Unit tests help catch regressions early.',
    'A CDN can improve content delivery speed globally.',
    'HTTPS encrypts data in transit.',
    'Indexes can improve database read performance.',
    'Monitoring helps teams detect incidents faster.',
    'Code reviews can improve maintainability and quality.',
    'Environment variables are commonly used for secrets and config.',
    'A pull request is reviewed before merging in many workflows.',
    'Semantic HTML improves accessibility.',
    'Load balancing can distribute traffic across servers.',
    'Rate limiting can help protect APIs from abuse.',
    'Feature flags allow safer gradual rollouts.',
    'Backups are important for recovery after data loss.',
    'Logging should avoid exposing sensitive information.',
    'Database transactions help maintain data consistency.',
    'CI pipelines can run tests automatically on each commit.',
    'Latency and throughput measure different performance characteristics.',
  ];

  const myths = [
    'HTML is a programming language with loops and classes.',
    'CSS is only useful for backend services.',
    'SQL databases cannot scale at all.',
    'Git can only be used by one developer at a time.',
    'Accessibility only matters for mobile apps.',
    'Only large companies need threat modeling.',
    'A firewall replaces the need for secure coding.',
    'Unit tests guarantee a bug-free release.',
    'Cloud services never fail, so backups are unnecessary.',
    'Private repositories do not need code review.',
    'Performance optimization should always happen before features.',
    'You should store plaintext passwords for easier debugging.',
    'A 200 HTTP status code always means correct business logic.',
    'Monitoring dashboards remove the need for alerts.',
    'Version control is optional for solo projects.',
    'All security issues are solved by using HTTPS alone.',
    'Production incidents should be fixed without postmortems.',
    'Frontend code quality does not affect user experience.',
    'Testing in production is always unsafe and never done.',
    'Documentation becomes useless as soon as code changes once.',
  ];

  return [
    ...truths.map((prompt, index) => ({ id: `tf-true-${index + 1}`, prompt, options: ['True', 'False'], answer: 'True' })),
    ...myths.map((prompt, index) => ({ id: `tf-false-${index + 1}`, prompt, options: ['True', 'False'], answer: 'False' })),
  ];
};

const buildSelectAllQuestions = () => {
  const sets = [
    ['programming languages', ['JavaScript', 'Python', 'Java'], ['Photoshop']],
    ['frontend technologies', ['HTML', 'CSS', 'React'], ['PostgreSQL']],
    ['backend concerns', ['authentication', 'database queries', 'API routing'], ['font kerning']],
    ['secure coding practices', ['input validation', 'least privilege', 'dependency updates'], ['hardcoded secrets']],
    ['monitoring signals', ['error rate', 'latency', 'throughput'], ['font size']],
    ['agile ceremonies', ['standup', 'sprint planning', 'retro'], ['file compression']],
    ['database tasks', ['index tuning', 'query optimization', 'backup verification'], ['logo color selection']],
    ['devops activities', ['build pipelines', 'deploy automation', 'infrastructure as code'], ['storyboarding']],
    ['accessibility checks', ['color contrast', 'keyboard navigation', 'screen-reader labels'], ['GPU overclocking']],
    ['API quality checks', ['schema validation', 'status code coverage', 'rate-limit behavior'], ['poster design']],
    ['incident response steps', ['triage', 'containment', 'postmortem'], ['asset sketching']],
    ['code review focus areas', ['readability', 'correctness', 'test coverage'], ['office snacks']],
    ['cloud cost controls', ['right-sizing', 'autoscaling', 'idle resource cleanup'], ['larger avatars']],
    ['browser debugging tools', ['network tab', 'console logs', 'performance profiler'], ['laptop wallpaper']],
    ['quality assurance tasks', ['test case creation', 'bug reproduction', 'regression checks'], ['ad campaign budget']],
    ['data analysis tasks', ['cleaning data', 'building charts', 'finding trends'], ['soldering keyboards']],
    ['system reliability techniques', ['redundancy', 'health checks', 'graceful failover'], ['font pairing']],
    ['release readiness checks', ['rollback plan', 'monitoring setup', 'critical path testing'], ['name the mascot']],
    ['API security controls', ['token expiration', 'scope checks', 'audit logs'], ['transparent buttons']],
    ['team collaboration habits', ['shared docs', 'clear tickets', 'retrospectives'], ['guessing requirements']],
  ];

  return sets.map(([topic, correct, wrong], index) => ({
    id: `sa-${index + 1}`,
    prompt: `Which of these belong to ${topic}?`,
    options: [...correct, ...wrong],
    answer: correct,
  }));
};

const buildOrderStepsQuestions = () => {
  const flows = [
    ['shipping a frontend feature', ['Plan acceptance criteria', 'Implement UI changes', 'Write tests', 'Deploy feature']],
    ['resolving a production incident', ['Acknowledge alert', 'Investigate root cause', 'Apply mitigation', 'Write postmortem']],
    ['building an API endpoint', ['Define request schema', 'Implement handler', 'Add tests', 'Document endpoint']],
    ['setting up a CI pipeline', ['Install dependencies', 'Run linters', 'Run tests', 'Publish build artifact']],
    ['rolling out a database migration', ['Create migration script', 'Test in staging', 'Deploy migration', 'Verify data integrity']],
    ['onboarding a new teammate', ['Share setup guide', 'Pair on first task', 'Review first PR', 'Collect feedback']],
    ['hardening app security', ['Threat-model feature', 'Patch dependencies', 'Add security tests', 'Monitor alerts']],
    ['improving page performance', ['Measure baseline', 'Optimize bottlenecks', 'Re-test metrics', 'Deploy and monitor']],
    ['releasing a mobile app', ['Freeze release branch', 'Run regression suite', 'Submit to store', 'Monitor crash analytics']],
    ['adding analytics tracking', ['Define events', 'Implement instrumentation', 'Validate event payloads', 'Publish dashboard']],
    ['handling user bug reports', ['Reproduce issue', 'Identify cause', 'Implement fix', 'Confirm with reporter']],
    ['launching a new service', ['Provision infrastructure', 'Deploy service', 'Configure monitoring', 'Run smoke tests']],
    ['planning a sprint', ['Review backlog', 'Estimate stories', 'Commit sprint scope', 'Kick off sprint']],
    ['migrating legacy code', ['Audit existing behavior', 'Create refactor plan', 'Migrate in slices', 'Run full regression']],
    ['creating API docs', ['Gather endpoint details', 'Write examples', 'Review for accuracy', 'Publish docs']],
  ];

  return flows.map(([topic, steps], index) => ({
    id: `os-${index + 1}`,
    prompt: `Put the steps of ${topic} in the correct order.`,
    options: [...steps],
    answer: [...steps],
  }));
};

const buildMatchRoleQuestions = () => {
  const bundles = [
    ['Frontend Developer', 'Builds client-side interfaces'],
    ['Backend Developer', 'Handles server logic and APIs'],
    ['QA Engineer', 'Verifies behavior with test cases'],
    ['DevOps Engineer', 'Automates build and deploy workflows'],
    ['Data Analyst', 'Interprets and visualizes data trends'],
    ['Security Engineer', 'Finds and mitigates vulnerabilities'],
    ['Product Manager', 'Aligns roadmap with user value'],
    ['UX Designer', 'Designs usable user journeys'],
    ['Cloud Engineer', 'Operates services in cloud platforms'],
    ['SRE', 'Improves uptime and incident response'],
  ];

  const questions = [];
  for (let i = 0; i < 15; i += 1) {
    const start = i % (bundles.length - 3);
    const selected = bundles.slice(start, start + 4);
    const options = selected.map(([role, task]) => `${role} -> ${task}`);
    questions.push({
      id: `mr-${i + 1}`,
      prompt: 'Select the correct role-to-task matches.',
      options,
      answer: options,
    });
  }

  return questions;
};

const buildScenarioChoiceQuestions = () => {
  const scenarios = [
    ['Users report frequent 500 errors after deployment.', 'Backend Developer', ['Illustrator', 'Accountant', 'Recruiter']],
    ['A checkout page is hard to navigate on mobile.', 'UX Designer', ['Database Admin', 'Lawyer', 'Animator']],
    ['Suspicious login attempts spike overnight.', 'Security Engineer', ['Copywriter', 'Photographer', 'Coach']],
    ['A dashboard query takes 12 seconds to load.', 'Data Engineer', ['Receptionist', 'Painter', 'Sales Lead']],
    ['Builds fail after dependency updates.', 'DevOps Engineer', ['Chef', 'Travel Agent', 'DJ']],
    ['Stakeholders need feature prioritization for next quarter.', 'Product Manager', ['Pilot', 'Mechanic', 'Florist']],
    ['A user cannot complete signup with keyboard navigation.', 'Accessibility Specialist', ['Comedian', 'Baker', 'Plumber']],
    ['The team needs reusable UI components across pages.', 'Frontend Developer', ['Dentist', 'Historian', 'Tailor']],
    ['Crash logs from a mobile release need immediate triage.', 'Mobile Developer', ['Cartographer', 'Actor', 'Chef']],
    ['Critical alerts are noisy and duplicated across services.', 'SRE', ['Biologist', 'Poet', 'Librarian']],
    ['Marketing asks for event tracking on a new landing page.', 'Analytics Engineer', ['Gardener', 'Pilot', 'Cashier']],
    ['Users request exported CSV reports from the admin portal.', 'Backend Developer', ['Photographer', 'Carpenter', 'Bassist']],
    ['A site loads slowly in another region.', 'Cloud Engineer', ['Painter', 'Chemist', 'Counselor']],
    ['A feature works locally but fails in CI.', 'QA Engineer', ['Trainer', 'Nurse', 'Designer']],
    ['A team needs API contracts before frontend starts.', 'Backend Developer', ['Musician', 'Actor', 'Chef']],
    ['The product owner wants evidence of user drop-off points.', 'Data Analyst', ['Diver', 'Electrician', 'Chef']],
    ['You need to prevent accidental mass email sends.', 'Security Engineer', ['Dancer', 'Architect', 'Chef']],
    ['Developers need a safe staged rollout of a new feature.', 'DevOps Engineer', ['Referee', 'Gardener', 'Barista']],
    ['A company needs clear release notes for customers.', 'Technical Writer', ['Juggler', 'Pilot', 'Mason']],
    ['The service should recover automatically from node failures.', 'SRE', ['Bartender', 'Tailor', 'Actor']],
    ['A team needs structured bug triage every day.', 'QA Engineer', ['Singer', 'Chef', 'Broker']],
    ['A dashboard needs visual polish and design consistency.', 'UI Designer', ['Surveyor', 'Mechanic', 'Lawyer']],
    ['A new API needs auth scopes and token expiry rules.', 'Security Engineer', ['Editor', 'Potter', 'Coach']],
    ['A project needs clear sprint objectives and priorities.', 'Product Manager', ['Driver', 'Nurse', 'Linguist']],
    ['An app needs better touch target spacing on tablets.', 'UX Designer', ['Auditor', 'Pilot', 'Chef']],
    ['Teams need centralized logs and searchable traces.', 'DevOps Engineer', ['Farmer', 'Actor', 'Teacher']],
    ['A release broke payment flow; a hotfix is required.', 'Backend Developer', ['Painter', 'Coach', 'Planner']],
    ['A feature needs A/B testing and experiment analysis.', 'Data Analyst', ['Welder', 'Chef', 'Golfer']],
    ['You need responsive breakpoints across multiple devices.', 'Frontend Developer', ['Pilot', 'Sculptor', 'Chef']],
    ['Customer support needs a troubleshooting runbook.', 'Technical Writer', ['Drummer', 'Broker', 'Photographer']],
    ['A system needs autoscaling policies for burst traffic.', 'Cloud Engineer', ['Baker', 'Guide', 'Singer']],
    ['A game UI has confusing menus and poor labels.', 'UX Designer', ['Accountant', 'Pilot', 'Chef']],
    ['The team needs guardrails on production database access.', 'Security Engineer', ['Singer', 'Cook', 'Tailor']],
    ['A repo needs lint, test, and build checks per PR.', 'DevOps Engineer', ['Nurse', 'Lawyer', 'Chef']],
    ['Product leadership asks for roadmap tradeoff analysis.', 'Product Manager', ['Mechanic', 'Actor', 'Chef']],
  ];

  return scenarios.map(([prompt, answer, wrong], index) => ({
    id: `sc-${index + 1}`,
    prompt,
    options: [answer, ...wrong],
    answer,
  }));
};

const buildShortAnswerQuestions = () => {
  const facts = [
    ['Which language commonly runs in the browser?', 'JavaScript'],
    ['What version control command copies a repository locally? (single word)', 'clone'],
    ['What does CSS stand for?', 'Cascading Style Sheets'],
    ['Which HTTP status means Not Found?', '404'],
    ['Which protocol secures HTTP traffic?', 'HTTPS'],
    ['Which command creates a new git branch? (single word)', 'checkout'],
    ['Which file often lists JavaScript project dependencies?', 'package.json'],
    ['Which keyword defines a constant in JavaScript?', 'const'],
    ['What does SQL stand for?', 'Structured Query Language'],
    ['Which markup language structures web pages?', 'HTML'],
    ['Which database query verb reads records?', 'SELECT'],
    ['Which command installs npm dependencies?', 'install'],
    ['Which acronym refers to user experience?', 'UX'],
    ['Which acronym refers to user interface?', 'UI'],
    ['Which Git command uploads local commits? (single word)', 'push'],
    ['Which Git command downloads remote changes? (single word)', 'pull'],
    ['Which command runs Vite dev server in many projects? (single word)', 'dev'],
    ['What is the default HTTP method for reading a resource?', 'GET'],
    ['Which method usually creates a new resource?', 'POST'],
    ['Which method usually updates an entire resource?', 'PUT'],
    ['Which method usually deletes a resource?', 'DELETE'],
    ['What does API stand for?', 'Application Programming Interface'],
    ['What does JSON stand for?', 'JavaScript Object Notation'],
    ['Which tool is commonly used for container images?', 'Docker'],
    ['Which cloud concept automatically adds resources based on load?', 'autoscaling'],
    ['What is the term for software behavior matching expected results?', 'correctness'],
    ['What is the process of finding and fixing code issues called?', 'debugging'],
    ['Which testing type checks small isolated units?', 'unit testing'],
    ['What do we call a severe production issue requiring urgent response?', 'incident'],
    ['What is the term for hidden deployment toggles?', 'feature flags'],
    ['What is the term for tracking app behavior over time?', 'monitoring'],
    ['Which file extension is used by JavaScript module files?', '.js'],
    ['What term describes response delay from request to first byte?', 'latency'],
    ['What is the plural word for one datum?', 'data'],
    ['What term means the app can be used by people with disabilities?', 'accessibility'],
  ];

  return facts.map(([prompt, answer], index) => ({
    id: `txt-${index + 1}`,
    prompt,
    answer,
  }));
};

export const QUESTION_BANK = {
  'multiple-choice': buildMultipleChoiceQuestions(),
  'true-false': buildTrueFalseQuestions(),
  'select-all': buildSelectAllQuestions(),
  'order-steps': buildOrderStepsQuestions(),
  'match-role': buildMatchRoleQuestions(),
  'scenario-choice': buildScenarioChoiceQuestions(),
  'short-answer': buildShortAnswerQuestions(),
};

export const QUESTION_TYPE_LABELS = {
  'multiple-choice': 'Multiple Choice',
  'true-false': 'True / False',
  'select-all': 'Select All That Apply',
  'order-steps': 'Order the Steps',
  'match-role': 'Match the Role',
  'scenario-choice': 'Scenario Choice',
  'short-answer': 'Type the Answer',
};

export const getQuestionsForTypes = (questionTypes = []) =>
  questionTypes.flatMap((questionType) =>
    (QUESTION_BANK[questionType] || []).map((question) => ({
      ...question,
      type: questionType,
    }))
  );
