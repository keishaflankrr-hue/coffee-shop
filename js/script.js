

document.addEventListener("DOMContentLoaded", function () {
    setupPageAnimation();
    setupMenuTabs();
    setupServingChoices();
    setupDrinkModal();
    setupAccordion();
    setupMap();
    setupEnquiryForm();
    setupGallery();
});


// The fades in when clicked.
function setupPageAnimation() {
    const main = document.querySelector("main");

    if (main) {
        main.classList.add("page enter");
    }
}


// MENU TABS
// One button shows one group of drinks. The other group hides.
function setupMenuTabs() {
    const menuTabs = document.querySelectorAll(".menu-tab");
    const menuSections = document.querySelectorAll(".menu-section");

    if (menuTabs.length === 0) {
        return;
    }

    menuTabs.forEach(function (tab) {
        tab.addEventListener("click", function () {
            menuTabs.forEach(function (button) {
                button.classList.remove("active");
                button.setAttribute("aria-selected", "false");
            });

            tab.classList.add("active");
            tab.setAttribute("aria-selected", "true");

            const target = tab.getAttribute("data-target");

            menuSections.forEach(function (section) {
                section.hidden = true;
                section.classList.remove("is-showing");
            });

            const chosen = document.getElementById(target);
            chosen.hidden = false;

            // Restart the small fade each time a tab opens.
            void chosen.offsetWidth;
            chosen.classList.add("is-showing");
        });
    });
}


// HOT OR ICED
// The words under the buttons change to match the click.
function setupServingChoices() {
    const choices = document.querySelectorAll(".serving-choice");

    choices.forEach(function (choice) {
        const buttons = choice.querySelectorAll(".serving-button");
        const feedback = choice.querySelector(".serving-feedback");

        buttons.forEach(function (button) {
            button.addEventListener("click", function () {
                buttons.forEach(function (other) {
                    other.classList.remove("selected");
                    other.setAttribute("aria-pressed", "false");
                });

                button.classList.add("selected");
                button.setAttribute("aria-pressed", "true");
                feedback.textContent = "Selected: " + button.textContent.trim();
            });
        });
    });
}


// DRINK POP-UP
// fills it with the drink when visitor clicks. 

function setupDrinkModal() {
    const items = document.querySelectorAll(".menu-item");

    if (items.length === 0) {
        return;
    }

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "drink-modal";

    const card = document.createElement("div"); card.className = "modal-card";
    card.setAttribute("role", "dialog");
    card.setAttribute("aria-modal", "true");
    card.setAttribute("aria-labelledby", "drink-modal-title");

    const closeButton = document.createElement("button");
closeButton.type = "button";
    closeButton.className = "modal-close";
 closeButton.textContent = "Close";

    const title = document.createElement("h2");
    title.id = "drink-modal-title";

    const price = document.createElement("p");
    price.className = "modal-price";

    const description = document.createElement("p");
    description.className = "modal-description";

    card.append(closeButton, title, price, description);
    modal.appendChild(card);
    document.body.appendChild(modal);

    function openModal(item) {
        title.textContent = item.querySelector("h3").textContent.trim();
        price.textContent = item.querySelector(".price").textContent.trim();
        description.textContent = item.querySelector(".menu-item-description").textContent.trim();
        modal.classList.add("is-open");
        closeButton.focus();
    }

    function closeModal() {
        modal.classList.remove("is-open");
    }

    items.forEach(function (item) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "details-button";
        button.textContent = "See this drink";
        item.appendChild(button);

        button.addEventListener("click", function () {
            openModal(item);
        });
    });

    closeButton.addEventListener("click", closeModal);

    modal.addEventListener("click", function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeModal();
        }
    });
}


// FAQ ACCORDION
// A question opens its answer. Click again and the answer closes.
function setupAccordion() {
    const triggers = document.querySelectorAll(".accordion-trigger");

    triggers.forEach(function (trigger) {
        trigger.addEventListener("click", function () {
            const item = trigger.closest(".accordion-item");
            const isOpen = item.classList.contains("is-open");

            item.classList.toggle("is-open", !isOpen);
            trigger.setAttribute("aria-expanded", String(!isOpen));
        });
    });
}


// MAP
//  draws a map in the empty box on the contact page.
function setupMap() {
    const mapContainer = document.getElementById("wabi-map");

    if (!mapContainer || typeof L === "undefined") {
        return;
    }

    const coffeeShopLocation = [-25.78453, 28.35335];

    const map = L.map("wabi-map", {
        scrollWheelZoom: false
    }).setView(coffeeShopLocation, 16);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    const coffeeIcon = L.divIcon({
        className: "wabi-map-marker",
        html: "<span>☕</span>",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -24]
    });

    const coffeeMarker = L.marker(coffeeShopLocation, {
        icon: coffeeIcon
    }).addTo(map);

    coffeeMarker.bindPopup(
        "<div class='wabi-popup'>" +
        "<strong>Wabi Sabi Coffee Shop</strong><br>" +
        "<span>Enjoy a little moment of calm.</span><br>" +
        "<small>Hazeldean Square · Pretoria East</small>" +
        "</div>"
    );

    coffeeMarker.openPopup();
}


