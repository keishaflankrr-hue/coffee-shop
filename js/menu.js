/* ==========================================================
   WABI SABI — dynamic menu (menu page only), vanilla JavaScript

   1. DYNAMIC CONTENT   the menu is loaded from data/menu.json with fetch()
                        and built on the page with the DOM API
   2. SEARCH            type to filter by name, description or category
   3. FILTER            category tabs (All / Matcha / Coffee)
   4. SORT              menu order, name A-Z / Z-A, price low-high / high-low

   To change the menu, edit data/menu.json. This file doesn't need to change.
   ========================================================== */

(function () {
  'use strict';

  var results = document.getElementById('menu-results');
  if (!results) return;

  var DATA_URL = 'data/menu.json';
  var SORTS = ['default', 'name-asc', 'name-desc', 'price-asc', 'price-desc'];

  var tabList = document.querySelector('.menu-tabs');
  var toolbar = document.querySelector('.menu-toolbar');
  var searchInput = document.getElementById('menu-search');
  var sortSelect = document.getElementById('menu-sort');
  var countLabel = document.getElementById('menu-count');

  var categories = [];     // [{ id, label }]
  var items = [];          // every drink from the JSON file
  var tabs = [];           // the tab buttons we create
  var chosenTemperature = {};   // remembers Hot/Iced picks, even when the list redraws
  var eventsBound = false;

  // Everything the visitor controls lives in one object
  var state = { category: 'all', query: '', sort: 'default' };


  /* ---------- Small helpers ---------- */

  // Create an element with an optional class and text
  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  // Lower-case and strip accents so "Café" matches "cafe"
  function normalize(text) {
    return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function countText(n) {
    return n + (n === 1 ? ' drink' : ' drinks');
  }

  function categoryLabel(id) {
    var match = categories.filter(function (c) { return c.id === id; })[0];
    return match ? match.label : id;
  }

  /* Wrap the matching part of a piece of text in <mark>.
     Text nodes are used (not innerHTML), so nothing typed into the
     search box can ever be treated as HTML. */
  function highlight(text, regex) {
    var fragment = document.createDocumentFragment();
    if (!regex) { fragment.append(text); return fragment; }

    var last = 0;
    text.replace(regex, function (match, offset) {
      fragment.append(text.slice(last, offset));
      fragment.append(el('mark', null, match));
      last = offset + match.length;
      return match;
    });
    fragment.append(text.slice(last));
    return fragment;
  }


  /* ========================================================
     1. DYNAMIC CONTENT: fetch the data, then build the page
     ======================================================== */

  function load() {
    results.setAttribute('aria-busy', 'true');
    results.replaceChildren(el('p', 'menu-loading', 'Loading the menu…'));
    countLabel.textContent = '';

    fetch(DATA_URL)
      .then(function (response) {
        if (!response.ok) throw new Error('The server answered ' + response.status);
        return response.json();
      })
      .then(function (data) {
        categories = data.categories;
        items = data.items.map(function (item) {
          // One searchable string per drink, prepared once
          item.search = normalize(item.name + ' ' + item.description + ' ' + categoryLabel(item.category));
          return item;
        });
        start();
      })
      .catch(showError);
  }

  function showError(error) {
    // For you, the developer: fetch() is blocked when a page is opened straight from the
    // computer (file://). Use a local server such as the VS Code "Live Server" extension.
    console.error('Could not load ' + DATA_URL + '. If this page was opened as a file, run it through a local server instead.', error);

    var box = el('div', 'menu-empty');
    var retry = el('button', 'button button-outline', 'Try again');
    retry.type = 'button';
    retry.addEventListener('click', load);
    box.append(el('p', null, 'We couldn’t load the menu right now. Please check your connection and try again.'), retry);

    results.setAttribute('aria-busy', 'false');
    results.replaceChildren(box);
  }

  function start() {
    readUrl();
    searchInput.value = state.query;
    sortSelect.value = state.sort;
    buildTabs();
    if (!eventsBound) { bindEvents(); eventsBound = true; }
    results.setAttribute('aria-busy', 'false');
    render(true);
  }


  /* ========================================================
     3. FILTER: category tabs (built from the JSON categories)
     ======================================================== */

  function buildTabs() {
    tabList.replaceChildren();
    tabs = [{ id: 'all', label: 'All' }].concat(categories).map(function (category) {
      var button = el('button', 'menu-tab');
      button.type = 'button';
      button.id = 'tab-' + category.id;
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-controls', 'menu-results');
      button.setAttribute('data-category', category.id);
      button.append(el('span', null, category.label), el('span', 'menu-tab-count'));
      tabList.appendChild(button);
      return button;
    });
    markActiveTab();
  }

  function markActiveTab() {
    tabs.forEach(function (tab) {
      var isActive = tab.getAttribute('data-category') === state.category;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive) results.setAttribute('aria-labelledby', tab.id);
    });
  }

  function setCategory(id, moveFocus) {
    state.category = id;
    markActiveTab();
    if (moveFocus) document.getElementById('tab-' + id).focus();
    render(true);
    updateUrl();
  }


  /* ========================================================
     2 + 4. SEARCH AND SORT
     ======================================================== */

  function sortItems(list, mode) {
    var sorted = list.slice();                 // copy, so the original order is never lost
    function byName(a, b) { return a.name.localeCompare(b.name); }

    if (mode === 'name-asc')   sorted.sort(byName);
    if (mode === 'name-desc')  sorted.sort(function (a, b) { return byName(b, a); });
    if (mode === 'price-asc')  sorted.sort(function (a, b) { return (a.price - b.price) || byName(a, b); });
    if (mode === 'price-desc') sorted.sort(function (a, b) { return (b.price - a.price) || byName(a, b); });
    return sorted;                             // 'default' keeps the order from the JSON file
  }

  /* Search -> filter by category -> sort -> draw.
     Every control just changes `state` and calls render(). */
  function render(animate) {
    var queryText = state.query.trim();
    var terms = normalize(queryText).split(/\s+/).filter(Boolean);

    // 1. Search: every word typed must appear somewhere in the drink
    var searched = items.filter(function (item) {
      return terms.every(function (term) { return item.search.indexOf(term) !== -1; });
    });

    // 2. Show how many matches each tab holds (so a search never feels like it found nothing)
    tabs.forEach(function (tab) {
      var id = tab.getAttribute('data-category');
      var n = searched.filter(function (item) { return id === 'all' || item.category === id; }).length;
      tab.querySelector('.menu-tab-count').textContent = n;
    });

    // 3. Filter by the active tab, then 4. sort
    var visible = searched.filter(function (item) { return state.category === 'all' || item.category === state.category; });
    visible = sortItems(visible, state.sort);

    // 5. Draw
    var regex = terms.length
      ? new RegExp('(?:' + queryText.split(/\s+/).map(escapeRegExp).join('|') + ')', 'gi')
      : null;

    var list = el('div', 'menu-list' + (animate ? ' is-entering' : ''));
    if (visible.length) {
      visible.forEach(function (item, index) {
        list.appendChild(buildItem(item, regex, state.category === 'all', index));
      });
    } else {
      list.appendChild(buildEmpty(queryText));
    }

    var heading = el('h2', 'visually-hidden', 'Menu items');
    results.replaceChildren(heading, list);

    countLabel.textContent = visible.length === items.length
      ? countText(items.length) + ' on the menu'
      : 'Showing ' + visible.length + ' of ' + countText(items.length);
  }

  function buildItem(item, regex, showCategory, index) {
    var article = el('article', 'menu-item');
    article.style.setProperty('--i', Math.min(index, 8));      // used by the CSS to stagger the entrance

    var header = el('div', 'menu-item-header');
    var title = el('h3');
    var name = el('span', 'menu-item-name');
    name.appendChild(highlight(item.name, regex));
    title.appendChild(name);
    header.append(title, el('span', 'price', 'R' + item.price));

    var description = el('p', 'menu-item-description');
    description.appendChild(highlight(item.description, regex));

    article.append(header, description);
    if (showCategory) article.appendChild(el('p', 'menu-item-tag', categoryLabel(item.category)));
    if (item.temperature && item.temperature.length) article.appendChild(buildTemperature(item));
    return article;
  }

  // Hot / Iced buttons for drinks that offer a choice
  function buildTemperature(item) {
    var selected = chosenTemperature[item.id] || item.temperature[0];

    var wrapper = el('div', 'serving-choice');
    var label = el('p', 'serving-label', 'Choose your temperature:');
    label.id = 'temperature-label-' + item.id;

    var group = el('div', 'serving-buttons');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-labelledby', label.id);

    item.temperature.forEach(function (option) {
      var isSelected = option === selected;
      var button = el('button', 'serving-button' + (isSelected ? ' selected' : ''), option);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(isSelected));
      button.setAttribute('data-item-id', item.id);
      group.appendChild(button);
    });

    var feedback = el('p', 'serving-feedback', 'Selected: ' + selected);
    feedback.setAttribute('aria-live', 'polite');
    wrapper.append(label, group, feedback);
    return wrapper;
  }

  function buildEmpty(queryText) {
    var message = queryText
      ? 'No drinks match “' + queryText + '”' + (state.category !== 'all' ? ' in ' + categoryLabel(state.category) : '') + '.'
      : 'There’s nothing in this category yet.';

    var box = el('div', 'menu-empty');
    box.appendChild(el('p', null, message));

    if (queryText) {
      var clear = el('button', 'button button-outline', 'Clear search');
      clear.type = 'button';
      clear.addEventListener('click', function () {
        searchInput.value = '';
        state.query = '';
        render(true);
        updateUrl();
        searchInput.focus();
      });
      box.appendChild(clear);
    }
    return box;
  }


  /* ========================================================
     EVENTS
     ======================================================== */

  function bindEvents() {
    // Search as you type (waits 120 ms after the last key so it doesn't redraw on every letter)
    var timer;
    searchInput.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        state.query = searchInput.value;
        render(false);
        updateUrl();
      }, 120);
    });

    sortSelect.addEventListener('change', function () {
      state.sort = sortSelect.value;
      render(true);
      updateUrl();
    });

    // Pressing Enter in the search box shouldn't reload the page
    toolbar.addEventListener('submit', function (e) { e.preventDefault(); });

    // Tabs: one listener on the tab list (event delegation)
    tabList.addEventListener('click', function (e) {
      var tab = e.target.closest('.menu-tab');
      if (tab) setCategory(tab.getAttribute('data-category'));
    });

    tabList.addEventListener('keydown', function (e) {
      var index = tabs.indexOf(document.activeElement);
      if (index === -1) return;

      var next = null;
      if (e.key === 'ArrowRight') next = tabs[(index + 1) % tabs.length];
      if (e.key === 'ArrowLeft')  next = tabs[(index - 1 + tabs.length) % tabs.length];
      if (e.key === 'Home')       next = tabs[0];
      if (e.key === 'End')        next = tabs[tabs.length - 1];
      if (next) { e.preventDefault(); setCategory(next.getAttribute('data-category'), true); }
    });

    // Hot / Iced buttons: one listener on the results area (they're recreated on every redraw)
    results.addEventListener('click', function (e) {
      var button = e.target.closest('.serving-button');
      if (!button) return;

      chosenTemperature[button.getAttribute('data-item-id')] = button.textContent;

      var group = button.parentElement;
      group.querySelectorAll('.serving-button').forEach(function (other) {
        var isChosen = other === button;
        other.classList.toggle('selected', isChosen);
        other.setAttribute('aria-pressed', String(isChosen));
      });
      group.parentElement.querySelector('.serving-feedback').textContent = 'Selected: ' + button.textContent;
    });
  }


  /* ========================================================
     SHAREABLE LINKS: keep the search, sort and tab in the URL
     e.g. menu.html?q=matcha&sort=price-asc&cat=matcha
     ======================================================== */

  function readUrl() {
    var params = new URLSearchParams(window.location.search);
    var sort = params.get('sort');
    var category = params.get('cat');

    state.query = params.get('q') || '';
    state.sort = SORTS.indexOf(sort) !== -1 ? sort : 'default';
    state.category = categories.some(function (c) { return c.id === category; }) ? category : 'all';
  }

  function updateUrl() {
    var params = new URLSearchParams();
    if (state.query.trim()) params.set('q', state.query.trim());
    if (state.sort !== 'default') params.set('sort', state.sort);
    if (state.category !== 'all') params.set('cat', state.category);

    var queryString = params.toString();
    try {
      history.replaceState(null, '', window.location.pathname + (queryString ? '?' + queryString : ''));
    } catch (e) { /* some browsers refuse this on file:// pages; the menu still works */ }
  }


  load();

})();
