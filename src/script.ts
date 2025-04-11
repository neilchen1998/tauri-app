// script.ts

interface NavItem {
    text: string;
    href: string;
}

const navigationItems: NavItem[] = [
    { text: "Home", href: "home.html" },
    { text: "About", href: "about.html" },
    { text: "Services", href: "services.html" },
    { text: "Contact", href: "contact.html" }
];

document.addEventListener('DOMContentLoaded', () => {
    const navigationList = document.getElementById('navigation');
    const pageContentDiv = document.getElementById('page-content');

    if (navigationList && pageContentDiv) {
        navigationItems.forEach(item => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.textContent = item.text;
            link.href = item.href;
            link.addEventListener('click', (event) => {
                event.preventDefault(); // Prevent default link behavior
                loadPage(item.href, pageContentDiv);
            });
            listItem.appendChild(link);
            navigationList.appendChild(listItem);
        });

        // Load the initial page (e.g., home page)
        loadPage(navigationItems[0].href, pageContentDiv);
    } else {
        console.error("Navigation list or content div not found.");
    }
});

async function loadPage(url: string, targetElement: HTMLElement) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const html = await response.text();
        targetElement.innerHTML = html;
    } catch (error) {
        console.error("Failed to load page:", error);
        targetElement.innerHTML = `<p>Failed to load content from ${url}</p>`;
    }
}