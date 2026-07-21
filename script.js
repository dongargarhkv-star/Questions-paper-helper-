// Smart parser for AI Question Paper Generator

let questionBank = [];

function extractQuestions() {

    const input = document.getElementById("questionBank");

    if (!input || input.files.length === 0) {
        alert("Please select a DOCX file.");
        return;
    }

    const reader = new FileReader();

    reader.onload = function (event) {

        mammoth.extractRawText({
            arrayBuffer: event.target.result
        })
        .then(function(result){
            parseText(result.value);
        })
        .catch(function(error){
            console.error(error);

            document.getElementById("status").className = "alert alert-danger";
            document.getElementById("status").innerHTML =
                "Unable to read the DOCX file.";
        });

    };

    reader.readAsArrayBuffer(input.files[0]);

}

function parseText(text){

    questionBank=[];

    let currentChapter="General";

    let currentMarks=1;

    const lines=text.split(/\r?\n/);

    lines.forEach(line=>{

        line=line.trim();

        if(line==="") return;

        // Detect chapter

        if(/^chapter/i.test(line)){

            currentChapter=line.replace(/chapter\s*:?\s*/i,"").trim();

            return;

        }

        // Detect marks written at end

        let endMarks=line.match(/\((\d)\)\s*$/);

        if(endMarks){

            currentMarks=parseInt(endMarks[1]);

            line=line.replace(/\((\d)\)\s*$/,"").trim();

        }

        // Detect marks written like [3]

        let bracket=line.match(/^\[(\d)\]/);

        if(bracket){

            currentMarks=parseInt(bracket[1]);

            line=line.replace(/^\[\d\]/,"").trim();

        }

        // Remove Question Number

        line=line.replace(/^Q\.?\s*\d+\s*[\.:]?\s*/i,"");

        line=line.replace(/^\d+[\.)]\s*/,"");

        // Ignore headings

        if(line.length<5) return;

        // Save Question

        questionBank.push({

            chapter:currentChapter,

            marks:currentMarks,

            question:line

        });

    });

    localStorage.setItem(

        "questionBank",

        JSON.stringify(questionBank)

    );

    document.getElementById("status").className="alert alert-success";

    document.getElementById("status").innerHTML=

        questionBank.length+" Questions Imported Successfully";

}
function getQuestions(chapter,marks){

    return questionBank.filter(q=>

        q.chapter===chapter &&

        q.marks===marks

    );

}                question: question

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
