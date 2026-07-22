/*=========================================================
 AI Question Paper Generator
 Parser Version 2.0
 Part 1 : DOCX Reader & Initializer
=========================================================*/

// ========================================================
// Global Variables
// ========================================================

let questionBank = [];

let currentChapter = "General";
let currentSection = "A";
let currentMarks = 1;

const SECTION_MARKS = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
    E: 5
};

// ========================================================
// Upload Question Bank
// ========================================================

function extractQuestions() {

    const input = document.getElementById("questionBank");

    if (!input) {
        alert("Question Bank input not found.");
        return;
    }

    if (input.files.length === 0) {
        alert("Please select a DOCX file.");
        return;
    }

    const file = input.files[0];

    if (!file.name.toLowerCase().endsWith(".docx")) {
        alert("Only DOCX files are supported.");
        return;
    }

    updateStatus("Reading DOCX file...", "info");

    const reader = new FileReader();

    reader.onload = function(e){

        mammoth.extractRawText({

            arrayBuffer: e.target.result

        })

        .then(function(result){

            console.clear();

            console.log("========= RAW DOCX =========");
            console.log(result.value);
            console.log("============================");

            startParser(result.value);

        })

        .catch(function(err){

            console.error(err);

            updateStatus(
                "Unable to read DOCX file.",
                "danger"
            );

        });

    };

    reader.readAsArrayBuffer(file);

}

// ========================================================
// Status Box
// ========================================================

function updateStatus(message,type="info"){

    const box=document.getElementById("status");

    if(!box) return;

    box.className="alert alert-"+type;

    box.innerHTML=message;

}

// ========================================================
// Start Parser
// ========================================================

function startParser(rawText){

    questionBank=[];

    currentChapter="General";

    currentSection="A";

    currentMarks=1;

    const paragraphs = rawText

        .split(/\n\s*\n/)

        .map(p=>p.trim())

        .filter(p=>p.length>0);

    console.log("Paragraphs Found :", paragraphs.length);

    parseParagraphs(paragraphs);

}
/*=========================================================
 Parser Version 2.0
 Part 2 : Smart Paragraph Parser
=========================================================*/

// ========================================================
// Parse Paragraphs
// ========================================================
function parseParagraphs(paragraphs){

    console.log(paragraphs);

    paragraphs.forEach(function(paragraph){

        console.log("Reading:", paragraph);

        parseParagraph(paragraph);

    });

    finalizeQuestionBank();

}
//function parseParagraphs(paragraphs){
//
  //  paragraphs.forEach(function(paragraph){
//
  //      parseParagraph(paragraph);
//
  //  });
//
  //  finalizeQuestionBank();

//}

// ========================================================
// Parse One Paragraph
// ========================================================

function parseParagraph(paragraph){

    let lines = paragraph

        .split("\n")

        .map(x=>x.trim())

        .filter(x=>x.length>0);

    lines.forEach(function(line){

        // -----------------------
        // Detect Chapter
        // -----------------------
        console.log(line);
        if(isChapter(line)){

            currentChapter = extractChapter(line);

            return;

        }

        // -----------------------
        // Detect Section
        // -----------------------

        if(isSection(line)){

            currentSection = extractSection(line);

            currentMarks = SECTION_MARKS[currentSection];

            return;

        }

        // -----------------------
        // Detect Marks Heading
        // -----------------------

        let marks = detectMarks(line);

        if(marks !== null){

            currentMarks = marks;

            if(isMarksHeading(line))
                return;

        }

        // -----------------------
        // Detect Question
        // -----------------------

console.log("LINE:", line);

if(isQuestion(line)){

    console.log("QUESTION FOUND:", line);

    questionBank.push({

        chapter: currentChapter,
        section: currentSection,
        marks: currentMarks,
        type: detectQuestionType(line),
        question: cleanQuestion(line)

    });

}

    });

}

// ========================================================
// Detect Chapter
// ========================================================

function isChapter(line){

    return /^(chapter|unit|lesson)/i.test(line);

}

