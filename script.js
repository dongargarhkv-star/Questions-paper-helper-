/*=========================================================
 AI Question Paper Generator
 Developed by Amit Yerpude
 Part 1 : DOCX Reader & Smart Parser
=========================================================*/

// ----------------------------
// Global Variables
// ----------------------------

let questionBank = [];

const SECTION_MARKS = {
    "A": 1,
    "B": 2,
    "C": 3,
    "D": 4,
    "E": 5
};

// ----------------------------
// Upload DOCX
// ----------------------------

function extractQuestions() {

    const fileInput = document.getElementById("questionBank");

    if (!fileInput) {
        alert("Question Bank input not found.");
        return;
    }

    if (fileInput.files.length === 0) {
        alert("Please select a DOCX file.");
        return;
    }

    const file = fileInput.files[0];

    if (!file.name.toLowerCase().endsWith(".docx")) {
        alert("Only DOCX files are supported.");
        return;
    }

    updateStatus("Reading Question Bank...", "info");

    const reader = new FileReader();

    reader.onload = function (e) {

        mammoth.extractRawText({

            arrayBuffer: e.target.result

        })

        .then(function (result) {

            parseText(result.value);

        })

        .catch(function (error) {

            console.error(error);

            updateStatus(
                "Unable to read DOCX file.",
                "danger"
            );

        });

    };

    reader.readAsArrayBuffer(file);

}

// ----------------------------
// Status Box
// ----------------------------

function updateStatus(message, type = "info") {

    const status = document.getElementById("status");

    if (!status) return;

    status.className = "alert alert-" + type;

    status.innerHTML = message;

}

// ----------------------------
// Main Parser
// ----------------------------

function parseText(text) {

    questionBank = [];

    let currentChapter = "General";

    let currentMarks = 1;

    let currentSection = "A";

    const lines = cleanText(text);

    lines.forEach(function(line){

        // Detect Chapter

        if(isChapter(line)){

            currentChapter = getChapterName(line);

            return;

        }

        // Detect Section

        if(isSection(line)){

            currentSection = getSection(line);

            currentMarks = SECTION_MARKS[currentSection];

            return;

        }

        // Detect Marks

        let detectedMarks = detectMarks(line);

        if(detectedMarks !== null){

            currentMarks = detectedMarks;

            line = removeMarks(line);

        }

        // Extract Question

        let question = extractQuestion(line);

        if(question){

            questionBank.push({

                chapter: currentChapter,

                section: currentSection,

                marks: currentMarks,

                question: question

            });

        }

    });

    removeDuplicateQuestions();

    saveQuestionBank();

}

// ----------------------------
// Clean Text
// ----------------------------

function cleanText(text){

    return text

        .replace(/\r/g,"\n")

        .split("\n")

        .map(x=>x.trim())

        .filter(x=>x.length>0);

}

// ----------------------------
// Chapter Detection
// ----------------------------

function isChapter(line){

    return /^(chapter|unit|lesson)/i.test(line);

}

function getChapterName(line){

    return line

        .replace(/^(chapter|unit|lesson)\s*:?\s*/i,"")

        .trim();

}

// ----------------------------
// Section Detection
// ----------------------------

function isSection(line){

    return /^section\s+[A-E]/i.test(line);

}

function getSection(line){

    const match = line.match(/[A-E]/i);

    return match ? match[0].toUpperCase() : "A";

}

// ----------------------------
// Marks Detection
// ----------------------------

// -----------------------------------------
// Detect Marks from Section Headings
// -----------------------------------------

