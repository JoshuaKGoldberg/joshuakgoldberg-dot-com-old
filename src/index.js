(function (window, document) {
    /**
     * ToC-style List elements from the navbar.
     */
    const linkers = document.querySelectorAll("nav ul li");

    /**
     * Main sections of the page.
     */
    const sections = document.querySelectorAll("section");

    /**
     * Which section is currently selected.
     */
    let selectedSection = 0;

    /**
     * Throttles a synchronous callback to only run one at a time.
     * 
     * @param {Function} callback
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
     * @returns {Number}   The current pageYOffset.
     */
    function getOffsetY() {
        return window.pageYOffset || document.documentElement.clientTop;
    }

    /**
     * Determines which section is currently active from the current offsetY.
     * 
     * @param {HTMLElement[]}   Sections of the page.
     * @param {number} offsetY   The current offsetY.
     * @param {number} partialHeight   How much of the page to account for with scrolling.
     * @returns {number}   The index of the apparent current section.
     */
    function getCurrentSection(sections, offsetY, partialHeight) {
        if (offsetY === 0) {
            return 0;
        }

        offsetY += partialHeight;

        for (let i = sections.length - 1; i >= 0; i -= 1) {
            if (sections[i].offsetTop < offsetY) {
                return i;
            }
        }

        return 0;
    }

    /**
     * Sets the current selected section.
     * 
     * @param {number} newSection   The new selected section's index.
     */
    function setSelectedSection(newSection) {
        for (const grouping of [linkers, sections]) {
            grouping[selectedSection].className = "";
            grouping[newSection].className = "selected";
        }

        selectedSection = newSection;
    }

    /**
     * Sets the current page's hash without reloading.
     * 
     * @param {string} hash   A new section ID for a hash.
     */
    function setLocationHash(hash) {
        const element = document.getElementById(hash);

        element.id = "";
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, "", "#" + hash);
        } else {
            window.location.hash = "#" + hash;
        }
        element.id = hash;

        if (!window.history || !window.history.pushState) {
            return;
        }
    }

    /**
     * Asynchronously scrolls to a section on the page.
     * 
     * @param {number} sectionIndex   Which section to scroll to.
     * @remarks This is gated behind a status flag so calling it multiple
     *          times in rapid succession won't interfere with its state.
     */
    const scrollToSection = (() => {
        let scrolling = false;

        return sectionIndex => {
            if (scrolling) {
                return;
            }

            scrolling = true;

            const element = sections[sectionIndex];
            let lastOffsetY;

            const scroller = () => {
                const offsetY = getOffsetY();
                const offsetTop = element.offsetTop;
                let difference = offsetTop - offsetY;

                if (offsetY === lastOffsetY || difference === 0) {
                    scrolling = false;
                    lastOffsetY = undefined;
                    return;
                }

                if (difference > 0) {
                    difference = Math.min(difference, 49);
                } else {
                    difference = Math.max(difference, -49);
                }

                lastOffsetY = offsetY;
                window.scrollTo(0, offsetY + difference);
                requestAnimationFrame(scroller);
            };

            scroller();
        };
    })();

    /**
     * Handles the page scrolling by checking for section selection.
     */
    function onScroll() {
        const offsetY = getOffsetY();
        const newSection = getCurrentSection(sections, offsetY, window.innerHeight / 2);

        setSelectedSection(newSection);
        setLocationHash(sections[newSection].id);
    }

    window.onload = () => {
        window.onscroll = throttleSync(onScroll);
        window.onscroll();

        for (let i = 0; i < linkers.length; i += 1) {
            linkers[i].onclick = event => {
                if (event.ctrlKey) {
                    return;
                }

                scrollToSection(i);
                event.preventDefault();
            };
        }
    };
})(window, document);
