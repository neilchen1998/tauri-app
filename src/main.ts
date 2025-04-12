import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';

interface DropdownOption {
  value: string;
  label: string;
}

async function sendTauriNotification() {
  let permissionGranted = await isPermissionGranted();

  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }

  if (permissionGranted) {
    sendNotification({ title: 'Tauri', body: 'Tauri is awesome!' });
  } else {
    console.log('Notification permission denied.');
    // Optionally inform the user that notifications are disabled.
  }
}

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;
let filepathMsgEl: HTMLElement | null;
let dropdownMsgEl: HTMLElement | null;
let dropdownEl: HTMLSelectElement | null;

async function save() {
  if (greetMsgEl && greetInputEl && dropdownMsgEl) {

    // constructs the payload
    // NOTE: all of the field names should match the struc defined in Rust
    const payload = {
      value1: greetInputEl.value,
      value2: dropdownMsgEl.textContent,
    }

    greetMsgEl.textContent = await invoke("save_file", {
      payload: payload
    });
  }
}

async function greet() {
  if (greetMsgEl && greetInputEl) {
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

async function clearAllFields() {

  // queries all input elements and sets them to blank
  const inputElements = document.querySelectorAll('input');
  inputElements.forEach(function(input) {
    input.value = '';
  });

  // queries all select elements and sets them to 0
  const selectElements = document.querySelectorAll('select');
  selectElements.forEach(function(select) {
    select.selectedIndex = 0;
  });

  // queries all clearable fields (specified in the class in HTML) and sets them to blank
  const clearableElements = document.querySelectorAll('.clearable-field');
  clearableElements.forEach(element => {
    element.textContent = '';
  });
}

async function openFile() {
  if (filepathMsgEl) {
    try {
      const selected = await open({
        multiple: false,
        directory: false,
        filters: [
          // { name: 'Text files', extensions: ['txt'] },
          // { name: 'All files', extensions: ['*'] },
          { name: 'Header files', extensions: ['hpp', 'h'] },
        ],
        title: 'Select a header file',
      });
  
      if (typeof selected === 'string') {
        filepathMsgEl.textContent = `Selected file: ${selected}`;
      } else if (selected === null) {
        filepathMsgEl.textContent = 'No file selected.';
      }
    } catch (error) {
      filepathMsgEl.textContent = `Error: ${error}`;
    }
  }
}

window.addEventListener("DOMContentLoaded", () => {

  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  dropdownMsgEl = document.querySelector("#selected-dropdown-msg");
  dropdownEl = document.querySelector("#my-dropdown");
  filepathMsgEl = document.getElementById('selected-filepath');

  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    greet();
  });

  document.querySelector("#save-file-button")?.addEventListener("click", (e) => {
    e.preventDefault();
    save();
  });

  document.querySelector("#clear-all-button")?.addEventListener("click", (e) => {
    e.preventDefault();
    clearAllFields();
  });

  document.querySelector("#my-dropdown")?.addEventListener("focus", (e) => {
    e.preventDefault();
    populateDropdown();
  });

  document.querySelector("#dropdown-form")?.addEventListener("change", (e) => {
    e.preventDefault();
    handleDropdownChange();
  });

  document.getElementById('open-file-button')?.addEventListener('click', async (e) => {
    e.preventDefault();
    openFile();
    sendTauriNotification();
  });

});
