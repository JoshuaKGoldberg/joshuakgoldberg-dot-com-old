(function (window, document) {
    /**
     * 
     */
    const linkers = document.querySelectorAll("nav ul li");

    /**
     * 
     */
    const sections = document.querySelectorAll("section");

    /**
     * 
     */
    let selectedSection = 0;

    /**
     * 
     */
    function throttleSync(callback) {
        let running = false;

        return () => {
            if (running) {
                return;
            }

            running = true;

            setTimeout(() => {
                callback();
                running = false;
            });
        };
    }

    /**
     * 
     */
    function getCurrentSection(sections, offset) {
        for (let i = sections.length - 1; i >= 0; i -= 1) {
            if (sections[i].offsetTop < offset) {
                return i;
            }
        }

        return 0;
    }

    /**
     * 
     */
    function setSelectedSection(newSection) {
        for (const grouping of [linkers, sections]) {
            grouping[selectedSection].className = "";
            grouping[newSection].className = "selected";
        }

        selectedSection = newSection;
    }

    /**
     * 
     */
    function onScroll() {
        const offsetY = window.pageYOffset || document.documentElement.clientTop;
        const newSection = getCurrentSection(sections, offsetY + window.innerHeight / 2);

        setSelectedSection(newSection);
    }

    window.onload = () => {
        window.onscroll = throttleSync(onScroll);
        window.onscroll();
    };
})(window, document);
