map = function(n, start1, stop1, start2, stop2, withinBounds) {
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

setupProfiles = function(visualiser) {
  for (let i = 0; i < visualiser.profiles.length; i++) {
      const savedProfile = localStorage.getItem(visualiser.name + '_profile_' + (i + 1));
      if (savedProfile) {
        visualiser.profiles[i] = JSON.parse(savedProfile);
      }
  }

  let profileContainer = document.querySelector('#profiles');
  profileContainer.style.opacity = 1;
  for (let i = 0; i < visualiser.profiles.length; i++) {
      let button = document.createElement('button');
      let profileColour = `hsl( ${Number(visualiser.profiles[i].hue) + Number(visualiser.profiles[i].hueShift) / 2}, 100%, 30%, 0.7)`;
      let profileNumber = i + 1;
      button.id = 'profile-' + profileNumber + '-button';
      button.textContent = profileNumber;
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
  changeProfile(visualiser, 0);
}

createNumberInput = function(label, id, min, max) {
  let controls = document.querySelector('#controls');

  let labelElement = document.createElement('label');
  labelElement.innerHTML = label;
  labelElement.htmlFor = id;

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

changeProfile = function(visualiser, index) {
  let previousParticleCount = visualiser.options.particles;
  visualiser.options = visualiser.profiles[index];
  visualiser.profileNumber = index + 1;
  console.log('changed to profile ' + visualiser.profileNumber);
  setOptions(visualiser)
  updateColours(visualiser);
  if (visualiser.name === 'flow' && visualiser.effect) {
    let particleDiff = previousParticleCount - visualiser.options.particles;
    visualiser.effect.clearParticles(particleDiff);
    visualiser.effect.updateEffect(true, 0, visualiser.options, particleDiff)
    toggleProfileTransition(visualiser, document.querySelector('#profileTransition').value)
  }
}

createTitle = function() {
  let optionsTitle = document.createElement('h4');
  optionsTitle.id = 'controls-title';
  document.querySelector('#controls').appendChild(optionsTitle);
}

setOptions = function(visualiser) {
  document.querySelector('#controls-title').innerHTML = 'profile ' + visualiser.profileNumber;
  Object.keys(visualiser.options).forEach(key => {
    let control = document.querySelector(`#${key}`);
    if (control.type === 'checkbox') {
      control.checked = visualiser.options[key];
    } else {
      control.value = visualiser.options[key];
    }
  });
}

changeOption = function(visualiser, option) {
  if (visualiser.name === 'flow' && option.id === 'particles') {
      let particleDiff = visualiser.options[option.id] - option.value;
      visualiser.options[option.id] = option.value;
      visualiser.effect.clearParticles(particleDiff);
      visualiser.effect.updateEffect(true, 0, visualiser.options, particleDiff)
  } else {
      visualiser.options[option.id] = option.type === 'checkbox' ? option.checked : option.value;
  }
  updateColours(visualiser);
}

updateColours = function(visualiser) {
  let hue = Number(visualiser.options.hue) + Number(visualiser.options.hueShift) / 2;
  let controlColour = `hsl( ${hue}, 100%, 80%)`;
  let profileColour = `hsl( ${hue}, 100%, 30%, 0.7)`;

  document.querySelector('#mic-icon').style.color = controlColour;
  document.querySelector('#current-song').style.color = controlColour;
  document.querySelector('#updateButton').style.color = controlColour;
  document.querySelector('#saveProfile').style.backgroundColor = profileColour;
  document.querySelector('#resetProfile').style.backgroundColor = profileColour;
  document.querySelector('#profile-' + visualiser.profileNumber + '-button').style.backgroundColor = profileColour;

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
      })
  })
}

saveProfile = function(visualiser) {
  let itemName = visualiser.name + '_profile_' + visualiser.profileNumber;
  let profile = JSON.stringify(visualiser.profiles[visualiser.profileNumber - 1]);
  localStorage.setItem(itemName, profile);
  console.log('Saved profile ' + visualiser.profileNumber);
  createSnackBar(visualiser, 'saved');
}

resetProfile = function(visualiser) {
  visualiser.profiles[visualiser.profileNumber - 1] = JSON.parse(JSON.stringify(visualiser.defaultProfiles[visualiser.profileNumber - 1]));
  changeProfile(visualiser, visualiser.profileNumber - 1);
  let itemName = visualiser.name + '_profile_' + visualiser.profileNumber;
  localStorage.removeItem(itemName);
  console.log('Reset profile ' + visualiser.profileNumber);
  createSnackBar(visualiser, 'reset');
}

createSnackBar = function(visualiser, action) {
  let snackbar = document.querySelector('#snackbar');
  let hue = Number(visualiser.options.hue) + Number(visualiser.options.hueShift) / 2;
  snackbar.innerHTML = 'profile ' + visualiser.profileNumber + ' ' + action;
  snackbar.style.color = `hsl( ${hue}, 100%, 80%)`
  snackbar.className = 'show';
  setTimeout(() => snackbar.className = snackbar.className.replace('show', ''), 3000);
}

toggleProfileTransition = function(visualiser, value) {
  clearInterval(visualiser.intervalFunction);
  visualiser.transitionInterval = value * 1000;
  if (visualiser.transitionInterval > 0) {
      console.log('triggering profile transitions every ' + visualiser.transitionInterval + 'ms');
      visualiser.intervalFunction = setInterval(() => transitionProfile(visualiser, visualiser.transitionInterval), visualiser.transitionInterval);
  } else {
      console.log('stopping profile transitions');
  }
}

transitionProfile = function(visualiser, currentInterval) {
  if (visualiser.transitionInterval > 0 && currentInterval === visualiser.transitionInterval) {
      let index;
      if (visualiser.profileNumber === visualiser.defaultProfiles.length) {
          index = 0;
      } else {
          index = visualiser.profileNumber;
      }
      changeProfile(visualiser, index);
  }
}

teardown = function(visualiser) {
  visualiser.ctx.save();
  visualiser.ctx.setTransform(1, 0, 0, 1, 0, 0);
  visualiser.ctx.clearRect(0, 0, visualiser.canvas.width, visualiser.canvas.height);
  visualiser.ctx.restore();
  visualiser.active = false;

  let profileContainer = document.querySelector('#profiles');
  profileContainer.replaceChildren();

  let controls = document.querySelector('#controls')
  controls.replaceChildren();
}

module.exports = {map, setupProfiles, changeProfile, createTitle, setOptions, changeOption, 
  updateColours, createNumberInput, saveProfile, resetProfile, toggleProfileTransition, teardown}

