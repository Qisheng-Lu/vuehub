let at_bottom = () => new Promise((resolve, reject) => {
    let check_scroll = () => {
        console.log('checking scroll');
        let d = document.documentElement;
        let offset = d.scrollTop + window.innerHeight;
        if (offset >= d.offsetHeight)
            resolve('hit bottom');
    };
    // check if we're already at bottom
    check_scroll();
    // check if we're at bottom each scroll
    window.onscroll = check_scroll;
});
