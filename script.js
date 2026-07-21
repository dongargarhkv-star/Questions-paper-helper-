// ==========================================
// AI Question Paper Generator
// Developed by Amit Yerpude
// ==========================================

// Stores all extracted questions
let questionBank = [];

// ------------------------------------------
// Extract Questions from DOCX
// ------------------------------------------

function extractQuestions() {

    const fileInput = document.getElementById("questionBank");

    if (!fileInput.files.length) {

        alert("Please select a DOCX file.");

        return;

    }

    const file = fileInput.files[0];

    const reader = new FileReader();

    reader.onload = function(event) {

        mammoth.extractRawText({

            arrayBuffer: event.target.result

        })

        .then(function(result){

            processQuestionBank(result.value);

        })

        .catch(function(error){

            console.log(error);

            alert("Unable to read DOCX.");

        });

    };

    reader.readAsArrayBuffer(file);

}

// ------------------------------------------
// Read Question Bank
// ------------------------------------------

function processQuestionBank(text){

    questionBank = [];

    let currentChapter = "General";

    const lines = text.split("\n");

    lines.forEach(line=>{

        line = line.trim();

        if(line==="") return;

        // Detect Chapter

        if(line.toUpperCase().startsWith("CHAPTER")){

            currentChapter = line.replace("CHAPTER:","").trim();

            return;

        }

        // Detect Marks

        let match = line.match(/^\[(\d)\]/);

        if(match){

            let marks = parseInt(match[1]);

            let question = line.replace(match[0],"").trim();

            questionBank.push({

                chapter: currentChapter,

                marks: marks,

                question: question

            });

        }

    });

    // Save in Browser

    localStorage.setItem(

        "questionBank",

        JSON.stringify(questionBank)

    );

    document.getElementById("status").className="alert alert-success";

    document.getElementById("status").innerHTML=

        "<strong>"+questionBank.length+

        "</strong> Questions Imported Successfully.";

    console.log(questionBank);

}

// ------------------------------------------
// Get Available Chapters
// ------------------------------------------

function getChapters(){

    let chapters=[];

    questionBank.forEach(q=>{

        if(!chapters.includes(q.chapter))

            chapters.push(q.chapter);

    });

    return chapters;

}

// ------------------------------------------
// Get Questions by Chapter & Marks
// ------------------------------------------

function getQuestions(chapter,marks){

    return questionBank.filter(q=>

        q.chapter===chapter &&

        q.marks===marks

    );

}
