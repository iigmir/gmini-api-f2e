// https://ai.google.dev/tutorials/get_started_web
import { GoogleGenerativeAI } from "@google/generative-ai";
import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

// Web component
class ChattingConversationItem extends HTMLElement {
    constructor() {
        super();
        const template = document.getElementById("chatting-conversation-item-template").content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(template.cloneNode(true));
    }
};
customElements.define("chatting-conversation-item", ChattingConversationItem);

// Get API keys
const get_api_key = () => {
    return new Promise( (resolve, reject) => {
        const ajax = fetch("/env.json").then(r => r.json());
        ajax.then((response) => {
            resolve(response["GOOGLE_API"]);
        }).catch((e) => {
            console.error(e);
            reject("API key not attached. Get an API key and copy it into env.json");
        });
    } );
};

// Rendering function: Append item
const append_item = (input = { user: true, time: "1970-01-01 00:00:00", content: "Hello" }) => {
    const dom = document.createElement("chatting-conversation-item");

    // Set DOMs in the component by user setting
    const shadowRoot = dom.shadowRoot;
    // The main conversation
    shadowRoot.querySelector(".ts-conversation")
        .classList.toggle("is-self", input.user);
    // The avatar image
    const src = input.user ? "/assets/user.svg" : "/assets/gemini.svg";
    shadowRoot.querySelector("img.avatar")
        .setAttribute("src", src);

    // Add slots for the component
    function get_slots(input) {
        // COntent DOM
        const content = document.createElement("section");
        content.slot = "content";
        content.innerHTML = marked.parse(input.content);

        // TIme Dom
        const time = document.createElement("time");
        time.slot = "time";
        time.setAttribute("datetime", input.time);
        time.textContent = (new Date(input.time)).toLocaleString();

        return [content, time];
    }
    // dom.innerHTML = get_slots(input);
    const [content, time] = get_slots(input);
    dom.appendChild(content);
    dom.appendChild(time);

    // Now combine all togeter
    document.querySelector("#chatting-app-main-screen").appendChild(dom);
};

// Rendering function: Forms
const form_dom = document.querySelector("#chatting-app-prompt-form");
const toggle_form = (dom = new Element(), disabled = false) => {
    dom.classList.toggle("is-disabled", disabled);
    dom.toggleAttribute("disabled", disabled);
    dom.toggleAttribute("aria-disabled", disabled);
};
/**
 * Enable form controls
 */
const enable_form = () => {
    const doms = [...form_dom.querySelectorAll(".controlling-items")];
    doms.forEach(d => { toggle_form(d, false); });
};
/**
 * Disable form controls
 */
const disable_form = () => {
    const doms = [...form_dom.querySelectorAll(".controlling-items")];
    doms.forEach(d => { toggle_form(d, true); });
};

// AI actions
const run_ai = async (API_KEY = "YOUR_API_KEY", prompt = "Hello") => {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    // console.log(response);
    return response.text();
};

// Main actions
const sent_prompt = (event) => {
    event.preventDefault();
    const formdata = new FormData(event.target);
    const content = formdata.get("prompt");
    append_item({
        user: true,
        time: (new Date()).toISOString(),
        content: content,
    });
    disable_form();
    run_ai(sessionStorage.getItem("API_KEY"), content).then( (text) => {
        append_item({
            user: false,
            time: (new Date()).toISOString(),
            content: text,
        });
        enable_form();
        form_dom.reset();
    });
};
const main = () => {
    disable_form();
    get_api_key().then((apikey) => {
        form_dom.addEventListener("submit", sent_prompt);
        sessionStorage.setItem("API_KEY", apikey);
        enable_form();
    }).catch((e) => {
        console.error(e);
    });
};

// Finally let's do it
main();
