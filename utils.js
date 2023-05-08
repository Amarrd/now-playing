const iro = require('@jaames/iro');

map = function (n, start1, stop1, start2, stop2, withinBounds) {
  const newval = (n - start1) / (stop1 - start1) * (stop2 - start2) + start2;
  if (!withinBounds) {
    return newval;
  }
  if (start2 < stop2) {
    return Math.max(Math.min(newval, stop2), start2);
  } else {
    return Math.max(Math.min(newval, start2), stop2);
  }
}

loadProfiles = function (visualiser) {
  for (let i = 0; i < visualiser.profiles.length; i++) {
    const savedProfile = localStorage.getItem(visualiser.name + '_profile_' + (i + 1));
    if (savedProfile) {
      visualiser.profiles[i] = JSON.parse(savedProfile);
    }
  }
}

setupProfiles = function (visualiser) {
  loadProfiles(visualiser);

  let profileContainer = document.querySelector('#profiles');
  profileContainer.style.opacity = 1;
  for (let profileIndex = 0; profileIndex < visualiser.profiles.length; profileIndex++) {
    let button = document.createElement('button');
    let profileHue = visualiser.getProfileHue(profileIndex);
    let profileColour = `hsl( ${profileHue}, 100%, 30%, 0.7)`;
    button.id = 'profile-' + Number(profileIndex + 1) + '-button';
    button.textContent = Number(profileIndex + 1);
    button.style.backgroundColor = profileColour;
    button.setAttribute('onclick', 'myBundle.changeProfile(this.textContent)')
    profileContainer.appendChild(button);
  }

  let saveProfile = document.createElement('button');
  saveProfile.id = 'saveProfile';
  saveProfile.className = 'fa fa-save';
  saveProfile.setAttribute('onclick', 'myBundle.saveProfile()')
  saveProfile.style.backgroundColor = `hsl( ${visualiser.profiles[0].hue}, 100%, 30%, 0.7)`;

  let resetProfile = document.createElement('button');
  resetProfile.id = 'resetProfile';
  resetProfile.className = 'fa fa-undo';
  resetProfile.setAttribute('onclick', 'myBundle.resetProfile()')
  resetProfile.style.backgroundColor = `hsl( ${visualiser.profiles[0].hue}, 100%, 30%, 0.7)`;

  profileContainer.appendChild(document.createElement('br'));
  profileContainer.appendChild(saveProfile);
  profileContainer.appendChild(resetProfile);

  let height = (window.innerHeight - profileContainer.offsetHeight) / 2;
  profileContainer.style.top = height + 'px'
}

createNumberInput = function (label, id, min, max) {
  let controls = document.querySelector('#controls');

  let labelElement = document.createElement('label');
  labelElement.innerHTML = label;
  labelElement.htmlFor = id;
  labelElement.id = id + 'Label'

  let inputElement = document.createElement('input');
  inputElement.setAttribute('type', 'number');
  inputElement.id = id;
  inputElement.setAttribute('name', id);
  inputElement.setAttribute('min', min)
  inputElement.setAttribute('max', max)
  inputElement.setAttribute('onchange', 'myBundle.changeOption(' + id + ')')

  labelElement.appendChild(inputElement);
  controls.appendChild(labelElement);
}

createSelectInput = function (label, id, options) {
  let labelElement = document.createElement('label');
  labelElement.innerHTML = label;
  labelElement.htmlFor = id;

  let select = document.createElement('select');
  select.id = id;
  select.setAttribute('onchange', 'myBundle.changeOption(' + id + ')')

  for (const [key, value] of Object.entries(options)) {
    let option = document.createElement('option');
    option.id = key;
    option.value = key;
    option.innerHTML = value;
    select.appendChild(option);
  }

  let controls = document.querySelector('#controls');
  labelElement.appendChild(select);
  controls.appendChild(labelElement);
}

changeProfile = function (visualiser, index) {
  visualiser.profileIndex = index;
  console.log('changed to profile ' + Number(visualiser.profileIndex + 1));
  setOptions(visualiser)
  updateColours(visualiser);
  if (visualiser.name === 'flow field' && visualiser.effect) {
    let previousParticleCount = visualiser.profiles[visualiser.profileIndex].particles;
    let particleDiff = previousParticleCount - visualiser.profiles[visualiser.profileIndex].particles;
    visualiser.effect.clearParticles(particleDiff);
    visualiser.effect.updateEffect(true, 0, visualiser.profiles[visualiser.profileIndex], particleDiff)
  }
  toggleProfileTransition(visualiser, document.querySelector('#profileTransition').value)
  visualiser.updateControls();
  localStorage.setItem(`${visualiser.name}-profileIndex`, visualiser.profileIndex)
}

createProfileTitle = function () {
  let optionsTitle = document.createElement('h3');
  optionsTitle.id = 'controls-title';
  document.querySelector('#controls').appendChild(optionsTitle);
  document.querySelector('#controls').appendChild(document.createElement('br'));
}

setOptions = function (visualiser) {
  document.querySelector('#controls-title').innerHTML = 'Profile ' + Number(visualiser.profileIndex + 1);
  Object.keys(visualiser.profiles[visualiser.profileIndex]).forEach(key => {
    let control = document.querySelector(`#${key}`);
    if (!control) {
      return;
    }
    if (control.type === 'checkbox') {
      control.checked = visualiser.profiles[visualiser.profileIndex][key];
    } else {
      control.value = visualiser.profiles[visualiser.profileIndex][key];
    }
  });
}

