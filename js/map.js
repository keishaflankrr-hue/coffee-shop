/* ==========================================================
   WABI SABI — interactive map (contact page only)
   Library: Leaflet (https://leafletjs.com) with OpenStreetMap tiles.
   Leaflet is free and needs no account or API key.

   Features
   - A marker + popup for the shop
   - "Get directions" link (opens Google Maps with the shop as destination)
   - "Show my distance" button using the browser's Geolocation API
   ========================================================== */

(function () {
  'use strict';

  var mapElement = document.getElementById('map');
  if (!mapElement) return;

  // ---------------------------------------------------------
  // CHANGE THESE to the real shop.
  // To find coordinates: in Google Maps, right-click the exact spot
  // and click the two numbers at the top of the menu to copy them.
  // The pin below is a PLACEHOLDER somewhere in Pretoria East.
  // ---------------------------------------------------------
  var SHOP = {
    name: 'Wabi Sabi Coffee Shop',
    address: '123 Example Street, Pretoria East',
    lat: -25.7840,
    lng: 28.2770
  };

  // If the Leaflet script didn't load (offline, blocked), show the address instead of an empty box
  if (typeof L === 'undefined') {
    var fallback = document.createElement('p');
    fallback.className = 'map-fallback';
    fallback.textContent = 'The map couldn’t load. You can find us at ' + SHOP.address + '.';
    mapElement.appendChild(fallback);
    return;
  }

  var shopPosition = L.latLng(SHOP.lat, SHOP.lng);

  // 1. Create the map and centre it on the shop (zoom 15 = neighbourhood level)
  var map = L.map(mapElement, { scrollWheelZoom: false }).setView(shopPosition, 15);

  // The mouse wheel only zooms once the map has been clicked, so the page can still scroll past it
  map.on('click focus', function () { map.scrollWheelZoom.enable(); });
  map.on('mouseout blur', function () { map.scrollWheelZoom.disable(); });

  // 2. Add the map picture (tiles). The attribution is required by OpenStreetMap.
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // 3. Add the marker with a popup (built with the DOM so nothing is injected as raw HTML)
  var popup = document.createElement('div');
  var popupName = document.createElement('strong');
  popupName.textContent = SHOP.name;
  popup.append(popupName, document.createElement('br'), SHOP.address);

  L.marker(shopPosition, { title: SHOP.name, alt: SHOP.name })
    .addTo(map)
    .bindPopup(popup)
    .openPopup();

  // 4. "Get directions" link
  var directionsLink = document.getElementById('directions-link');
  if (directionsLink) {
    directionsLink.href = 'https://www.google.com/maps/dir/?api=1&destination=' + SHOP.lat + ',' + SHOP.lng;
  }

  // 5. "Show my distance" button
  var locateButton = document.getElementById('locate-button');
  var status = document.getElementById('map-status');
  var youLayer = null;

  function formatDistance(metres) {
    if (metres < 1000) return Math.round(metres / 10) * 10 + ' m';
    return (metres / 1000).toFixed(1) + ' km';
  }

  if (locateButton && status) {
    locateButton.addEventListener('click', function () {
      if (!navigator.geolocation) {
        status.textContent = 'Your browser can’t share your location. Use “Get directions” instead.';
        return;
      }

      status.textContent = 'Finding you…';
      locateButton.disabled = true;

      navigator.geolocation.getCurrentPosition(
        function (position) {
          locateButton.disabled = false;
          var you = L.latLng(position.coords.latitude, position.coords.longitude);

          // Replace any earlier "you are here" drawing
          if (youLayer) youLayer.remove();
          youLayer = L.layerGroup([
            L.circleMarker(you, { radius: 8, color: '#354024', weight: 2, fillColor: '#889063', fillOpacity: 0.9 })
              .bindTooltip('You are here'),
            L.polyline([you, shopPosition], { color: '#354024', weight: 2, dashArray: '6 8' })
          ]).addTo(map);

          map.fitBounds(L.latLngBounds([you, shopPosition]), { padding: [40, 40] });

          // map.distance() gives a straight-line distance in metres
          status.textContent = 'You’re about ' + formatDistance(map.distance(you, shopPosition)) +
            ' from Wabi Sabi in a straight line. Use “Get directions” for the route.';
        },
        function (error) {
          locateButton.disabled = false;
          status.textContent = error.code === 1
            ? 'We couldn’t get your location because permission was declined. You can still use “Get directions”.'
            : 'We couldn’t work out where you are right now. Try again, or use “Get directions”.';
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
      );
    });
  }

})();
