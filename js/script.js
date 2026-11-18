// INTERACTIVE MENU TABS

// Select all menu tab buttons
const menuTabs = document.querySelectorAll(".menu-tab");

// Select all menu sections
const menuSections = document.querySelectorAll(".menu-section");

// Loop through each tab
menuTabs.forEach(function(tab) {

    // Listen for a click
    tab.addEventListener("click", function() {

        // Remove active class from all buttons
        menuTabs.forEach(function(button) {
            button.classList.remove("active");
            button.setAttribute("aria-selected", "false");
        });

        // Add active class to clicked button
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");

        // Get the target section
        const target = tab.getAttribute("data-target");

        // Hide all menu sections
        menuSections.forEach(function(section) {
            section.hidden = true;
        });

        // Show the selected menu section
        document.getElementById(target).hidden = false;

    });

});