// ENQUIRY FORM
// The form stays on the page and a thank-you sentence is added.
function setupEnquiryForm() {
    const form = document.querySelector(".enquiry-form form");

    if (!form) {
        return;
    }

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const name = document.getElementById("name").value.trim();
        let note = form.querySelector(".form-thanks");

        if (!note) {
            note = document.createElement("p");
            note.className = "form-thanks";
            note.setAttribute("role", "status");
            form.appendChild(note);
        }

        note.textContent = "Thank you, " + name + ". We received your message.";
    });
}


// 
// IMAGE GALLERY AND LIGHTBOX
// 

document.addEventListener("DOMContentLoaded", function () {

    // Select gallery elements
    const gallery = document.querySelector(".gallery-grid");

    const lightbox = document.getElementById("lightbox");

    const enlargedImage = document.getElementById("lightbox-image");

    const caption = document.getElementById("lightbox-caption");

    const closeButton = document.getElementById("lightbox-close");


    // Check that the gallery elements exist
    if (!gallery || !lightbox || !enlargedImage ||
        !caption || !closeButton) {
        return;
    }


    // Remember the last clicked image
    let previousFocus = null;


    // FUNCTION TO OPEN THE LIGHTBOX

    function openLightbox(item) {

        const image = item.querySelector("img");

        if (!image) return;

        previousFocus = item;

        // Display the selected image
        enlargedImage.src = item.dataset.full || image.src;

        // Display image description
        enlargedImage.alt = image.alt;

        // Display caption
        caption.textContent = item.dataset.caption || image.alt;

        // Show lightbox
        lightbox.hidden = false;

        // Prevent background scrolling
        document.body.classList.add("lightbox-open");

        // Focus close button
        closeButton.focus();

    }


    // FUNCTION TO CLOSE THE LIGHTBOX

    function closeLightbox() {

        lightbox.hidden = true;

        document.body.classList.remove("lightbox-open");

        // Clear enlarged image
        enlargedImage.src = "";

        // Return focus to previously selected image
        if (previousFocus) {
            previousFocus.focus();
        }

    }


    // CLICK AN IMAGE TO OPEN IT

    gallery.addEventListener("click", function (event) {

        const item = event.target.closest(".gallery-item");

        if (!item) return;

        openLightbox(item);

    });


    // CLICK CLOSE BUTTON

    closeButton.addEventListener("click", function () {

        closeLightbox();

    });


    // CLICK OUTSIDE IMAGE TO CLOSE

    lightbox.addEventListener("click", function (event) {

        if (event.target === lightbox) {

            closeLightbox();

        }

    });


    // PRESS ESCAPE TO CLOSE

    document.addEventListener("keydown", function (event) {

        if (event.key === "Escape" && !lightbox.hidden) {

            closeLightbox();

        }

    });

});

// Filter by category and search text 
const searchText = "mouse";
const selectedCategory = "Electronics";

const filtered = products.filter(item => {
  const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
  const matchesSearch = item.name.toLowerCase().includes(searchText.toLowerCase());
  return matchesCategory && matchesSearch;
});

 // MENU SEARCH AND SORT// 

document.addEventListener("DOMContentLoaded", function () {

    // Find the search and sorting elements
    const searchInput = document.getElementById("menu-search");

    const sortSelect = document.getElementById("menu-sort");

    // Find all menu sections
    const sections = document.querySelectorAll(".menu-section");

    // Check whether these elements exist
    if (!searchInput || !sortSelect || sections.length === 0) {
        return;
    }

    // Store the original menu items
    const menuGroups = Array.from(sections).map(function (section) {

        return {
            section: section,
            items: Array.from(section.querySelectorAll(".menu-item"))
        };

    });


    // Function to search and sort the menu
    function updateMenu() {

        const query = searchInput.value.toLowerCase().trim();

        const sortBy = sortSelect.value;


        menuGroups.forEach(function (group) {

         // Filter menu items
            const matchingItems = group.items.filter(function (item) {

                return item.textContent.toLowerCase().includes(query);

            });


            // Sort menu items
            matchingItems.sort(function (a, b) {

                const nameA = a.querySelector("h3").textContent.trim();

                const nameB = b.querySelector("h3").textContent.trim();

                const priceA = Number(
                    a.querySelector(".price").textContent.replace(/[^\d.]/g, "")
                );

                const priceB = Number(
                    b.querySelector(".price").textContent.replace(/[^\d.]/g, "")
                );


                if (sortBy === "name") {
                    return nameA.localeCompare(nameB);
                }

                if (sortBy === "price-asc") {
                    return priceA - priceB;
              }

            if (sortBy === "price-desc") {
                    return priceB - priceA;
              }

                return group.items.indexOf(a) - group.items.indexOf(b);

            });


            // Hide products that don't match
            group.items.forEach(function (item) {

                item.hidden = !matchingItems.includes(item);

            });


            // Display matching products in the new order
            matchingItems.forEach(function (item) {

                group.section.appendChild(item);

            });

        });

    }


    // Listen for search input
    searchInput.addEventListener("input", updateMenu);


    // Listen for sorting changes
    sortSelect.addEventListener("change", updateMenu);


    // Initial menu display
    updateMenu();

});