changeOption = function (visualiser, option) {
  if (visualiser.name === 'flow field' && option.id === 'particles') {
    let particleDiff = visualiser.profiles[visualiser.profileIndex][option.id] - option.value;
    visualiser.profiles[visualiser.profileIndex][option.id] = option.value;
    visualiser.effect.clearParticles(particleDiff);
    visualiser.effect.updateEffect(true, 0, visualiser.profiles[visualiser.profileIndex], particleDiff)
  } else {
    visualiser.profiles[visualiser.profileIndex][option.id] = option.type === 'checkbox' ? option.checked : option.value;
  }
  visualiser.updateControls();
  updateColours(visualiser);
}

updateColours = function (visualiser) {
  let hue = visualiser.getProfileHue();
  let controlColour = `hsl( ${hue}, 100%, 80%)`;
  let profileColour = `hsl( ${hue}, 100%, 30%, 0.7)`;

  document.querySelector('#mic-icon').style.color = controlColour;
  document.querySelector('#current-song').style.color = controlColour;
  document.querySelector('#updateButton').style.color = controlColour;
  document.querySelector('#saveProfile').style.backgroundColor = profileColour;
  document.querySelector('#resetProfile').style.backgroundColor = profileColour;
  document.querySelector('#profile-' + Number(visualiser.profileIndex + 1) + '-button').style.backgroundColor = profileColour;

  if (document.querySelector('#rightSwitch')) {
    document.querySelector('#leftSwitch').style.color = controlColour;
    document.querySelector('#rightSwitch').style.color = controlColour;
  }

  if (document.querySelector('#colourPrompt')) {
    document.querySelector('#colourPrompt').style.color = controlColour;
    document.querySelector('#clearColour').style.color = controlColour;
    document.querySelector('#closeColour').style.color = controlColour;
  }

  let controlsToUpdate = ['#controls', '#global-controls']

  controlsToUpdate.forEach(controls => {
    let controlElement = document.querySelector(controls);
    controlElement.style.color = controlColour;
    controlElement.childNodes.forEach(element => {
      if (element.nodeName === 'LABEL') {
        element.childNodes.forEach(child => {
          if (child.nodeName === 'INPUT' || child.nodeName === 'SELECT') child.style.color = controlColour;
        })
      }
      if (element.nodeName === 'BUTTON') {
        element.style.color = controlColour;

      }
    })
  })
}

saveProfile = function (visualiser) {
  let itemName = visualiser.name + '_profile_' + Number(visualiser.profileIndex + 1);
  let profile = JSON.stringify(visualiser.profiles[visualiser.profileIndex]);
  localStorage.setItem(itemName, profile);
  console.log('Saved profile ' + visualiser.profileIndex);
  console.log(profile);
  createSnackBar(visualiser, 'Saved');
}

resetProfile = function (visualiser) {
  visualiser.profiles[visualiser.profileIndex] = JSON.parse(JSON.stringify(visualiser.defaultProfiles[visualiser.profileIndex]));
  changeProfile(visualiser, visualiser.profileIndex);
  let itemName = visualiser.name + '_profile_' + Number(visualiser.profileIndex + 1);
  localStorage.removeItem(itemName);
  console.log('Reset profile ' + visualiser.profileIndex);
  createSnackBar(visualiser, 'Reset');
}

createVisualiserTitle = function (visualiser) {
  let snackbar = document.querySelector('#snackbarTop');
  let hue = visualiser.getProfileHue();
  snackbar.innerHTML = visualiser.name;
  snackbar.style.color = `hsl( ${hue}, 100%, 80%)`
  snackbar.className = 'show';
  setTimeout(() => snackbar.className = snackbar.className.replace('show', ''), 4000);
}

createSnackBar = function (visualiser, action) {
  let snackbar = document.querySelector('#snackbar');
  let hue = visualiser.getProfileHue();
  snackbar.innerHTML = 'Profile ' + Number(visualiser.profileIndex + 1) + ' ' + action;
  snackbar.style.color = `hsl( ${hue}, 100%, 80%)`
  snackbar.className = 'show';
  setTimeout(() => snackbar.className = snackbar.className.replace('show', ''), 3000);
}

toggleProfileTransition = function (visualiser, value) {
  clearInterval(visualiser.intervalFunction);
  visualiser.transitionInterval = value * 1000;
  if (visualiser.transitionInterval > 0) {
    console.log('triggering profile transitions every ' + visualiser.transitionInterval + 'ms');
    visualiser.intervalFunction = setInterval(() => transitionProfile(visualiser, visualiser.transitionInterval), visualiser.transitionInterval);
  }
}

transitionProfile = function (visualiser, currentInterval) {
  if (visualiser.transitionInterval > 0 && currentInterval === visualiser.transitionInterval) {
    let index;
    if (visualiser.profileIndex === visualiser.defaultProfiles.length-1) {
      index = 0;
    } else {
      index = visualiser.profileIndex + 1;
    }
    changeProfile(visualiser, index);
  }
}

teardown = function (visualiser) {
  visualiser.ctx.save();
  visualiser.ctx.setTransform(1, 0, 0, 1, 0, 0);
  visualiser.ctx.clearRect(0, 0, visualiser.canvas.width, visualiser.canvas.height);
  visualiser.ctx.restore();
  visualiser.active = false;

  toggleProfileTransition(visualiser, 0);

  let profileContainer = document.querySelector('#profiles');
  profileContainer.replaceChildren();

  let controls = document.querySelector('#controls')
  controls.replaceChildren();
}

module.exports = {
  map, loadProfiles, setupProfiles, changeProfile, createProfileTitle, setOptions, changeOption,
  updateColours, createVisualiserTitle, createNumberInput, createSelectInput, saveProfile, resetProfile, toggleProfileTransition, teardown
}

