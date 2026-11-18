// This file is the behaviour of the website.
// Each function does one job. It first checks that the matching
// piece of the page is actually there, so the same file can load
// on every page without causing an error.

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


// The page gently fades in when it opens.
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
// JavaScript builds the pop-up box, then fills it with the drink
// the visitor clicked.
function setupDrinkModal() {
    const items = document.querySelectorAll(".menu-item");

    if (items.length === 0) {
        return;
    }

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.id = "drink-modal";

    const card = document.createElement("div");
    card.className = "modal-card";
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
// Leaflet draws a map in the empty box on the contact page.
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


// GALLERY AND LIGHTBOX
// The photo grid is built from a list. A click opens the big photo
// in a layer on top of the page.
function setupGallery() {
    const gallery = document.querySelector("#gallery");

    if (!gallery) {
        return;
    }

    const photos = [
        {
            src: "images/matcha bubbles.jpg",
            alt: "A matcha drink with bubbles on a wooden table"
        },
        {
            src: "images/barista.jpg",
            alt: "A barista preparing a drink"
        },
        {
            src: "images/matchapowder.jpg",
            alt: "A bowl of green matcha powder"
        },
        {
            src: "images/msgic matcha.jpg",
            alt: "A glass of iced matcha"
        }
    ];

    const lightbox = document.createElement("div");
    lightbox.className = "lightbox";

    const frame = document.createElement("div");
    frame.className = "lightbox-frame";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "lightbox-close";
    closeButton.textContent = "Close";

    const bigImage = document.createElement("img");
    bigImage.className = "lightbox-image";
    bigImage.alt = "";

    frame.append(closeButton, bigImage);
    lightbox.appendChild(frame);
    document.body.appendChild(lightbox);

    function closeLightbox() {
        lightbox.classList.remove("is-open");
    }

    photos.forEach(function (photo) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "gallery-item";

        const image = document.createElement("img");
        image.src = photo.src;
        image.alt = photo.alt;

        button.appendChild(image);
        gallery.appendChild(button);

        button.addEventListener("click", function () {
            bigImage.src = photo.src;
            bigImage.alt = photo.alt;
            lightbox.classList.add("is-open");
            closeButton.focus();
        });
    });

    closeButton.addEventListener("click", closeLightbox);

    lightbox.addEventListener("click", function (event) {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
            closeLightbox();
        }
    });
}
