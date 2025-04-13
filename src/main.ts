import { invoke } from "@tauri-apps/api/core";
import { open } from '@tauri-apps/plugin-dialog';
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from '@tauri-apps/plugin-notification';
import { readTextFile } from '@tauri-apps/plugin-fs';

interface DropdownOption {
  value: string;
  label: string;
}

let greetInputEl: HTMLInputElement | null;
let greetMsgEl: HTMLElement | null;
let filepathMsgEl: HTMLElement | null;
let dropdownMsgEl: HTMLElement | null;
let dropdownEl: HTMLSelectElement | null;
let headerFileTextAreaEl: HTMLTextAreaElement | null;

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

  if (headerFileTextAreaEl) {
    headerFileTextAreaEl.value = "Please select the header file.";
  }

  sessionStorage.clear();
}

async function openHeaderFile() {
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
  
      if (typeof selected === 'string' && headerFileTextAreaEl) {

        // Show the filepath
        filepathMsgEl.textContent = `Selected file: ${selected}`;

        try {
          // Read the content of the selected file
          const fileContent = await readTextFile(selected);

          // Cache the content in the session storage so it will presist throughout the session
          sessionStorage.setItem('fileContent', fileContent);

          // Set the value of the textarea
          headerFileTextAreaEl.value = fileContent;

        } catch (readError) {
          headerFileTextAreaEl.value = `Error reading file: ${readError}`;
        }
      } else if (selected === null) {
        filepathMsgEl.textContent = 'No file selected.';
      }
    } catch (error) {
      filepathMsgEl.textContent = `Error: ${error}`;
    }
  }
}

/**
* Gets the current page and marks it on the sidebar
*/
function markCurrentPage() {
  const currentPage = window.location.pathname.split('/').pop();
  const sidebarLinks = document.querySelectorAll('.sidebar a');
  sidebarLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('current-page');
      return;
    }
  });
}

async function loadTable(url: string, tableID: string, caption: string): Promise<void> {
  
  // Get the target element
  const tableEl = document.getElementById(tableID);

  // Check if the table element exists
  if (!tableEl) {
    console.error("Cannot find the table with an ID of ${}", tableID);
    return;
  }

  // Add the caption to the table
  const captionEl = document.createElement("caption");
  captionEl.textContent = caption;
  tableEl.insertBefore(captionEl, tableEl.firstChild);

  const theadEl = tableEl.querySelector("thead");
  const tbodyEl = tableEl.querySelector("tbody");

  const response = await fetch(url);

  if (!response.ok) {
    console.error("HTTP error: ${}", response.status);
    return;
  }

  const { headers, rows } = await response.json();

  if (!theadEl || !tbodyEl) {
    console.error("Cannot find the table with an ID of ${} that has thead or tbody", tableID);
    return;
  }

  // Clear the table
  theadEl.innerHTML = "<tr></tr>";
  tbodyEl.innerHTML = "";

  // Populate the headers
  for (const headerText of headers) {

    const thEl = document.createElement("th");

    thEl.textContent = headerText;
    theadEl.querySelector("tr")?.appendChild(thEl);
  }

  // Populate the rows (entries)
  for (const row of rows) {
    const trEl = document.createElement("tr");

    for (const cellText of row) {
      const tdEl = document.createElement("td");

      tdEl.textContent = cellText;
      trEl.appendChild(tdEl);
    }

    tbodyEl.appendChild(trEl);
  }
}

window.addEventListener("DOMContentLoaded", () => {

  loadTable("../src/data.json", "page3-table", "Employee");

  // Mark current page on the sidebar
  markCurrentPage();

  const storedContent = sessionStorage.getItem('fileContent');
  const textareaOnCurrentPage = document.getElementById('header-file-preview') as HTMLTextAreaElement | null;
  if (textareaOnCurrentPage && storedContent) {
    textareaOnCurrentPage.value = storedContent;
  }

  greetInputEl = document.querySelector("#greet-input");
  greetMsgEl = document.querySelector("#greet-msg");
  dropdownMsgEl = document.querySelector("#selected-dropdown-msg");
  dropdownEl = document.querySelector("#my-dropdown");
  filepathMsgEl = document.getElementById('selected-filepath');

  headerFileTextAreaEl = document.getElementById('header-file-preview') as HTMLTextAreaElement | null;

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
    openHeaderFile();
    sendTauriNotification();
  });
});
