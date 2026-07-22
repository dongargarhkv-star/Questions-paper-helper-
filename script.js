/*=========================================================
 AI Question Paper Generator
 Parser Version 3.0
 Part 1 : Global Variables & DOCX Reader
=========================================================*/

// ======================================================
// Global Variables
// ======================================================

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

// ======================================================
// Upload DOCX
// ======================================================

function extractQuestions(){

    const input = document.getElementById("questionBank");

    if(!input){

        alert("Question Bank input not found.");
        return;

    }

    if(input.files.length===0){

        alert("Please select a DOCX file.");
        return;

    }

    const file=input.files[0];

    if(!file.name.toLowerCase().endsWith(".docx")){

        alert("Only DOCX files are supported.");
        return;

    }

    updateStatus("Reading DOCX file...","info");

    const reader=new FileReader();

    reader.onload=function(e){

        mammoth.extractRawText({

            arrayBuffer:e.target.result

        })

        .then(function(result){

            console.clear();

            console.log("========== RAW TEXT ==========");
            console.log(result.value);
            console.log("==============================");

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

// ======================================================
// Status Box
// ======================================================

function updateStatus(message,type="info"){

    const box=document.getElementById("status");

    if(!box) return;

    box.className="alert alert-"+type;

    box.innerHTML=message;

}

// ======================================================
// Start Parser
// ======================================================

function startParser(rawText){

    questionBank=[];

    currentChapter="General";
    currentSection="A";
    currentMarks=1;

    const lines = rawText

        .replace(/\r/g,"")

        .split("\n")

        .map(x=>x.replace(/\uFEFF/g,"").trim())

        .filter(x=>x.length>0);

    console.log("Total Lines :",lines.length);

    parseLines(lines);

}
/*=========================================================
 AI Question Paper Generator
 Parser Version 3.0
 Part 2 : Smart Line Parser
=========================================================*/

// ======================================================
// Parse Every Line
// ======================================================

function parseLines(lines){

    lines.forEach(function(line){

        console.log("Reading :",line);

        // -------------------------
        // Chapter
        // -------------------------

        if(isChapter(line)){

            currentChapter = extractChapter(line);

            console.log("Chapter :",currentChapter);

            return;

        }

        // -------------------------
        // Section
        // -------------------------

        if(isSection(line)){

            currentSection = extractSection(line);

            currentMarks = SECTION_MARKS[currentSection];

            console.log("Section :",currentSection);

            return;

        }

        // -------------------------
        // Marks written inside heading
        // -------------------------

        let marks = detectMarks(line);

        if(marks!==null && isMarksHeading(line)){

            currentMarks = marks;

            return;

        }

        // -------------------------
        // Question
        // -------------------------

        if(isQuestion(line)){

            let m = detectMarks(line);

            if(m!==null)
                currentMarks=m;

            questionBank.push({

                chapter:currentChapter,

                section:currentSection,

                marks:currentMarks,

                type:detectQuestionType(line),

                question:cleanQuestion(line)

            });

            console.log("Question Added :",line);

        }

    });

    finalizeQuestionBank();

}

// ======================================================
// Detect Chapter
// ======================================================

function isChapter(line){

    line=line.toLowerCase();

    return (

        line.startsWith("chapter") ||

        line.startsWith("unit")

    );

}

function extractChapter(line){

    return line

        .replace(/^chapter\s*:?/i,"")

        .replace(/^unit\s*:?/i,"")

        .trim();

}

// ======================================================
// Detect Section
// ======================================================

function isSection(line){

    return /^section\s+[a-e]/i.test(line);

}

function extractSection(line){

    const m=line.match(/[A-E]/i);

    if(m)

        return m[0].toUpperCase();

    return "A";

}

// ======================================================
// Detect Marks
// ======================================================

function detectMarks(line){

    const m=line.match(/\((\d)\s*marks?\)/i);

    if(m)

        return parseInt(m[1]);

    if(line.match(/\b1\s*mark\b/i))
        return 1;

    if(line.match(/\b2\s*marks?\b/i))
        return 2;

    if(line.match(/\b3\s*marks?\b/i))
        return 3;

    if(line.match(/\b4\s*marks?\b/i))
        return 4;

    if(line.match(/\b5\s*marks?\b/i))
        return 5;

    return null;

}

// ======================================================
// Marks Heading
// ======================================================

function isMarksHeading(line){

    line=line.toLowerCase();

    return (

        line.startsWith("section a") ||

        line.startsWith("section b") ||

        line.startsWith("section c") ||

        line.startsWith("section d") ||

        line.startsWith("section e")

    );

}

// ======================================================
// Detect Question
// ======================================================

function isQuestion(line){

    return (

        /^q\s*\d+/i.test(line) ||

        /^q\d+/i.test(line) ||

        /^question\s*\d+/i.test(line) ||

        /^\d+\./.test(line) ||

        /^\d+\)/.test(line)

    );

}

// ======================================================
// Remove Question Number
// ======================================================

function cleanQuestion(line){

    return line

        .replace(/^q\s*\d+\.?\s*/i,"")

        .replace(/^question\s*\d+\.?\s*/i,"")

        .replace(/^\d+\.\s*/,"")

        .replace(/^\d+\)\s*/,"")

        .trim();

}
/*=========================================================
 AI Question Paper Generator
 Parser Version 3.0
 Part 3 : Validation & Question Processing
=========================================================*/

// ======================================================
// Ignore unwanted lines
// ======================================================

function ignoreLine(line){

    line=line.toLowerCase().trim();

    const ignore=[

        "kendriya vidyalaya",
        "pm shri",
        "class xii",
        "class 12",
        "computer science",
        "question bank",
        "sample paper",
        "maximum marks",
        "time allowed",
        "general instructions",
        "instructions",
        "page"

    ];

    return ignore.some(x=>line.includes(x));

}

// ======================================================
// Detect Question Type
// ======================================================

function detectQuestionType(question){

    const q=question.toLowerCase();

    if(q.includes("assertion"))
        return "Assertion";

    if(q.includes("reason"))
        return "Assertion";

    if(q.includes("mcq"))
        return "MCQ";

    if(q.includes("choose"))
        return "MCQ";

    if(q.includes("sql"))
        return "SQL";

    if(q.includes("query"))
        return "SQL";

    if(q.includes("python"))
        return "Programming";

    if(q.includes("program"))
        return "Programming";

    if(q.includes("output"))
        return "Programming";

    if(q.includes("case study"))
        return "Case Study";

    return "Theory";

}

// ======================================================
// Detect Difficulty
// ======================================================

function detectDifficulty(question){

    const words=question.split(/\s+/).length;

    if(words<=8)
        return "Easy";

    if(words<=18)
        return "Medium";

    return "Hard";

}

// ======================================================
// Validate Question Bank
// ======================================================

function validateQuestions(){

    questionBank=questionBank.filter(function(q){

        if(!q.question)
            return false;

        if(ignoreLine(q.question))
            return false;

        if(q.question.length<8)
            return false;

        q.question=q.question.trim();

        q.type=detectQuestionType(q.question);

        q.difficulty=detectDifficulty(q.question);

        if(!q.chapter)
            q.chapter="General";

        if(!q.section)
            q.section="A";

        if(!q.marks)
            q.marks=1;

        return true;

    });

}

// ======================================================
// Remove Duplicate Questions
// ======================================================

function removeDuplicates(){

    const seen=new Set();

    questionBank=questionBank.filter(function(q){

        const key=q.question.toLowerCase().trim();

        if(seen.has(key))
            return false;

        seen.add(key);

        return true;

    });

}

// ======================================================
// Sort Question Bank
// ======================================================

function sortQuestionBank(){

    questionBank.sort(function(a,b){

        if(a.chapter!==b.chapter)
            return a.chapter.localeCompare(b.chapter);

        if(a.marks!==b.marks)
            return a.marks-b.marks;

        return a.question.localeCompare(b.question);

    });

}

// ======================================================
// Finalize Question Bank
// ======================================================

function finalizeQuestionBank(){

    console.log("Questions Before Validation");

    console.table(questionBank);

    validateQuestions();

    removeDuplicates();

    sortQuestionBank();

    saveQuestionBank();

}
/*=========================================================
 AI Question Paper Generator
 Parser Version 3.0
 Part 4 : Storage, Statistics & Utility Functions
=========================================================*/

// ======================================================
// Save Question Bank
// ======================================================

function saveQuestionBank(){

    localStorage.setItem(
        "questionBank",
        JSON.stringify(questionBank)
    );

    showStatistics();

}

// ======================================================
// Show Statistics
// ======================================================

function showStatistics(){

    const chapters=new Set();

    const marksCount={
        1:0,
        2:0,
        3:0,
        4:0,
        5:0
    };

    questionBank.forEach(function(q){

        chapters.add(q.chapter);

        if(marksCount[q.marks]!==undefined)
            marksCount[q.marks]++;

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

// ======================================================
// Get Chapters
// ======================================================

function getChapters(){

    return [...new Set(questionBank.map(q=>q.chapter))];

}

// ======================================================
// Get Questions
// ======================================================

function getQuestions(chapter,marks){

    return questionBank.filter(function(q){

        return (

            q.chapter===chapter &&

            q.marks===marks

        );

    });

}

// ======================================================
// Random Question
// ======================================================

function randomQuestion(chapter,marks){

    const list=getQuestions(chapter,marks);

    if(list.length===0)
        return null;

    return list[
        Math.floor(Math.random()*list.length)
    ];

}

// ======================================================
// Search Question
// ======================================================

function searchQuestion(keyword){

    keyword=keyword.toLowerCase();

    return questionBank.filter(function(q){

        return q.question
                .toLowerCase()
                .includes(keyword);

    });

}

// ======================================================
// Export Question Bank
// ======================================================

function exportQuestionBank(){

    console.log(

        JSON.stringify(questionBank,null,4)

    );

}

// ======================================================
// Load Existing Question Bank
// ======================================================

window.onload=function(){

    const saved=localStorage.getItem("questionBank");

    if(saved){

        questionBank=JSON.parse(saved);

        showStatistics();

    }

};

// ======================================================
// Debug Helper
// ======================================================

function showQuestionBank(){

    console.table(questionBank);

}
