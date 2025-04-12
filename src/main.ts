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

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;
let filepathMsgEl: HTMLElement | null;
let dropdownMsgEl: HTMLElement | null;
let dropdownEl: HTMLSelectElement | null;

async function sendTauriNotification() {

  // Check if the permission to send notifications is granted
  let permissionGranted = await isPermissionGranted();

  // Request for permission is the permission is not granted
  if (!permissionGranted) {
    const permission = await requestPermission();
    permissionGranted = permission === 'granted';
  }

  // Send a notification
  if (permissionGranted) {
    sendNotification({ title: 'Tauri', body: 'Tauri is awesome!' });
  } else {
    console.log('Notification permission denied.');
  }
}

async function save() {
  if (greetMsgEl && greetInputEl && dropdownMsgEl) {

    // Construct the payload
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

  // Check if both elements are not null
  if (greetMsgEl && greetInputEl) {
    greetMsgEl.textContent = await invoke("greet", {
      name: greetInputEl.value,
    });
  }
}

async function populateDropdown() {
  if (dropdownEl) {
    try {

      // Get the dropdown action from the backend
      const options: DropdownOption[] = await invoke("get_dropdown_options");

      dropdownEl.innerHTML = '';

      // Loop through each option and append it to the element
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

/**
* Gets the value that the user selects and sends it to the backend.
*/
async function handleDropdownChange() {
  if (dropdownEl && dropdownMsgEl) {
    try {
      dropdownMsgEl.textContent = await invoke("process_dropdown_value", { value: dropdownEl.value, });
    } catch (error) {
      dropdownMsgEl.textContent = "Error!";
    }
  }
}

/**
* Clears all the input arguments, selected elements, and clearable fields.
*/
async function clearAllFields() {
  // Query all input elements and sets them to blank
  const inputElements = document.querySelectorAll('input');
  inputElements.forEach(function(input) {
    input.value = '';
  });

  // Query all selected elements and sets them to 0
  const selectElements = document.querySelectorAll('select');
  selectElements.forEach(function(select) {
    select.selectedIndex = 0;
  });

  // Query all clearable fields (specified in the class in HTML) and sets them to blank
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
          { name: 'Header files', extensions: ['hpp', 'h'] },
          // { name: 'Text files', extensions: ['txt'] },
          // { name: 'All files', extensions: ['*'] },
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

  // Get the current page that the user is on
  const currentPage = window.location.pathname.split('/').pop();

  // Search through all anchor elements within sidebar
  const sidebarLinks = document.querySelectorAll('.sidebar a');

  // Iterates through all of them and mark them as 'current-page'
  // which then the css will take care of the style
  sidebarLinks.forEach(link => {
      if (link.getAttribute('href') === currentPage) {
          link.classList.add('current-page');
      }
  });

});