function detectMarks(line){

    line = line.trim().toLowerCase();

    // ------------------------
    // SECTION A-E
    // ------------------------

    if(line.includes("section a")) return 1;
    if(line.includes("section b")) return 2;
    if(line.includes("section c")) return 3;
    if(line.includes("section d")) return 4;
    if(line.includes("section e")) return 5;

    // ------------------------
    // Explicit Mark Headings
    // ------------------------

    if(line.includes("1 mark")) return 1;
    if(line.includes("one mark")) return 1;

    if(line.includes("2 mark")) return 2;
    if(line.includes("two marks")) return 2;

    if(line.includes("3 mark")) return 3;
    if(line.includes("three marks")) return 3;

    if(line.includes("4 mark")) return 4;
    if(line.includes("four marks")) return 4;

    if(line.includes("5 mark")) return 5;
    if(line.includes("five marks")) return 5;

    // ------------------------
    // CBSE Question Types
    // ------------------------

    if(line.includes("very short answer"))
        return 1;

    if(line.includes("short answer type i"))
        return 2;

    if(line.includes("short answer type ii"))
        return 3;

    if(line.includes("long answer"))
        return 5;

    if(line.includes("case study"))
        return 5;

    if(line.includes("source based"))
        return 4;

    if(line.includes("assertion"))
        return 1;

    // ------------------------
    // [1], [2], [3]
    // ------------------------

    let m = line.match(/^\[(\d)\]/);

    if(m)
        return parseInt(m[1]);

    // ------------------------
    // (3 Marks)
    // ------------------------

    m = line.match(/\((\d)\s*marks?\)/i);

    if(m)
        return parseInt(m[1]);

    // ------------------------
    // 3 Marks
    // ------------------------

    m = line.match(/(\d)\s*marks?/i);

    if(m)
        return parseInt(m[1]);

    return null;

}

function removeMarks(line){

    return line

        .replace(/^\[\d\]/,"")

        .replace(/\(\d\)\s*$/,"")

        .replace(/\d\s*marks?/i,"")

        .trim();

}
/*=========================================================
 Part 2 : Smart Question Extraction & Storage
=========================================================*/

// ----------------------------------------------------
// Extract Question from a Line
// ----------------------------------------------------

function extractQuestion(line){

    if(!line) return null;

    line = line.trim();

    // Remove question numbering

    line = line.replace(/^Q(?:uestion)?\.?\s*\d+\s*[:.)-]?\s*/i,"");

    line = line.replace(/^\d+\s*[.)-]\s*/,"");

    line = line.replace(/^[A-Z]\.\s*/,"");

    line = line.replace(/^[ivxlcdm]+\.\s*/i,"");

    // Remove bullets

    line = line.replace(/^[•●▪►■]\s*/,"");

    // Ignore headings

    if(ignoreLine(line))
        return null;

    // Very short line

    if(line.length < 8)
        return null;

    return line;

}

// ----------------------------------------------------
// Ignore unwanted lines
// ----------------------------------------------------

function ignoreLine(line){

    const ignorePatterns=[

        /^kendriya vidyalaya/i,

        /^pm shri/i,

        /^maximum marks/i,

        /^max marks/i,

        /^time allowed/i,

        /^time\s*:/i,

        /^class\s*:/i,

        /^subject\s*:/i,

        /^page\s+\d+/i,

        /^general instructions/i,

        /^instructions/i,

        /^section\s+[A-E]/i,

        /^chapter/i,

        /^unit/i,

        /^lesson/i,

        /^computer science/i,

        /^sample question bank/i

    ];

    return ignorePatterns.some(pattern=>pattern.test(line));

}

// ----------------------------------------------------
// Remove Duplicate Questions
// ----------------------------------------------------

function removeDuplicateQuestions(){

    const unique=[];

    const seen=new Set();

    questionBank.forEach(q=>{

        const key=q.question.toLowerCase().trim();

        if(!seen.has(key)){

            seen.add(key);

            unique.push(q);

        }

    });

    questionBank=unique;

}

// ----------------------------------------------------
// Save Question Bank
// ----------------------------------------------------

function saveQuestionBank(){

    localStorage.setItem(

        "questionBank",

        JSON.stringify(questionBank)

    );

    showStatistics();

}

// ----------------------------------------------------
// Statistics
// ----------------------------------------------------

function showStatistics(){

    let chapters=new Set();

    let markCount={

        1:0,

        2:0,

        3:0,

        4:0,

        5:0

    };

    questionBank.forEach(q=>{

        chapters.add(q.chapter);

        if(markCount[q.marks]!=undefined)

            markCount[q.marks]++;

    });

    updateStatus(

        `
        <h5>Question Bank Loaded Successfully</h5>

        <hr>

        <b>Total Questions :</b> ${questionBank.length}<br>

        <b>Total Chapters :</b> ${chapters.size}<br><br>

        <b>1 Mark :</b> ${markCount[1]}<br>

        <b>2 Marks :</b> ${markCount[2]}<br>

        <b>3 Marks :</b> ${markCount[3]}<br>

        <b>4 Marks :</b> ${markCount[4]}<br>

        <b>5 Marks :</b> ${markCount[5]}

        `,

        "success"

    );

}

