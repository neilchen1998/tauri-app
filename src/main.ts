import { invoke } from "@tauri-apps/api/core";

interface DropdownOption {
  value: string;
  label: string;
}

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;
let dropdownMsgEl: HTMLElement | null;
let dropdownEl: HTMLSelectElement | null;

async function greet() {
  if (greetMsgEl && greetInputEl) {
    // Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
    greetMsgEl.textContent = await invoke("greet", {
      name: greetInputEl.value,
    });
  }
}

async function populateDropdown() {
  if (dropdownEl) {
    try {
      const options: DropdownOption[] = await invoke("get_dropdown_options");

      dropdownEl.innerHTML = '';

      options.forEach((option) => {
        const optionEl = document.createElement("option");

          optionEl.value = option.value;
          optionEl.textContent = option.label;
          dropdownEl?.appendChild(optionEl);
      })

    } catch (error) {
      console.error("Error fetching dropdown options: ", error);
    }
  }
}

async function handleDropdownChange() {
  if (dropdownEl && dropdownMsgEl) {
    try {
      dropdownMsgEl.textContent = await invoke("process_dropdown_value", { value: dropdownEl.value, });
    } catch (error) {
      dropdownMsgEl.textContent = "Error!";
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {

  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  dropdownMsgEl = document.querySelector("#selected-dropdown-msg");
  dropdownEl = document.querySelector("#my-dropdown");

  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });

  document.querySelector("#my-dropdown")?.addEventListener("focus", (e) => {
    e.preventDefault();
    populateDropdown();
  });

  document.querySelector("#dropdown-form")?.addEventListener("change", (e) => {
    e.preventDefault();
    handleDropdownChange();
  });

});
