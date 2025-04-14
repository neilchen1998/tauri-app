import { invoke } from "@tauri-apps/api/core";

/**
* Loads a readable-and-writable table from a JSON file
* @param url - The url of the JSON file (w.r.t. the html file)
* @param tableID - The ID of the table
* @param caption - The caption of the table
*/
export async function loadReadWriteTable(url: string, tableID: string, caption: string): Promise<void> {
  
    // Get the target element
    const tableEl = document.getElementById(tableID);

    // Check if the table element exists
    if (!tableEl) {
        console.error(`Cannot find the table with an ID of ${tableID}`);
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
        console.error(`HTTP error: ${response.status}`);
        return;
    }

    const { headers, rows } = await response.json();

    if (!theadEl || !tbodyEl) {
        console.error(`Cannot find the table with an ID of ${tableID} that has thead or tbody`)
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

        // Make the last column editable
        trEl.lastElementChild?.setAttribute("contenteditable", "true");

        tbodyEl.appendChild(trEl);
    }
}
  
/**
 * Loads a read-only table from a JSON file
 * @param url - The url of the JSON file (w.r.t. the html file)
 * @param tableID - The ID of the table
 * @param caption - The caption of the table
 */
export async function loadReadOnlyTable(url: string, tableID: string, caption: string): Promise<void> {
    
    // Get the target element
    const tableEl = document.getElementById(tableID);

    // Check if the table element exists
    if (!tableEl) {
        console.error(`Cannot find the table with an ID of ${tableID}`);
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
        console.error(`HTTP error: ${response.status}`);
        return;
    }

    const { headers, rows } = await response.json();

    if (!theadEl || !tbodyEl) {
        console.error(`Cannot find the table with an ID of ${tableID} that has thead or tbody`)
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

/**
 * Saves the table
 * @param tableID - The ID of the table
 */
export async function saveTable(tableID: string) {

    // Get the target element
    const tableEl = document.getElementById(tableID);

    // Check if the table element exists
    if (!tableEl) {
        console.error(`Can not find the table with an ID of ${tableID}`);
        return;
    }

    // NOTE: getElementsByTagName returns a container even if there is only one element
    const tbodyEl = tableEl.getElementsByTagName('tbody');
    for (const body of tbodyEl) {
    for (const trEl of body.getElementsByTagName('tr')) {
        const tdEl = trEl.getElementsByTagName('td');

        const userIDElement = tdEl[0].textContent;
        let penultimateElement = tdEl[tdEl.length - 2].textContent;
        const lastElement = tdEl[tdEl.length - 1].textContent;

        console.log(`User ID: ${userIDElement}, penultimate: ${penultimateElement}, last: ${lastElement}`);

        // Construct the payload
        // NOTE: all of the field names should match the struc defined in Rust
        const payload = {
            key: penultimateElement,
            value: lastElement,
        }

        try {
            penultimateElement = await invoke("updated_entry", { payload: payload, });
            console.log(`Updated penultimate: ${penultimateElement}`);
        } catch (error) {
            console.error(`Cannot send the updated pair.`);
        }
    }
  }
}
