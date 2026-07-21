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

    questionBank = [];

    let currentChapter = "General";

    let currentMarks = 1;

    const lines = text.split(/\r?\n/);

    lines.forEach(function(line){

        line = line.trim();

        if(line === "") return;

        if(line.toUpperCase().startsWith("CHAPTER")){

            currentChapter = line.replace(/chapter\s*:?\s*/i,"");

            return;

        }

        const section = line.match(/SECTION\s*([A-E])/i);

        if(section){

            const map = {
                A:1,
                B:2,
                C:3,
                D:4,
                E:5
            };

            currentMarks = map[section[1].toUpperCase()] || 1;

            return;

        }

        const mark = line.match(/^\[(\d)\]/);

        if(mark){

            currentMarks = parseInt(mark[1]);

            line = line.replace(/^\[\d\]\s*/,"");

        }

        if(/^(Q\.?\s*\d+|\d+[.)])/i.test(line)){

            line = line.replace(/^(Q\.?\s*\d+|\d+[.)])\s*/i,"");

            questionBank.push({

                chapter: currentChapter,

                marks: currentMarks,

                question: line

            });

        }

    });

    localStorage.setItem(
        "questionBank",
        JSON.stringify(questionBank)
    );

    const status = document.getElementById("status");

    if(questionBank.length>0){

        status.className="alert alert-success";

        status.innerHTML=
            questionBank.length+
            " questions imported successfully.";

    }else{

        status.className="alert alert-warning";

        status.innerHTML=
            "No questions detected in this DOCX file.";

    }

    console.log(questionBank);

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
