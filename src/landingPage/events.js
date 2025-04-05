const more_button = document.getElementById("more_info_button");
const more_menu = document.getElementById("more_info_menu");
const site_blur = document.getElementById("site_blur");

document.body.addEventListener("click", (event) => {
    const target = event.target;

    if (!more_button.contains(target) && !more_menu.contains(target)) {
        site_blur.classList.add('no-blur');
        more_menu.style.display = "none";
    } else if (more_button.contains(target)) {
        site_blur.classList.remove('no-blur');
        more_menu.style.display = "block";
    }
});
