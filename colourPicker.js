const Gradient = require('javascript-color-gradient');
const iro = require('@jaames/iro');
const utils = require('./utils');

createColourGradientPicker = function (visualiser) {
    let blockingDiv = document.createElement('div');
    let prompt = document.createElement('div');
    let buttons = document.createElement('div');
    let close = document.createElement('button');
    let clear = document.createElement('button');
    let title = document.createElement('h4');
    const colour = document.querySelector('#controls').style.color;

    blockingDiv.id = 'blockingDiv';
    blockingDiv.className = 'blockingDiv';
    document.body.appendChild(blockingDiv);

    prompt.className = 'credentialsPrompt';
    prompt.id = 'gradientPicker';
    prompt.style.color = colour;
    prompt.style.opacity = 1;

    title.innerHTML = 'Gradient Creator';
    title.style.textAlign = 'center';

    clear.innerHTML = 'Clear';
    clear.id = 'clearColour';
    clear.style.color = colour;
    clear.style.float = 'left';
    clear.style.marginLeft = '20px';
    clear.setAttribute('onclick', 'myBundle.clearGradientColour()');

    close.innerHTML = 'Close';
    close.id = 'closeColour';
    close.style.color = colour;
    close.style.float = 'right';
    close.style.marginRight = '20px';
    close.setAttribute('onclick', 'myBundle.closeColourGradientPicker()');

    document.body.appendChild(prompt);
    prompt.appendChild(title);
    prompt.appendChild(document.createElement('br'));

    visualiser.sliderPicker = new iro.ColorPicker("#gradientPicker", {
        width: 350,
        color: visualiser.profiles[visualiser.profileIndex].gradientColours[0],
        borderWidth: 3,
        borderColor: "black",
        layout: [
            {
                component: iro.ui.Slider,
                options: {
                    sliderType: 'hue'
                }
            },
            {
                component: iro.ui.Slider,
                options: {
                    sliderType: 'saturation'
                }
            },
            {
                component: iro.ui.Slider,
                options: {
                    sliderType: 'value'
                }
            },
        ]
    });

    visualiser.sliderPicker.on('color:change', function (colour) {
        let colourButton = Array.from(document.querySelector('#gradientButtons').childNodes)
            .find(button => button.getAttribute('currentColour') === 'true')
        if (!colourButton) {
            return;
        }
        colourButton.style.backgroundColor = colour.hexString;
        colourButton.onclick(colourButton);
    });

    let gradientButtons = document.createElement('div');
    gradientButtons.className = 'gradientButtons';
    gradientButtons.id = 'gradientButtons';
    for (let i = 0; i < 6; i++) {
        let button = document.createElement('button');
        let colourNumber = i + 1;
        button.id = 'colour-' + colourNumber + '-button';
        button.setAttribute('index', i);
        button.textContent = " ";
        button.style.backgroundColor = visualiser.profiles[visualiser.profileIndex].gradientColours[i] || 'rgba(0, 0, 0, 0)';
        button.style.margin = '5px';
        button.style.height = '50px';
        button.style.width = '50px';
        button.setAttribute('onclick', 'myBundle.gradientColourClicked(this)');
        button.setAttribute('currentColour', i === 0 ? 'true' : 'false');
        button.style.border = i === 0 ? '3px solid #e7e7e7' : '2px solid #999997';
        gradientButtons.appendChild(button);
    }

    prompt.appendChild(gradientButtons);
    buttons.appendChild(clear);
    buttons.appendChild(close);
    prompt.appendChild(buttons);

    let height = (window.innerHeight - prompt.offsetHeight) / 2;
    let width = (window.innerWidth - prompt.offsetWidth) / 2;
    prompt.style.top = height + 'px';
    prompt.style.left = width + 'px';
}