// ----------------------------------------------------
// Get All Chapters
// ----------------------------------------------------

function getChapters(){

    const chapters=[];

    questionBank.forEach(q=>{

        if(!chapters.includes(q.chapter))

            chapters.push(q.chapter);

    });

    return chapters;

}

// ----------------------------------------------------
// Get Questions
// ----------------------------------------------------

function getQuestions(chapter,marks){

    return questionBank.filter(q=>

        q.chapter===chapter &&

        q.marks===marks

    );

}

// ----------------------------------------------------
// Debug Helper
// ----------------------------------------------------

function showQuestionBank(){

    console.table(questionBank);

}

// ----------------------------------------------------
// Load Existing Question Bank
// ----------------------------------------------------

window.onload=function(){

    const saved=

        localStorage.getItem("questionBank");

    if(saved){

        questionBank=JSON.parse(saved);

        if(questionBank.length>0)

            showStatistics();

    }

};
/*=========================================================
 Part 3 : Smart Detection & Utility Functions
=========================================================*/

// --------------------------------------------------
// Detect Question Type
// --------------------------------------------------

function detectQuestionType(question){

    const q = question.toLowerCase();

    if(q.includes("assertion") && q.includes("reason"))
        return "Assertion-Reason";

    if(q.includes("case study"))
        return "Case Study";

    if(q.includes("mcq"))
        return "MCQ";

    if(q.includes("write a program"))
        return "Programming";

    if(q.includes("python"))
        return "Programming";

    if(q.includes("sql"))
        return "Database";

    return "Theory";

}

// --------------------------------------------------
// Assign Question Type
// --------------------------------------------------

function classifyQuestions(){

    questionBank.forEach(q=>{

        q.type = detectQuestionType(q.question);

    });

}

// --------------------------------------------------
// Validate Question Bank
// --------------------------------------------------

function validateQuestionBank(){

    questionBank = questionBank.filter(q=>{

        if(!q.question) return false;

        if(q.question.length<8) return false;

        if(!q.chapter) q.chapter="General";

        if(!q.marks) q.marks=1;

        return true;

    });

}

// --------------------------------------------------
// Sort Questions
// --------------------------------------------------

function sortQuestionBank(){

    questionBank.sort((a,b)=>{

        if(a.chapter===b.chapter)

            return a.marks-b.marks;

        return a.chapter.localeCompare(b.chapter);

    });

}

// --------------------------------------------------
// Marks Statistics
// --------------------------------------------------

function marksStatistics(){

    let result={};

    questionBank.forEach(q=>{

        if(!result[q.marks])

            result[q.marks]=0;

        result[q.marks]++;

    });

    return result;

}

// --------------------------------------------------
// Chapter Statistics
// --------------------------------------------------

function chapterStatistics(){

    let result={};

    questionBank.forEach(q=>{

        if(!result[q.chapter])

            result[q.chapter]=0;

        result[q.chapter]++;

    });

    return result;

}

// --------------------------------------------------
// Search Questions
// --------------------------------------------------

function searchQuestion(keyword){

    keyword=keyword.toLowerCase();

    return questionBank.filter(q=>

        q.question.toLowerCase().includes(keyword)

    );

}

// --------------------------------------------------
// Random Question
// --------------------------------------------------

function randomQuestion(chapter,marks){

    const list=getQuestions(chapter,marks);

    if(list.length===0)

        return null;

    return list[

        Math.floor(Math.random()*list.length)

    ];

}

// --------------------------------------------------
// Export Question Bank
// --------------------------------------------------

function exportQuestionBank(){

    console.log(

        JSON.stringify(questionBank,null,4)

    );

}

// --------------------------------------------------
// Reset Question Bank
// --------------------------------------------------

function clearQuestionBank(){

    if(confirm("Delete uploaded Question Bank?")){

        questionBank=[];

        localStorage.removeItem("questionBank");

        updateStatus(

            "Question Bank Deleted.",

            "warning"

        );

    }

}

// --------------------------------------------------
// Final Processing
// --------------------------------------------------

function finalizeQuestionBank(){

    validateQuestionBank();

    removeDuplicateQuestions();

    classifyQuestions();

    sortQuestionBank();

    saveQuestionBank();

    console.log(

        "Question Bank Ready",

        questionBank

    );

}
