-- Add semester-wise courses to the database
-- Semester I
INSERT INTO courses (name, code, description, semester) VALUES
('Engineering Chemistry', 'BAC-C102', 'Fundamentals of chemistry principles applied to engineering, including chemical bonding, thermodynamics, and electrochemistry.', 'Semester I'),
('Engineering Chemistry', 'BAC-C202', 'Advanced chemistry concepts for engineering applications, focusing on materials science and chemical processes.', 'Semester I'),
('Engineering Mathematics–I', 'BEM-C102', 'Introduction to calculus, differential equations, and linear algebra for engineering problem-solving.', 'Semester I'),
('Programming for Problem Solving', 'BCE-C102', 'Introduction to programming fundamentals using C/C++, focusing on problem-solving techniques and algorithm development.', 'Semester I'),
('Programming for Problem Solving', 'BCE-C202', 'Advanced programming concepts including data structures, algorithms, and software engineering principles.', 'Semester I'),
('Basic Mechanical Engineering', 'BME-C103', 'Introduction to mechanical engineering principles including statics, dynamics, and thermodynamics.', 'Semester I'),
('Environmental Studies', 'BEN-A103', 'Study of environmental systems, sustainability, and the impact of engineering on the environment.', 'Semester I')

ON CONFLICT (code) DO NOTHING;

-- Semester II
INSERT INTO courses (name, code, description, semester) VALUES
('Engineering Physics', 'BAP-C202', 'Advanced physics concepts including mechanics, waves, optics, and modern physics applications in engineering.', 'Semester II'),
('Engineering Mathematics–II', 'BEM-C202', 'Continuation of mathematical foundations including multivariable calculus, differential equations, and numerical methods.', 'Semester II'),
('Basic Electrical Engineering', 'BEE-C202', 'Fundamentals of electrical circuits, AC/DC systems, transformers, and electrical machines.', 'Semester II'),
('Electronic Devices', 'BET-C202', 'Introduction to semiconductor devices, diodes, transistors, and their applications in electronic circuits.', 'Semester II'),
('Vedic Science & Engineering', 'BHU-S202', 'Integration of traditional Vedic knowledge with modern engineering principles and practices.', 'Semester II')

ON CONFLICT (code) DO NOTHING;

-- Semester III
INSERT INTO courses (name, code, description, semester) VALUES
('Engineering Mathematics–III', 'BEM-C302', 'Advanced mathematical methods including complex analysis, probability, statistics, and transform methods.', 'Semester III'),
('Digital System Design', 'BET-C306', 'Design and analysis of digital circuits, combinational and sequential logic, and digital system architecture.', 'Semester III'),
('Python Programming', 'BCE-C307', 'Comprehensive Python programming covering data structures, object-oriented programming, and Python libraries for engineering applications.', 'Semester III'),
('Data Structure–I', 'BCE-C305', 'Fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs with implementation and analysis.', 'Semester III'),
('Data Structure–I', 'BCE-C405', 'Advanced data structures and algorithms including balanced trees, hash tables, and graph algorithms.', 'Semester III'),
('Computer Architecture & Organization', 'BCE-C306', 'Study of computer system architecture, CPU design, memory systems, and instruction set architecture.', 'Semester III')

ON CONFLICT (code) DO NOTHING;

-- Semester IV
INSERT INTO courses (name, code, description, semester) VALUES
('Discrete Mathematics', 'BEM-C403', 'Mathematical foundations for computer science including logic, set theory, combinatorics, and graph theory.', 'Semester IV'),
('Database Management System', 'BCE-C408', 'Design and implementation of database systems, SQL, normalization, and database administration.', 'Semester IV'),
('Object Oriented Programming using Java', 'BCE-C406', 'Object-oriented programming concepts using Java, including classes, inheritance, polymorphism, and design patterns.', 'Semester IV'),
('Operating System', 'BCE-C407', 'Operating system concepts including process management, memory management, file systems, and concurrency.', 'Semester IV'),
('Microprocessor and Interfacing', 'BET-C411', 'Microprocessor architecture, assembly language programming, and interfacing with peripheral devices.', 'Semester IV'),
('Bhartiya Gyan Parampara (IKT)', 'BKT-A403', 'Indian knowledge traditions and their relevance to modern engineering and technology.', 'Semester IV')

ON CONFLICT (code) DO NOTHING;

-- Semester V
INSERT INTO courses (name, code, description, semester) VALUES
('Computer Network', 'BCE-C511', 'Network architecture, protocols, TCP/IP, routing, switching, and network security fundamentals.', 'Semester V'),
('Advance Data Structure', 'BCE-C512', 'Advanced data structures and algorithms including advanced trees, heaps, and complex algorithmic techniques.', 'Semester V'),
('Design & Analysis of Algorithm', 'BCE-C513', 'Algorithm design techniques, complexity analysis, dynamic programming, greedy algorithms, and graph algorithms.', 'Semester V'),
('Cloud Computing', 'BCE-C514', 'Cloud computing fundamentals, virtualization, cloud services, and distributed systems architecture.', 'Semester V'),
('Universal Human Values', 'BCE-M001', 'Ethics, values, and human-centered design principles in engineering and technology.', 'Semester V')

ON CONFLICT (code) DO NOTHING;

