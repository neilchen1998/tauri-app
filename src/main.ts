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


// async function createDataTable(dataArray: any[], targetElementID: string) {

//   // Get the target element
//   const targetEl = document.getElementById(targetElementID);

//   // Check if the element exist
//   if (!targetEl) {
//     console.error('Target element with ID ${} not found', targetElementID);
//     return;
//   }

//   const table = document.createElement('table');

//   if (dataArray.length > 0 && typeof dataArray[0] === 'object') {
//     const thead = document.createElement('thead');
//     const tr = document.createElement('tr');

//     for (const key in dataArray[0]) {
//       if (Object.prototype.hasOwnProperty.call(dataArray[0], key)) {
//         const th = document.createElement('th');
//         th.textContent = key;
//         tr.appendChild(th);
//       }
//     }

//     thead.appendChild(tr);
//     table.appendChild(thead);
//   }

//   // Create the entries
//   const tbody = document.createElement('tbody');
//   dataArray.forEach((rowData: any) => {
//     const tr = document.createElement('tr');

//     if (Array.isArray(rowData)) {
//       rowData.forEach(cellData => {
//         const td = document.createElement('td');
//         td.textContent = String(cellData);
//         tr.appendChild(td);
//       })
//     }

//     tbody.appendChild(tr);
//   });

//   table.appendChild(tbody);

//   // Append the table that just created to the target element
//   targetEl.appendChild(table);
// }

async function createDataTable(
  dataArray: any[][], // Assuming dataArray is an array of arrays
  targetElementId: string
): Promise<void> {
  const targetElement = document.getElementById(targetElementId);
  if (!targetElement) {
    console.error(`Target element with ID '${targetElementId}' not found.`);
    return;
  }

  const table = document.createElement('table');

  // Option 1: Create a default header based on the number of columns in the first row
  if (dataArray.length > 0 && Array.isArray(dataArray[0])) {
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    for (let i = 0; i < dataArray[0].length; i++) {
      const th = document.createElement('th');
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    table.appendChild(thead);
  }

  const tbody = document.createElement('tbody');
  dataArray.forEach((rowData: any[]) => { // Assuming rowData is an array
    const row = document.createElement('tr');
    rowData.forEach(cellValue => {
      const cell = document.createElement('td');
      cell.textContent = String(cellValue);
      row.appendChild(cell);
    });
    tbody.appendChild(row);
  });
  table.appendChild(tbody);

  targetElement.appendChild(table);
}

window.addEventListener("DOMContentLoaded", () => {

  const tableData1 = [
    ['Name', 'Age', 'City'],
    ['Alice', 30, 'New York'],
    ['Bob', 25, 'Los Angeles'],
    ['Charlie', 35, 'Chicago']
  ];
  createDataTable(tableData1, 'tableContainer');

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
