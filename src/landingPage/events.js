const more_button = document.getElementById("more_info_button");
const more_menu = document.getElementById("more_info_menu");
const site_blur = document.getElementById("site_blur");

// MORE INFO MENU

document.body.addEventListener("click", (event) => {
    const target = event.target;

    if (!more_button.contains(target) && !more_menu.contains(target)) {
        site_blur.classList.add('no-blur');
        more_menu.style.display = "none";
    } else if (more_button.contains(target)) {
        site_blur.classList.remove('no-blur');
        more_menu.style.display = "flex";
    }
});

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
