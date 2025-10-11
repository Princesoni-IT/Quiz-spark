const xlsx = require('xlsx');
const path = require('path');

// Sample questions data
const questions = [
    {
        Question: "What is the capital of India?",
        Option1: "Mumbai",
        Option2: "Delhi",
        Option3: "Kolkata",
        Option4: "Chennai",
        CorrectAnswer: 2
    },
    {
        Question: "What is 5 + 3?",
        Option1: "6",
        Option2: "7",
        Option3: "8",
        Option4: "9",
        CorrectAnswer: 3
    },
    {
        Question: "Which planet is known as the Red Planet?",
        Option1: "Venus",
        Option2: "Mars",
        Option3: "Jupiter",
        Option4: "Saturn",
        CorrectAnswer: 2
    },
    {
        Question: "What is the largest ocean on Earth?",
        Option1: "Atlantic",
        Option2: "Indian",
        Option3: "Arctic",
        Option4: "Pacific",
        CorrectAnswer: 4
    },
    {
        Question: "Who wrote Romeo and Juliet?",
        Option1: "Charles Dickens",
        Option2: "William Shakespeare",
        Option3: "Mark Twain",
        Option4: "Jane Austen",
        CorrectAnswer: 2
    },
    {
        Question: "What is the chemical symbol for water?",
        Option1: "H2O",
        Option2: "CO2",
        Option3: "O2",
        Option4: "NaCl",
        CorrectAnswer: 1
    },
    {
        Question: "How many continents are there?",
        Option1: "5",
        Option2: "6",
        Option3: "7",
        Option4: "8",
        CorrectAnswer: 3
    },
    {
        Question: "What is the square root of 64?",
        Option1: "6",
        Option2: "7",
        Option3: "8",
        Option4: "9",
        CorrectAnswer: 3
    },
    {
        Question: "Which gas do plants absorb from the atmosphere?",
        Option1: "Oxygen",
        Option2: "Nitrogen",
        Option3: "Carbon Dioxide",
        Option4: "Hydrogen",
        CorrectAnswer: 3
    },
    {
        Question: "What is the capital of France?",
        Option1: "London",
        Option2: "Berlin",
        Option3: "Paris",
        Option4: "Rome",
        CorrectAnswer: 3
    }
];

// Create a new workbook
const workbook = xlsx.utils.book_new();

// Convert data to worksheet
const worksheet = xlsx.utils.json_to_sheet(questions);

// Add worksheet to workbook
xlsx.utils.book_append_sheet(workbook, worksheet, "Questions");

// Write to file
const filePath = path.join(__dirname, 'sample_questions.xlsx');
xlsx.writeFile(workbook, filePath);

console.log('✅ Sample Excel file created successfully:', filePath);
