import {Wheel} from 'https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js';



window.onload = () => {
  const listEl = document.querySelector('.restaurant-list');
  const pickedListEl = document.querySelector('.picked-list');
  const btnSpin = document.querySelector('.btn-spin');
  const btnAccept = document.querySelector('.btn-accept');
  const btnAdd = document.querySelector('.btn-add');
  const btnExport = document.querySelector('.btn-export');
  const btnImport = document.querySelector('.btn-import');
  const importInput = document.querySelector('.import-input');
  const inputEl = document.querySelector('#restaurant-input');
  const selectionNameEl = document.querySelector('.selection-name');
  const container = document.querySelector('.wheel-1');

  const defaultRestaurants = Array.from(listEl.querySelectorAll('li'))
    .map(item => item.textContent.trim())
    .filter(Boolean);
  let restaurants = [...defaultRestaurants];
  let picked = [];
  let wheel1 = null;
  let selectedRestaurant = null;
  let modifier = 0;

  function setCookie(name, value, maxAgeDays) {
    const maxAge = Math.floor(maxAgeDays * 24 * 60 * 60);
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAge}; path=/; samesite=lax`;
  }

  function getCookie(name) {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`));
    if (!cookie) return null;
    return decodeURIComponent(cookie.split('=').slice(1).join('='));
  }

  function saveData() {
    const payload = JSON.stringify({restaurants, picked});
    setCookie('restaurantData', payload, 365);
  }

  function loadData() {
    const raw = getCookie('restaurantData');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      const storedRestaurants = Array.isArray(parsed?.restaurants)
        ? parsed.restaurants.filter(item => typeof item === 'string')
        : null;
      const storedPicked = Array.isArray(parsed?.picked)
        ? parsed.picked.filter(item => typeof item === 'string')
        : [];
      if (!storedRestaurants) return null;
      return {restaurants: storedRestaurants, picked: storedPicked};
    } catch (error) {
      return null;
    }
  }

  function buildWheel() {
    container.innerHTML = '';
    if (restaurants.length === 0) {
      wheel1 = null;
      return;
    }

    modifier = 0;
    wheel1 = new Wheel(container, {
      items: restaurants.map(label => ({label})),
      itemLabelFontSizeMax: 28,
      itemLabelRadius: 0.9,
      isInteractive: false,
      rotation: 0,
      onRest: handleWheelRest,
    });
    window.wheel1 = wheel1;
  }

  function renderRestaurants() {
    listEl.innerHTML = '';
    if (restaurants.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty';
      emptyItem.textContent = 'No restaurants left. Add more to spin again.';
      listEl.appendChild(emptyItem);
      return;
    }

    restaurants.forEach((name) => {
      const item = document.createElement('li');
      item.textContent = name;
      listEl.appendChild(item);
    });
  }

  function renderPicked() {
    pickedListEl.innerHTML = '';
    if (picked.length === 0) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'empty';
      emptyItem.textContent = 'No picks accepted yet.';
      pickedListEl.appendChild(emptyItem);
      return;
    }

    picked.forEach((name) => {
      const item = document.createElement('li');
      item.textContent = name;
      pickedListEl.appendChild(item);
    });
  }

  function setSelection(name) {
    selectedRestaurant = name;
    selectionNameEl.textContent = name || 'Spin to choose';
    btnAccept.disabled = !name;
  }

  function setPlaceholder(text) {
    selectedRestaurant = null;
    selectionNameEl.textContent = text;
    btnAccept.disabled = true;
  }

  function updateSpinState() {
    btnSpin.disabled = restaurants.length === 0;
    if (restaurants.length === 0) {
      setPlaceholder('Add restaurants to spin');
    } else if (!selectedRestaurant) {
      selectionNameEl.textContent = 'Spin to choose';
    }
  }

  function handleWheelRest(event) {
    const label = getSelectedLabel(event);
    if (label) {
      setSelection(label);
    }
  }

  function getSelectedLabel(event) {
    if (event?.currentItem?.label) return event.currentItem.label;
    if (event?.item?.label) return event.item.label;
    if (event?.winningItem?.label) return event.winningItem.label;
    if (Number.isInteger(event?.currentIndex)) return restaurants[event.currentIndex];
    if (Number.isInteger(event?.index)) return restaurants[event.index];

    const rotation = typeof event?.rotation === 'number'
      ? event.rotation
      : (typeof wheel1?.rotation === 'number' ? wheel1.rotation : null);
    if (typeof rotation !== 'number' || restaurants.length === 0) {
      return null;
    }

    const slice = 360 / restaurants.length;
    const normalized = ((rotation % 360) + 360) % 360;
    const adjusted = (360 - normalized + slice / 2) % 360;
    const index = Math.floor(adjusted / slice);
    return restaurants[index];
  }

  function spinWheel() {
    if (restaurants.length === 0) return;
    if (!wheel1 || restaurants.length === 1) {
      setSelection(restaurants[0]);
      return;
    }

    setPlaceholder('Spinning...');
    const {duration, winningItemRotation} = calcSpinToValues();
    wheel1.spinTo(winningItemRotation, duration);
  }

  function acceptPick() {
    if (!selectedRestaurant) return;
    const index = restaurants.indexOf(selectedRestaurant);
    if (index === -1) return;
    restaurants.splice(index, 1);
    picked.push(selectedRestaurant);
    setSelection(null);
    renderRestaurants();
    renderPicked();
    buildWheel();
    updateSpinState();
    saveData();
  }

  function addRestaurant() {
    const name = inputEl.value.trim();
    if (!name) return;
    restaurants.push(name);
    inputEl.value = '';
    renderRestaurants();
    buildWheel();
    updateSpinState();
    saveData();
  }

  function calcSpinToValues() {
    const duration = 2600;
    const winningItemRotation = getRandomInt(360, 360 * 1.75) + modifier;
    modifier += 360 * 1.75;
    return {duration, winningItemRotation};
  }

  function getRandomInt(min, max) {
    const minValue = Math.ceil(min);
    const maxValue = Math.floor(max);
    return Math.floor(Math.random() * (maxValue - minValue)) + minValue;
  }

  btnSpin.addEventListener('click', spinWheel);
  btnAccept.addEventListener('click', acceptPick);
  btnAdd.addEventListener('click', addRestaurant);
  btnExport.addEventListener('click', () => {
    const payload = JSON.stringify({restaurants, picked}, null, 2);
    const blob = new Blob([payload], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'restaurant-data.json';
    link.click();
    URL.revokeObjectURL(url);
  });
  btnImport.addEventListener('click', () => {
    importInput.click();
  });
  importInput.addEventListener('change', () => {
    const file = importInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const importedRestaurants = Array.isArray(parsed?.restaurants)
          ? parsed.restaurants.filter(item => typeof item === 'string')
          : [];
        const importedPicked = Array.isArray(parsed?.picked)
          ? parsed.picked.filter(item => typeof item === 'string')
          : [];
        restaurants = importedRestaurants;
        picked = importedPicked;
        setSelection(null);
        renderRestaurants();
        renderPicked();
        buildWheel();
        updateSpinState();
        saveData();
      } catch (error) {
        window.alert('Import failed. Please choose a valid JSON export.');
      }
    };
    reader.readAsText(file);
    importInput.value = '';
  });
  inputEl.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addRestaurant();
    }
  });

  const saved = loadData();
  if (saved) {
    restaurants = saved.restaurants;
    picked = saved.picked;
  }
  renderRestaurants();
  renderPicked();
  buildWheel();
  updateSpinState();
};
