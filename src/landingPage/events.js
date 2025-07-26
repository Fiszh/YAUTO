const site_blur = document.getElementById("site_blur");

// COLOR PICKER

const defaultColor = '#191919';

const pickr = Pickr.create({
    el: '#color-picker',
    theme: 'monolith',
    appClass: 'picker_dark',
    default: defaultColor,
    components: {
        preview: false,
        opacity: true,
        hue: true,
        interaction: {
            input: true,
            save: false,
            cancel: false,
            clear: true,
        },
    },
});

const colorBox = document.querySelector('.chat_preview');
const pickerButton = document.querySelector('.pcr-button');

pickr.on('change', (color) => {
    colorBox.style.background = color.toHEXA().toString();
    pickerButton.style.setProperty('--pcr-color', color.toHEXA().toString());
});

pickr.on('clear', () => {
    colorBox.style.background = defaultColor;
    pickr.setColor(defaultColor);
});