function extractChapter(line){

    return line

        .replace(/^(chapter|unit|lesson)\s*:?\s*/i,"")

        .trim();

}

// ========================================================
// Detect Section
// ========================================================

function isSection(line){

    return /^section\s+[A-E]/i.test(line);

}

function extractSection(line){

    const m=line.match(/[A-E]/i);

    return m ? m[0].toUpperCase() : "A";

}

// ========================================================
// Detect Marks
// ========================================================

function detectMarks(line){

    line=line.toLowerCase();

    if(line.includes("1 mark")) return 1;
    if(line.includes("2 mark")) return 2;
    if(line.includes("3 mark")) return 3;
    if(line.includes("4 mark")) return 4;
    if(line.includes("5 mark")) return 5;

    if(line.includes("very short")) return 1;
    if(line.includes("short answer i")) return 2;
    if(line.includes("short answer ii")) return 3;
    if(line.includes("long answer")) return 5;
    if(line.includes("case study")) return 5;

    return null;

}

// ========================================================
// Marks Heading
// ========================================================

function isMarksHeading(line){

    line=line.toLowerCase();

    return (

        line.includes("mark") ||

        line.includes("very short") ||

        line.includes("short answer") ||

        line.includes("long answer") ||

        line.includes("case study")

    );

}

// ========================================================
// Detect Question
// ========================================================

function isQuestion(line){

    if(line.length<8) return false;

    if(ignoreLine(line)) return false;

    return (

        /^q\.?\s*\d+/i.test(line) ||

        /^question\s*\d+/i.test(line) ||

        /^\d+[.)]/.test(line) ||

        /^\(\d+\)/.test(line) ||

        /^[ivxlcdm]+[.)]/i.test(line)

    );

}

// ========================================================
// Clean Question
// ========================================================

function cleanQuestion(line){

    return line

        .replace(/^q\.?\s*\d+\s*[:.)-]?\s*/i,"")

        .replace(/^question\s*\d+\s*[:.)-]?\s*/i,"")

        .replace(/^\d+\s*[.)-]\s*/,"")

        .replace(/^\(\d+\)\s*/,"")

        .replace(/^[ivxlcdm]+[.)]\s*/i,"")

        .trim();

}
/*=========================================================
 Parser Version 2.0
 Part 3 : Question Processing
=========================================================*/

// =====================================================
// Ignore unwanted lines
// =====================================================

function ignoreLine(line){

    line = line.trim().toLowerCase();

    const ignore = [

        "kendriya vidyalaya",
        "pm shri",
        "computer science",
        "class xii",
        "class 12",
        "sample paper",
        "question bank",
        "maximum marks",
        "time allowed",
        "general instructions",
        "instructions",
        "page"
    ];

    return ignore.some(word => line.includes(word));

}

// =====================================================
// Detect Question Type
// =====================================================

function detectQuestionType(question){

    const q = question.toLowerCase();

    if(q.includes("mcq"))
        return "MCQ";

    if(q.includes("assertion"))
        return "Assertion";

    if(q.includes("case study"))
        return "Case Study";

    if(q.includes("sql"))
        return "SQL";

    if(q.includes("query"))
        return "SQL";

    if(q.includes("python"))
        return "Programming";

    if(q.includes("program"))
        return "Programming";

    return "Theory";

}

// =====================================================
// Detect Difficulty
// =====================================================

function detectDifficulty(question){

    const words = question.split(" ").length;

    if(words <= 8)
        return "Easy";

    if(words <= 18)
        return "Medium";

    return "Hard";

}

// =====================================================
// Remove Duplicate Questions
// =====================================================

function removeDuplicates(){

    const seen = new Set();

    questionBank = questionBank.filter(q=>{

        const key = q.question.toLowerCase().trim();

        if(seen.has(key))
            return false;

        seen.add(key);

        return true;

    });

}

// =====================================================
// Validate Questions
// =====================================================

