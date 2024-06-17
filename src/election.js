// alert("Hello World");
// let body = document.getElementById("root");

// let header = document.createElement("h1");
// header.textContent = "Header";

// body.childNodes = header;

let last_result;

export async function load_constituencies() {
    let response = await fetch("./scaled.json");
    last_result = await response.json();

    // let result_list = document.getElementById("result_list");

    // for (result of last_result) {
    //     let entry = document.createElement("li")
    //     entry.textContent = result["Constituency name"]
    //     result_list.appendChild(entry)
    // }


}

export {last_result};