createHuePicker = function (visualiser) {
    let blockingDiv = document.createElement('div');
    let prompt = document.createElement('div');
    let buttons = document.createElement('div');
    let close = document.createElement('button');
    let title = document.createElement('h4');
    const colour = document.querySelector('#controls').style.color;

    blockingDiv.id = 'blockingDiv';
    blockingDiv.className = 'blockingDiv';
    document.body.appendChild(blockingDiv);

    prompt.className = 'credentialsPrompt';
    prompt.id = 'huePicker';
    prompt.style.color = colour;
    prompt.style.opacity = 1;

    title.innerHTML = 'Hue Picker';
    title.style.textAlign = 'center';

    close.innerHTML = 'Close';
    close.id = 'closeColour';
    close.style.color = colour;
    close.style.float = 'right';
    close.style.marginRight = '20px';
    close.setAttribute('onclick', 'myBundle.closeHuePicker()');

    document.body.appendChild(prompt);
    prompt.appendChild(title);
    prompt.appendChild(document.createElement('br'));


    visualiser.sliderPicker = new iro.ColorPicker("#huePicker", {
        width: 350,
        color: `hsl(${visualiser.profiles[visualiser.profileIndex].hue}, 50%, 100%)`,
        borderWidth: 3,
        borderColor: "black",
        layout: [
            {
                component: iro.ui.Slider,
                options: {
                    sliderType: 'hue'
                }
            }
        ]
    });

    visualiser.sliderPicker.on('color:change', function (colour) {
        let colourButton = Array.from(document.querySelector('#gradientButtons').childNodes)
            .find(button => button.getAttribute('currentColour') === 'true')
        if (!colourButton) {
            return;
        }
        colourButton.style.backgroundColor = `hsl(${colour.hue}, 100%, 50%)`;
        colourButton.setAttribute('hue', colour.hue)
        colourButton.onclick(colourButton);
    });

    let gradientButtons = document.createElement('div');
    gradientButtons.className = 'gradientButtons';
    gradientButtons.id = 'gradientButtons';
    gradientButtons.style.alignSelf = 'center'
    let button = document.createElement('button');
    let colourNumber = 1;
    button.id = 'colour-' + colourNumber + '-button';
    button.setAttribute('index', 0);
    button.textContent = " ";
    button.style.backgroundColor = `hsl(${visualiser.profiles[visualiser.profileIndex].hue},100%,50%)`|| 'rgba(0, 0, 0, 0)';
    button.style.margin = '5px';
    button.style.height = '50px';
    button.style.width = '50px';

    button.setAttribute('onclick', 'myBundle.hueColourClicked(this)');
    button.setAttribute('currentColour', 'true');
    button.style.border = '3px solid #e7e7e7';
    gradientButtons.appendChild(button);

    prompt.appendChild(gradientButtons);
    buttons.appendChild(close);
    prompt.appendChild(buttons);

    let height = (window.innerHeight - prompt.offsetHeight) / 2;
    let width = (window.innerWidth - prompt.offsetWidth) / 2;
    prompt.style.top = height + 'px';
    prompt.style.left = width + 'px';
}


gradientColourClicked = function (visualiser, colour) {
    document.querySelector('#gradientButtons').childNodes.forEach(button => {
        button.setAttribute('currentColour', 'false');
        button.style.border = '2px solid #999997'
    })
    if (colour.style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        visualiser.sliderPicker.color.rgbString = colour.style.backgroundColor;
    }
    visualiser.currentColour = colour.getAttribute('index');
    colour.setAttribute('currentColour', 'true');
    colour.style.border = '3px solid #e7e7e7'

    visualiser.profiles[visualiser.profileIndex].gradientColours = Array.from(document.querySelector('#gradientButtons').childNodes)
        .map(button => new iro.Color(button.style.backgroundColor).hexString)
        .filter(colour => colour != "#000000");

    visualiser.gradientArray = new Gradient()
        .setColorGradient(...visualiser.profiles[visualiser.profileIndex].gradientColours)
        .setMidpoint(500)
        .getColors();

    utils.updateColours(visualiser);
}


hueColourClicked = function (visualiser, colourButton) {
    visualiser.profiles[visualiser.profileIndex].hue = Math.round(colourButton.getAttribute('hue'));
    utils.setOptions(visualiser)
    utils.updateColours(visualiser);
}

clearGradientColour = function () {
    document.querySelector('#gradientButtons').childNodes.forEach(colour => {
        if (colour.getAttribute('currentColour') === 'true') {
            colour.style.backgroundColor = 'rgba(0, 0, 0, 0)';
        }
    })
}

closeColourGradientPicker = function (visualiser) {
    visualiser.profiles[visualiser.profileIndex].gradientColours = Array.from(document.querySelector('#gradientButtons').childNodes)
        .map(button => new iro.Color(button.style.backgroundColor).hexString)
        .filter(colour => colour != "#000000");

    if (visualiser.profiles[visualiser.profileIndex].gradientColours.length < 2) {
        utils.createErrorSnackBar('At least two colours are required')
        return;
    }

    visualiser.gradientArray = new Gradient()
        .setColorGradient(...visualiser.profiles[visualiser.profileIndex].gradientColours)
        .setMidpoint(500)
        .getColors();

    utils.updateColours(visualiser);
    document.body.removeChild(document.querySelector('#gradientPicker'))
    document.body.removeChild(document.querySelector('#blockingDiv'))
}

closeHuePicker = function (visualiser) {
    document.body.removeChild(document.querySelector('#huePicker'))
    document.body.removeChild(document.querySelector('#blockingDiv'))
}

module.exports = {
    createColourGradientPicker, gradientColourClicked, clearGradientColour, closeColourGradientPicker,
    createHuePicker, hueColourClicked, closeHuePicker
}