function validateQuestions(){

    questionBank = questionBank.filter(q=>{

        if(!q.question) return false;

        if(q.question.length < 10) return false;

        if(!q.chapter)
            q.chapter = "General";

        if(!q.section)
            q.section = "A";

        if(!q.marks)
            q.marks = 1;

        q.type = detectQuestionType(q.question);

        q.difficulty = detectDifficulty(q.question);

        return true;

    });

}

// =====================================================
// Sort Question Bank
// =====================================================

function sortQuestionBank(){

    questionBank.sort((a,b)=>{

        if(a.chapter === b.chapter){

            if(a.marks === b.marks){

                return a.question.localeCompare(b.question);

            }

            return a.marks - b.marks;

        }

        return a.chapter.localeCompare(b.chapter);

    });

}
/*=========================================================
 Parser Version 2.0
 Part 4 : Storage, Statistics & Utility Functions
=========================================================*/

// =====================================================
// Finalize Question Bank
// =====================================================
console.log("Before Validation");
console.table(questionBank);
function finalizeQuestionBank(){

    validateQuestions();

    removeDuplicates();

    sortQuestionBank();
 console.log("After Validation");
console.table(questionBank);

    saveQuestionBank();

}

// =====================================================
// Save Question Bank
// =====================================================

function saveQuestionBank(){

    localStorage.setItem(

        "questionBank",

        JSON.stringify(questionBank)

    );

    showStatistics();

}

// =====================================================
// Statistics
// =====================================================

function showStatistics(){

    const chapters = new Set();

    const marksCount = {

        1:0,
        2:0,
        3:0,
        4:0,
        5:0

    };

    questionBank.forEach(q=>{

        chapters.add(q.chapter);

        if(marksCount[q.marks] !== undefined){

            marksCount[q.marks]++;

        }

    });

    updateStatus(

    `
    <h4>✅ Question Bank Loaded Successfully</h4>

    <hr>

    <b>Total Questions :</b> ${questionBank.length}<br>

    <b>Total Chapters :</b> ${chapters.size}<br><br>

    <table class="table table-bordered">

        <tr>

            <th>Marks</th>

            <th>Questions</th>

        </tr>

        <tr>

            <td>1 Mark</td>

            <td>${marksCount[1]}</td>

        </tr>

        <tr>

            <td>2 Marks</td>

            <td>${marksCount[2]}</td>

        </tr>

        <tr>

            <td>3 Marks</td>

            <td>${marksCount[3]}</td>

        </tr>

        <tr>

            <td>4 Marks</td>

            <td>${marksCount[4]}</td>

        </tr>

        <tr>

            <td>5 Marks</td>

            <td>${marksCount[5]}</td>

        </tr>

    </table>

    `,

    "success"

    );

}

// =====================================================
// Get Chapters
// =====================================================

function getChapters(){

    return [...new Set(questionBank.map(q=>q.chapter))];

}

// =====================================================
// Get Questions
// =====================================================

function getQuestions(chapter,marks){

    return questionBank.filter(q=>

        q.chapter===chapter &&

        q.marks===marks

    );

}

// =====================================================
// Random Question
// =====================================================

function randomQuestion(chapter,marks){

    const list=getQuestions(chapter,marks);

    if(list.length===0)

        return null;

    return list[

        Math.floor(Math.random()*list.length)

    ];

}

// =====================================================
// Search Questions
// =====================================================

function searchQuestion(keyword){

    keyword=keyword.toLowerCase();

    return questionBank.filter(q=>

        q.question.toLowerCase().includes(keyword)

    );

}

// =====================================================
// Export Question Bank
// =====================================================

function exportQuestionBank(){

    console.log(

        JSON.stringify(questionBank,null,4)

    );

}

// =====================================================
// Load Existing Question Bank
// =====================================================

window.onload=function(){

    const saved=

    localStorage.getItem("questionBank");

    if(saved){

        questionBank=JSON.parse(saved);

        showStatistics();

    }

};

// =====================================================
// Debug Helper
// =====================================================

function showQuestionBank(){

    console.table(questionBank);

}
