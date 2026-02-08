/**
 * PyLearn - Python Challenge Definitions
 * Each challenge has increasing complexity with descriptions,
 * starter code, tests, hints, and help content.
 */

const CHALLENGES = [
    // ===== Challenge 1: Hello World =====
    {
        id: 1,
        title: "Hello, World!",
        filename: "hello_world.py",
        difficulty: "beginner",
        category: "Basics",
        objectives: ["Print statements", "String literals", "Running Python code"],
        description: `
            <h2>Challenge 1: Hello, World!</h2>
            <p>Welcome to your first Python challenge! The classic starting point for every programmer is to write a program that displays <code>Hello, World!</code> on the screen.</p>

            <h3>Your Task</h3>
            <p>Write a Python program that prints the text <code>Hello, World!</code> to the console.</p>

            <h3>What You'll Learn</h3>
            <ul>
                <li>Using the <code>print()</code> function</li>
                <li>Working with string literals (text in quotes)</li>
                <li>Running a Python program</li>
            </ul>

            <h3>Expected Output</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>Hello, World!</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">print()</span>
            <span class="objective-tag">strings</span>
        `,
        starterCode: `# Challenge 1: Hello, World!\n# Write your code below to print "Hello, World!"\n\n`,
        solution: `print("Hello, World!")`,
        validate: (output) => {
            return output.trim() === "Hello, World!";
        },
        hints: [
            {
                title: "Hint 1: The print function",
                content: "Python uses the <code>print()</code> function to display text. Whatever you put inside the parentheses will be shown on the screen."
            },
            {
                title: "Hint 2: Using strings",
                content: 'Text in Python needs to be wrapped in quotes. You can use either single quotes <code>\'text\'</code> or double quotes <code>"text"</code>.'
            },
            {
                title: "Hint 3: Almost the answer",
                content: 'Try typing: <code>print("Hello, World!")</code>'
            }
        ],
        helpContent: {
            concepts: `
                <p>The <code>print()</code> function is one of the most fundamental tools in Python. It sends text to the console (terminal output).</p>
                <pre>print("any text here")</pre>
                <p>Strings (text values) must be enclosed in quotes - either single or double:</p>
                <pre>print('Single quotes work')
print("Double quotes work too")</pre>
            `,
            commonErrors: [
                { error: "SyntaxError: EOL while scanning string literal", fix: "Make sure your string has matching opening and closing quotes." },
                { error: "NameError: name 'hello' is not defined", fix: "Text needs to be inside quotes to be treated as a string, not a variable name." }
            ]
        }
    },

    // ===== Challenge 2: Variables & Data Types =====
    {
        id: 2,
        title: "Variables & Types",
        filename: "variables.py",
        difficulty: "beginner",
        category: "Basics",
        objectives: ["Variable assignment", "Data types", "Type conversion"],
        description: `
            <h2>Challenge 2: Variables & Data Types</h2>
            <p>Variables are containers for storing data values. Python has several built-in data types that we'll explore.</p>

            <h3>Your Task</h3>
            <p>Create variables of different types and print them:</p>
            <ol>
                <li>Create a variable <code>name</code> with your name (string)</li>
                <li>Create a variable <code>age</code> with a number (integer)</li>
                <li>Create a variable <code>height</code> with a decimal (float)</li>
                <li>Create a variable <code>is_student</code> set to <code>True</code> (boolean)</li>
                <li>Print each variable using: <code>print(name, age, height, is_student)</code></li>
            </ol>

            <h3>Expected Output (example)</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>Alice 25 5.6 True</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">variables</span>
            <span class="objective-tag">int</span>
            <span class="objective-tag">float</span>
            <span class="objective-tag">str</span>
            <span class="objective-tag">bool</span>
        `,
        starterCode: `# Challenge 2: Variables & Data Types\n# Create variables of different types\n\n# 1. Create a string variable called 'name'\nname = \n\n# 2. Create an integer variable called 'age'\nage = \n\n# 3. Create a float variable called 'height'\nheight = \n\n# 4. Create a boolean variable called 'is_student'\nis_student = \n\n# 5. Print all variables\nprint(name, age, height, is_student)\n`,
        solution: `name = "Alice"\nage = 25\nheight = 5.6\nis_student = True\nprint(name, age, height, is_student)`,
        validate: (output) => {
            const parts = output.trim().split(/\s+/);
            return parts.length === 4 &&
                   isNaN(parts[0]) &&
                   !isNaN(parseInt(parts[1])) &&
                   !isNaN(parseFloat(parts[2])) &&
                   (parts[3] === "True" || parts[3] === "False");
        },
        hints: [
            {
                title: "Hint 1: Assigning variables",
                content: 'In Python, you assign values with <code>=</code>. Example: <code>name = "Alice"</code>'
            },
            {
                title: "Hint 2: Data types",
                content: 'Strings need quotes: <code>"text"</code>. Integers are whole numbers: <code>25</code>. Floats have decimals: <code>5.6</code>. Booleans are <code>True</code> or <code>False</code> (capitalized!).'
            },
            {
                title: "Hint 3: Printing multiple values",
                content: 'The <code>print()</code> function can take multiple arguments separated by commas: <code>print(a, b, c)</code>'
            }
        ],
        helpContent: {
            concepts: `
                <p>Python variables don't need type declarations. The type is inferred from the value:</p>
                <pre>name = "Alice"     # str (string)
age = 25           # int (integer)
height = 5.6       # float (decimal)
is_happy = True    # bool (boolean)</pre>
                <p>You can check a variable's type with <code>type()</code>:</p>
                <pre>print(type(name))  # &lt;class 'str'&gt;</pre>
            `,
            commonErrors: [
                { error: "SyntaxError: invalid syntax", fix: "Make sure strings have quotes and booleans are capitalized (True/False, not true/false)." },
                { error: "NameError: name 'true' is not defined", fix: "Python booleans are capitalized: True and False, not true and false." }
            ]
        }
    },

    // ===== Challenge 3: String Operations =====
    {
        id: 3,
        title: "String Magic",
        filename: "strings.py",
        difficulty: "easy",
        category: "Strings",
        objectives: ["String concatenation", "f-strings", "String methods"],
        description: `
            <h2>Challenge 3: String Magic</h2>
            <p>Strings are one of the most commonly used data types. Let's learn how to manipulate them!</p>

            <h3>Your Task</h3>
            <ol>
                <li>Create variables <code>first_name</code> and <code>last_name</code></li>
                <li>Create <code>full_name</code> by combining them with a space</li>
                <li>Print the full name in uppercase using <code>.upper()</code></li>
                <li>Print the length of the full name</li>
                <li>Print a greeting using an f-string: <code>Hello, {full_name}! Your name has {length} characters.</code></li>
            </ol>

            <h3>Expected Output (example)</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>JOHN DOE
8
Hello, John Doe! Your name has 8 characters.</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">f-strings</span>
            <span class="objective-tag">.upper()</span>
            <span class="objective-tag">len()</span>
            <span class="objective-tag">concatenation</span>
        `,
        starterCode: `# Challenge 3: String Magic\n# Explore string operations\n\n# 1. Create first and last name variables\nfirst_name = "John"\nlast_name = "Doe"\n\n# 2. Combine them into full_name (with a space between)\nfull_name = \n\n# 3. Print the full name in UPPERCASE\n\n\n# 4. Print the length of the full name\n\n\n# 5. Print a greeting using an f-string\n\n`,
        solution: `first_name = "John"\nlast_name = "Doe"\nfull_name = first_name + " " + last_name\nprint(full_name.upper())\nprint(len(full_name))\nprint(f"Hello, {full_name}! Your name has {len(full_name)} characters.")`,
        validate: (output) => {
            const lines = output.trim().split('\n');
            return lines.length === 3 &&
                   lines[0] === lines[0].toUpperCase() &&
                   !isNaN(parseInt(lines[1])) &&
                   lines[2].startsWith("Hello,") &&
                   lines[2].includes("characters.");
        },
        hints: [
            {
                title: "Hint 1: Combining strings",
                content: 'Use <code>+</code> to concatenate: <code>first_name + " " + last_name</code>'
            },
            {
                title: "Hint 2: String methods",
                content: '<code>.upper()</code> converts to uppercase. Use it like: <code>full_name.upper()</code>'
            },
            {
                title: "Hint 3: f-strings",
                content: 'f-strings let you embed expressions: <code>f"Hello, {full_name}!"</code>. Put <code>f</code> before the quote and use <code>{}</code> for variables.'
            }
        ],
        helpContent: {
            concepts: `
                <p>String concatenation joins strings together:</p>
                <pre>greeting = "Hello" + " " + "World"</pre>
                <p>f-strings (formatted string literals) are the modern way to embed values:</p>
                <pre>name = "Alice"
age = 25
print(f"My name is {name} and I am {age}.")</pre>
                <p>Common string methods:</p>
                <pre>.upper()    # "hello" → "HELLO"
.lower()    # "HELLO" → "hello"
.strip()    # "  hi  " → "hi"
.replace()  # "hello".replace("l", "r") → "herro"
len(s)      # length of string</pre>
            `,
            commonErrors: [
                { error: "TypeError: can only concatenate str to str", fix: "Convert non-strings with str(): name + str(age)" },
                { error: "Missing the 'f' prefix", fix: "f-strings need the f before the quote: f\"text {var}\" not \"text {var}\"" }
            ]
        }
    },

    // ===== Challenge 4: User Input & Conditionals =====
    {
        id: 4,
        title: "Decision Maker",
        filename: "decisions.py",
        difficulty: "easy",
        category: "Control Flow",
        objectives: ["input()", "if/elif/else", "Comparison operators"],
        description: `
            <h2>Challenge 4: Decision Maker</h2>
            <p>Programs often need to make decisions based on conditions. Let's build a simple grading system!</p>

            <h3>Your Task</h3>
            <p>Write a program that:</p>
            <ol>
                <li>Assigns a score variable (0-100)</li>
                <li>Uses if/elif/else to determine the grade:</li>
                <ul>
                    <li>90-100: "A"</li>
                    <li>80-89: "B"</li>
                    <li>70-79: "C"</li>
                    <li>60-69: "D"</li>
                    <li>Below 60: "F"</li>
                </ul>
                <li>Prints: <code>Score: {score} - Grade: {grade}</code></li>
            </ol>

            <h3>Expected Output (for score = 85)</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>Score: 85 - Grade: B</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">if/elif/else</span>
            <span class="objective-tag">comparison operators</span>
            <span class="objective-tag">logical flow</span>
        `,
        starterCode: `# Challenge 4: Decision Maker\n# Build a grading system using conditionals\n\nscore = 85\n\n# Determine the grade using if/elif/else\nif score >= 90:\n    grade = "A"\n# Add elif and else blocks for B, C, D, F\n\n\n\n# Print the result\nprint(f"Score: {score} - Grade: {grade}")\n`,
        solution: `score = 85\n\nif score >= 90:\n    grade = "A"\nelif score >= 80:\n    grade = "B"\nelif score >= 70:\n    grade = "C"\nelif score >= 60:\n    grade = "D"\nelse:\n    grade = "F"\n\nprint(f"Score: {score} - Grade: {grade}")`,
        validate: (output) => {
            const match = output.trim().match(/Score:\s*(\d+)\s*-\s*Grade:\s*([ABCDF])/);
            if (!match) return false;
            const score = parseInt(match[1]);
            const grade = match[2];
            if (score >= 90) return grade === "A";
            if (score >= 80) return grade === "B";
            if (score >= 70) return grade === "C";
            if (score >= 60) return grade === "D";
            return grade === "F";
        },
        hints: [
            {
                title: "Hint 1: elif keyword",
                content: '<code>elif</code> is short for "else if". It lets you check multiple conditions in sequence.'
            },
            {
                title: "Hint 2: Structure",
                content: 'The pattern is: <code>if condition:</code> then <code>elif another_condition:</code> then <code>else:</code>'
            },
            {
                title: "Hint 3: Check order matters",
                content: 'Check from highest to lowest. <code>elif score >= 80</code> comes after the 90 check, so it only catches 80-89.'
            }
        ],
        helpContent: {
            concepts: `
                <p>Conditional statements control program flow:</p>
                <pre>if condition:
    # runs if condition is True
elif other_condition:
    # runs if first is False, this is True
else:
    # runs if all above are False</pre>
                <p>Comparison operators:</p>
                <pre>==  # equal to
!=  # not equal to
>   # greater than
<   # less than
>=  # greater than or equal
<=  # less than or equal</pre>
            `,
            commonErrors: [
                { error: "IndentationError: expected an indented block", fix: "Code inside if/elif/else must be indented (4 spaces)." },
                { error: "Using = instead of ==", fix: "= is assignment, == is comparison. Use == in conditions." }
            ]
        }
    },

    // ===== Challenge 5: Loops =====
    {
        id: 5,
        title: "Loop Master",
        filename: "loops.py",
        difficulty: "medium",
        category: "Control Flow",
        objectives: ["for loops", "while loops", "range()", "Loop control"],
        description: `
            <h2>Challenge 5: Loop Master</h2>
            <p>Loops let you repeat code. Master both <code>for</code> and <code>while</code> loops!</p>

            <h3>Your Task</h3>
            <ol>
                <li>Use a <code>for</code> loop to print numbers 1 through 5</li>
                <li>Use a <code>for</code> loop to print each character in <code>"Python"</code></li>
                <li>Use a <code>while</code> loop to count down from 5 to 1, then print <code>"Go!"</code></li>
            </ol>

            <h3>Expected Output</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>1
2
3
4
5
P
y
t
h
o
n
5
4
3
2
1
Go!</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">for loop</span>
            <span class="objective-tag">while loop</span>
            <span class="objective-tag">range()</span>
            <span class="objective-tag">iteration</span>
        `,
        starterCode: `# Challenge 5: Loop Master\n# Practice for loops and while loops\n\n# 1. Print numbers 1-5 using a for loop and range()\n\n\n# 2. Print each character in "Python"\n\n\n# 3. Count down from 5 to 1 using a while loop, then print "Go!"\n\n`,
        solution: `for i in range(1, 6):\n    print(i)\n\nfor char in "Python":\n    print(char)\n\ncount = 5\nwhile count >= 1:\n    print(count)\n    count -= 1\nprint("Go!")`,
        validate: (output) => {
            const lines = output.trim().split('\n');
            const expected = ["1","2","3","4","5","P","y","t","h","o","n","5","4","3","2","1","Go!"];
            if (lines.length !== expected.length) return false;
            return lines.every((line, i) => line.trim() === expected[i]);
        },
        hints: [
            {
                title: "Hint 1: range() function",
                content: '<code>range(1, 6)</code> produces 1, 2, 3, 4, 5. The end value is exclusive!'
            },
            {
                title: "Hint 2: Iterating over strings",
                content: 'You can loop directly over a string: <code>for char in "Python":</code>'
            },
            {
                title: "Hint 3: While loop countdown",
                content: 'Set <code>count = 5</code>, loop <code>while count >= 1</code>, and use <code>count -= 1</code> to decrement.'
            }
        ],
        helpContent: {
            concepts: `
                <p><strong>For loops</strong> iterate over sequences:</p>
                <pre>for i in range(5):       # 0,1,2,3,4
    print(i)

for char in "hello":     # h,e,l,l,o
    print(char)</pre>
                <p><strong>While loops</strong> repeat while a condition is True:</p>
                <pre>count = 5
while count > 0:
    print(count)
    count -= 1</pre>
                <p><strong>range()</strong> variations:</p>
                <pre>range(5)        # 0,1,2,3,4
range(1, 6)     # 1,2,3,4,5
range(0, 10, 2) # 0,2,4,6,8</pre>
            `,
            commonErrors: [
                { error: "Infinite loop", fix: "Make sure your while loop condition eventually becomes False. Always update the loop variable!" },
                { error: "Off-by-one error", fix: "range(1, 6) gives 1-5. The stop value is exclusive." }
            ]
        }
    },

    // ===== Challenge 6: Lists =====
    {
        id: 6,
        title: "List Wrangler",
        filename: "lists.py",
        difficulty: "medium",
        category: "Data Structures",
        objectives: ["List creation", "List methods", "List comprehension", "Slicing"],
        description: `
            <h2>Challenge 6: List Wrangler</h2>
            <p>Lists are ordered, mutable collections. They're one of Python's most versatile data structures.</p>

            <h3>Your Task</h3>
            <ol>
                <li>Create a list <code>numbers</code> containing <code>[4, 2, 7, 1, 9, 3, 6]</code></li>
                <li>Print the sorted list</li>
                <li>Print the sum and length</li>
                <li>Use a list comprehension to create <code>squared</code> (each number squared)</li>
                <li>Print the squared list</li>
                <li>Print the first 3 and last 3 elements of the original list</li>
            </ol>

            <h3>Expected Output</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>[1, 2, 3, 4, 6, 7, 9]
Sum: 32, Length: 7
[16, 4, 49, 1, 81, 9, 36]
First 3: [4, 2, 7]
Last 3: [3, 6]</pre>
            </div>
            <p><em>Note: Last 3 uses the original unsorted list.</em></p>

            <h3>Concepts</h3>
            <span class="objective-tag">lists</span>
            <span class="objective-tag">sorted()</span>
            <span class="objective-tag">list comprehension</span>
            <span class="objective-tag">slicing</span>
        `,
        starterCode: `# Challenge 6: List Wrangler\n# Master Python lists\n\nnumbers = [4, 2, 7, 1, 9, 3, 6]\n\n# 1. Print sorted list\nprint(sorted(numbers))\n\n# 2. Print sum and length\n\n\n# 3. Create squared list using list comprehension\nsquared = \n\n# 4. Print squared list\n\n\n# 5. Print first 3 and last 3 of original list\n\n\n`,
        solution: `numbers = [4, 2, 7, 1, 9, 3, 6]\nprint(sorted(numbers))\nprint(f"Sum: {sum(numbers)}, Length: {len(numbers)}")\nsquared = [x**2 for x in numbers]\nprint(squared)\nprint(f"First 3: {numbers[:3]}")\nprint(f"Last 3: {numbers[-3:]}")`,
        validate: (output) => {
            const lines = output.trim().split('\n');
            return lines.length >= 4 &&
                   lines[0].includes("1, 2, 3") &&
                   lines[1].includes("Sum:") &&
                   lines[1].includes("Length:");
        },
        hints: [
            {
                title: "Hint 1: sorted() vs .sort()",
                content: '<code>sorted(list)</code> returns a new sorted list. <code>list.sort()</code> sorts in place and returns None.'
            },
            {
                title: "Hint 2: List comprehension",
                content: 'Syntax: <code>[expression for item in list]</code>. Example: <code>[x**2 for x in numbers]</code>'
            },
            {
                title: "Hint 3: Slicing",
                content: '<code>list[:3]</code> gets first 3 elements. <code>list[-3:]</code> gets last 3 elements.'
            }
        ],
        helpContent: {
            concepts: `
                <p>Lists are created with square brackets:</p>
                <pre>fruits = ["apple", "banana", "cherry"]
numbers = [1, 2, 3, 4, 5]</pre>
                <p>Common list operations:</p>
                <pre>.append(item)   # add to end
.insert(i, item) # insert at index
.remove(item)   # remove first occurrence
.pop()          # remove & return last
sorted(list)    # return sorted copy
len(list)       # length
sum(list)       # sum of numbers</pre>
                <p>List comprehensions create lists concisely:</p>
                <pre>squares = [x**2 for x in range(5)]
# [0, 1, 4, 9, 16]

evens = [x for x in range(10) if x % 2 == 0]
# [0, 2, 4, 6, 8]</pre>
                <p>Slicing:</p>
                <pre>a = [10,20,30,40,50]
a[1:3]   # [20, 30]
a[:2]    # [10, 20]
a[-2:]   # [40, 50]
a[::2]   # [10, 30, 50]</pre>
            `,
            commonErrors: [
                { error: "IndexError: list index out of range", fix: "Remember lists are 0-indexed. A 5-element list has indices 0-4." },
                { error: "TypeError: 'NoneType' - after .sort()", fix: ".sort() modifies in-place and returns None. Use sorted() to get a new list." }
            ]
        }
    },

    // ===== Challenge 7: Functions =====
    {
        id: 7,
        title: "Function Factory",
        filename: "functions.py",
        difficulty: "medium",
        category: "Functions",
        objectives: ["def keyword", "Parameters", "Return values", "Default arguments"],
        description: `
            <h2>Challenge 7: Function Factory</h2>
            <p>Functions are reusable blocks of code. They make your programs organized and DRY (Don't Repeat Yourself).</p>

            <h3>Your Task</h3>
            <ol>
                <li>Write a function <code>greet(name)</code> that returns <code>"Hello, {name}!"</code></li>
                <li>Write a function <code>calculate_area(length, width=1)</code> that returns the area</li>
                <li>Write a function <code>is_even(number)</code> that returns True if even, False if odd</li>
                <li>Test each function with print statements</li>
            </ol>

            <h3>Expected Output</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>Hello, Alice!
Area: 15
Area with default: 5
Is 4 even? True
Is 7 even? False</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">def</span>
            <span class="objective-tag">return</span>
            <span class="objective-tag">parameters</span>
            <span class="objective-tag">default args</span>
        `,
        starterCode: `# Challenge 7: Function Factory\n# Build reusable functions\n\n# 1. Greeting function\ndef greet(name):\n    # Return "Hello, {name}!"\n    pass\n\n# 2. Area calculator with default width\ndef calculate_area(length, width=1):\n    # Return length * width\n    pass\n\n# 3. Even number checker\ndef is_even(number):\n    # Return True if even, False if odd\n    pass\n\n# Test your functions\nprint(greet("Alice"))\nprint(f"Area: {calculate_area(3, 5)}")\nprint(f"Area with default: {calculate_area(5)}")\nprint(f"Is 4 even? {is_even(4)}")\nprint(f"Is 7 even? {is_even(7)}")\n`,
        solution: `def greet(name):\n    return f"Hello, {name}!"\n\ndef calculate_area(length, width=1):\n    return length * width\n\ndef is_even(number):\n    return number % 2 == 0\n\nprint(greet("Alice"))\nprint(f"Area: {calculate_area(3, 5)}")\nprint(f"Area with default: {calculate_area(5)}")\nprint(f"Is 4 even? {is_even(4)}")\nprint(f"Is 7 even? {is_even(7)}")`,
        validate: (output) => {
            const lines = output.trim().split('\n');
            return lines.length === 5 &&
                   lines[0] === "Hello, Alice!" &&
                   lines[1] === "Area: 15" &&
                   lines[2] === "Area with default: 5" &&
                   lines[3] === "Is 4 even? True" &&
                   lines[4] === "Is 7 even? False";
        },
        hints: [
            {
                title: "Hint 1: Return vs Print",
                content: 'Functions should <code>return</code> values, not <code>print</code> them. <code>return</code> sends data back to the caller.'
            },
            {
                title: "Hint 2: The modulo operator",
                content: '<code>%</code> gives the remainder. <code>number % 2 == 0</code> checks if a number is even.'
            },
            {
                title: "Hint 3: Default parameters",
                content: 'Default params go in the definition: <code>def func(a, b=10):</code>. If b isn\'t provided, it defaults to 10.'
            }
        ],
        helpContent: {
            concepts: `
                <p>Functions are defined with <code>def</code>:</p>
                <pre>def function_name(parameters):
    # code
    return result</pre>
                <p>Default parameters provide fallback values:</p>
                <pre>def greet(name, greeting="Hello"):
    return f"{greeting}, {name}!"

greet("Alice")           # "Hello, Alice!"
greet("Bob", "Hi")       # "Hi, Bob!"</pre>
                <p>Functions can return any type:</p>
                <pre>def is_positive(n):
    return n > 0  # returns True or False</pre>
            `,
            commonErrors: [
                { error: "Function returns None", fix: "Make sure you use 'return' not 'print' inside the function. 'pass' also returns None." },
                { error: "TypeError: missing required argument", fix: "Ensure you pass all required arguments when calling the function." }
            ]
        }
    },

    // ===== Challenge 8: Dictionaries =====
    {
        id: 8,
        title: "Dictionary Detective",
        filename: "dictionaries.py",
        difficulty: "medium",
        category: "Data Structures",
        objectives: ["Dict creation", "Accessing values", "Iterating", "Nested dicts"],
        description: `
            <h2>Challenge 8: Dictionary Detective</h2>
            <p>Dictionaries store key-value pairs. They're perfect for structured data!</p>

            <h3>Your Task</h3>
            <ol>
                <li>Create a dictionary <code>student</code> with keys: name, age, grades (a list of numbers)</li>
                <li>Print the student's name</li>
                <li>Calculate and print the average grade</li>
                <li>Add a new key <code>"passed"</code> that is True if average >= 60</li>
                <li>Loop through the dictionary and print each key-value pair</li>
            </ol>

            <h3>Expected Output (example)</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>Name: Alice
Average grade: 82.5
name: Alice
age: 20
grades: [85, 90, 75, 80]
passed: True</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">dictionaries</span>
            <span class="objective-tag">key-value pairs</span>
            <span class="objective-tag">.items()</span>
            <span class="objective-tag">average</span>
        `,
        starterCode: `# Challenge 8: Dictionary Detective\n# Work with Python dictionaries\n\nstudent = {\n    "name": "Alice",\n    "age": 20,\n    "grades": [85, 90, 75, 80]\n}\n\n# 1. Print the student's name\n\n\n# 2. Calculate and print average grade\n\n\n# 3. Add "passed" key (True if average >= 60)\n\n\n# 4. Loop and print each key-value pair\n\n`,
        solution: `student = {\n    "name": "Alice",\n    "age": 20,\n    "grades": [85, 90, 75, 80]\n}\n\nprint(f"Name: {student['name']}")\naverage = sum(student["grades"]) / len(student["grades"])\nprint(f"Average grade: {average}")\nstudent["passed"] = average >= 60\nfor key, value in student.items():\n    print(f"{key}: {value}")`,
        validate: (output) => {
            const lines = output.trim().split('\n');
            return lines.length >= 5 &&
                   lines[0].startsWith("Name:") &&
                   lines[1].startsWith("Average grade:");
        },
        hints: [
            {
                title: "Hint 1: Accessing values",
                content: 'Use <code>dict["key"]</code> or <code>dict.get("key")</code> to access values.'
            },
            {
                title: "Hint 2: Average calculation",
                content: '<code>sum(list) / len(list)</code> gives the average of a list of numbers.'
            },
            {
                title: "Hint 3: Iterating",
                content: 'Use <code>for key, value in dict.items():</code> to loop through both keys and values.'
            }
        ],
        helpContent: {
            concepts: `
                <p>Dictionaries use key-value pairs:</p>
                <pre>person = {
    "name": "Alice",
    "age": 30,
    "hobbies": ["reading", "coding"]
}</pre>
                <p>Accessing and modifying:</p>
                <pre>person["name"]       # "Alice"
person["age"] = 31   # update value
person["email"] = "a@b.com"  # add new key
del person["age"]    # delete key</pre>
                <p>Iterating:</p>
                <pre>for key in person:           # keys only
for key, val in person.items():  # both
for val in person.values():      # values only</pre>
            `,
            commonErrors: [
                { error: "KeyError: 'key'", fix: "The key doesn't exist. Use .get('key', default) to safely access, or check with 'if key in dict'." },
                { error: "TypeError: unhashable type: 'list'", fix: "Lists can't be dictionary keys. Use tuples or strings instead." }
            ]
        }
    },

    // ===== Challenge 9: Error Handling =====
    {
        id: 9,
        title: "Error Tamer",
        filename: "errors.py",
        difficulty: "hard",
        category: "Error Handling",
        objectives: ["try/except", "Multiple exceptions", "finally", "Raising errors"],
        description: `
            <h2>Challenge 9: Error Tamer</h2>
            <p>Errors happen! Good programmers handle them gracefully with try/except blocks.</p>

            <h3>Your Task</h3>
            <p>Write a function <code>safe_divide(a, b)</code> that:</p>
            <ol>
                <li>Tries to divide a by b</li>
                <li>Handles <code>ZeroDivisionError</code> - prints "Error: Cannot divide by zero!" and returns None</li>
                <li>Handles <code>TypeError</code> - prints "Error: Please provide numbers!" and returns None</li>
                <li>Prints "Division attempted." in a <code>finally</code> block</li>
                <li>Returns the result if successful</li>
            </ol>
            <p>Test with: <code>safe_divide(10, 2)</code>, <code>safe_divide(10, 0)</code>, <code>safe_divide("10", 2)</code></p>

            <h3>Expected Output</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>Division attempted.
Result: 5.0
Error: Cannot divide by zero!
Division attempted.
Result: None
Error: Please provide numbers!
Division attempted.
Result: None</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">try/except</span>
            <span class="objective-tag">finally</span>
            <span class="objective-tag">exception types</span>
            <span class="objective-tag">error handling</span>
        `,
        starterCode: `# Challenge 9: Error Tamer\n# Handle errors gracefully\n\ndef safe_divide(a, b):\n    # Use try/except/finally to handle errors\n    try:\n        pass  # perform the division\n    except ZeroDivisionError:\n        pass  # handle division by zero\n    except TypeError:\n        pass  # handle wrong types\n    finally:\n        pass  # this always runs\n\n# Test the function\nresult1 = safe_divide(10, 2)\nprint(f"Result: {result1}")\n\nresult2 = safe_divide(10, 0)\nprint(f"Result: {result2}")\n\nresult3 = safe_divide("10", 2)\nprint(f"Result: {result3}")\n`,
        solution: `def safe_divide(a, b):\n    try:\n        result = a / b\n        return result\n    except ZeroDivisionError:\n        print("Error: Cannot divide by zero!")\n        return None\n    except TypeError:\n        print("Error: Please provide numbers!")\n        return None\n    finally:\n        print("Division attempted.")\n\nresult1 = safe_divide(10, 2)\nprint(f"Result: {result1}")\n\nresult2 = safe_divide(10, 0)\nprint(f"Result: {result2}")\n\nresult3 = safe_divide("10", 2)\nprint(f"Result: {result3}")`,
        validate: (output) => {
            const lines = output.trim().split('\n');
            return lines.length === 7 &&
                   lines[0] === "Division attempted." &&
                   lines[1] === "Result: 5.0" &&
                   lines[2] === "Error: Cannot divide by zero!" &&
                   lines[5].includes("Please provide numbers");
        },
        hints: [
            {
                title: "Hint 1: try/except structure",
                content: 'Put the risky code in <code>try:</code>, and handle each error type in separate <code>except</code> blocks.'
            },
            {
                title: "Hint 2: finally block",
                content: '<code>finally:</code> runs no matter what - whether the try succeeded or an exception was caught.'
            },
            {
                title: "Hint 3: Return inside try",
                content: 'You can <code>return result</code> inside the try block. The finally block still runs before the function actually returns.'
            }
        ],
        helpContent: {
            concepts: `
                <p>Error handling prevents crashes:</p>
                <pre>try:
    # risky code
    result = 10 / 0
except ZeroDivisionError:
    print("Can't divide by zero!")
except TypeError as e:
    print(f"Type error: {e}")
except Exception as e:
    print(f"Unexpected: {e}")
else:
    print("No errors occurred!")
finally:
    print("This always runs")</pre>
                <p>Common exception types:</p>
                <pre>ZeroDivisionError  # division by zero
TypeError          # wrong type operation
ValueError         # wrong value
IndexError         # bad list index
KeyError           # bad dict key
FileNotFoundError  # missing file</pre>
            `,
            commonErrors: [
                { error: "Bare except clause", fix: "Avoid 'except:' without a type. Always catch specific exceptions like 'except ValueError:'" },
                { error: "Exception order matters", fix: "Put more specific exceptions before general ones. 'except Exception' should be last." }
            ]
        }
    },

    // ===== Challenge 10: Classes & OOP =====
    {
        id: 10,
        title: "Class Creator",
        filename: "classes.py",
        difficulty: "hard",
        category: "OOP",
        objectives: ["Classes", "__init__", "Methods", "Inheritance"],
        description: `
            <h2>Challenge 10: Class Creator</h2>
            <p>Object-Oriented Programming (OOP) lets you model real-world concepts as code objects.</p>

            <h3>Your Task</h3>
            <ol>
                <li>Create a <code>Pet</code> class with:
                    <ul>
                        <li><code>__init__(self, name, species, age)</code></li>
                        <li><code>speak()</code> method: dogs say "Woof!", cats say "Meow!", others say "..."</li>
                        <li><code>info()</code> method: returns "{name} is a {age}-year-old {species}"</li>
                    </ul>
                </li>
                <li>Create a <code>Dog</code> subclass that adds a <code>fetch(item)</code> method returning "{name} fetched the {item}!"</li>
                <li>Test with the provided code</li>
            </ol>

            <h3>Expected Output</h3>
            <div class="example-box">
                <div class="label">Output</div>
                <pre>Buddy is a 3-year-old dog
Woof!
Whiskers is a 5-year-old cat
Meow!
Buddy fetched the ball!</pre>
            </div>

            <h3>Concepts</h3>
            <span class="objective-tag">class</span>
            <span class="objective-tag">__init__</span>
            <span class="objective-tag">self</span>
            <span class="objective-tag">inheritance</span>
            <span class="objective-tag">methods</span>
        `,
        starterCode: `# Challenge 10: Class Creator\n# Build classes with OOP\n\nclass Pet:\n    def __init__(self, name, species, age):\n        # Store the attributes\n        pass\n\n    def speak(self):\n        # Return "Woof!" for dogs, "Meow!" for cats, "..." for others\n        pass\n\n    def info(self):\n        # Return "{name} is a {age}-year-old {species}"\n        pass\n\n\nclass Dog(Pet):\n    def __init__(self, name, age):\n        # Call parent __init__ with species="dog"\n        pass\n\n    def fetch(self, item):\n        # Return "{name} fetched the {item}!"\n        pass\n\n\n# Test\nbuddy = Dog("Buddy", 3)\nprint(buddy.info())\nprint(buddy.speak())\n\nwhiskers = Pet("Whiskers", "cat", 5)\nprint(whiskers.info())\nprint(whiskers.speak())\n\nprint(buddy.fetch("ball"))\n`,
        solution: `class Pet:\n    def __init__(self, name, species, age):\n        self.name = name\n        self.species = species\n        self.age = age\n\n    def speak(self):\n        if self.species == "dog":\n            return "Woof!"\n        elif self.species == "cat":\n            return "Meow!"\n        else:\n            return "..."\n\n    def info(self):\n        return f"{self.name} is a {self.age}-year-old {self.species}"\n\n\nclass Dog(Pet):\n    def __init__(self, name, age):\n        super().__init__(name, "dog", age)\n\n    def fetch(self, item):\n        return f"{self.name} fetched the {item}!"\n\n\nbuddy = Dog("Buddy", 3)\nprint(buddy.info())\nprint(buddy.speak())\n\nwhiskers = Pet("Whiskers", "cat", 5)\nprint(whiskers.info())\nprint(whiskers.speak())\n\nprint(buddy.fetch("ball"))`,
        validate: (output) => {
            const lines = output.trim().split('\n');
            return lines.length === 5 &&
                   lines[0] === "Buddy is a 3-year-old dog" &&
                   lines[1] === "Woof!" &&
                   lines[2] === "Whiskers is a 5-year-old cat" &&
                   lines[3] === "Meow!" &&
                   lines[4] === "Buddy fetched the ball!";
        },
        hints: [
            {
                title: "Hint 1: __init__ and self",
                content: '<code>self</code> refers to the instance. Store attributes with <code>self.name = name</code>'
            },
            {
                title: "Hint 2: Inheritance",
                content: '<code>class Dog(Pet):</code> means Dog inherits from Pet. Use <code>super().__init__(...)</code> to call the parent constructor.'
            },
            {
                title: "Hint 3: Methods return values",
                content: 'Use <code>return</code> in methods (not print). The test code calls print() on the returned value.'
            }
        ],
        helpContent: {
            concepts: `
                <p>Classes are blueprints for objects:</p>
                <pre>class Animal:
    def __init__(self, name):
        self.name = name  # instance attribute

    def speak(self):       # instance method
        return f"{self.name} makes a sound"</pre>
                <p>Inheritance creates specialized classes:</p>
                <pre>class Dog(Animal):     # Dog inherits from Animal
    def __init__(self, name, breed):
        super().__init__(name)  # call parent init
        self.breed = breed

    def speak(self):   # override parent method
        return f"{self.name} says Woof!"</pre>
                <p><code>self</code> is the instance reference - it's how methods access instance data.</p>
            `,
            commonErrors: [
                { error: "TypeError: __init__() takes X arguments", fix: "Don't forget 'self' as the first parameter in every method definition." },
                { error: "AttributeError: object has no attribute", fix: "Make sure you assigned the attribute in __init__: self.name = name" }
            ]
        }
    }
];
