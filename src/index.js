(function (window, document) {
    /**
     * ToC-style List elements from the navbar.
     */
    const linkers = [].slice.call(document.querySelectorAll("nav ul li"));

    /**
     * Main sections of the page.
     */
    const sections = [].slice.call(document.querySelectorAll("section"));

    /**
     * Images that will need to fade in.
     */
    const images = [].slice.call(document.querySelectorAll("img"));

    /**
     * CSS media query threshold to not load images.
     */
    const thinScreenThreshold = 560;

    /**
     * How many milliseconds to wait before initial fading in.
     */
    const initialFadeInDelay = 117;

    /**
     * How many milliseconds it takes for an image to fade in or out.
     */
    const imageOpacityFadeTime = 350;

    /**
     * Data prefix for storing image data locally.
     */
    const localStoragePrefix = "jkg-dot-com-images:";

    /**
     * Maps event keys to -1 (left) or 1 (right).
     */
    const eventKeyCodes = {
        37: -1,
        39: 1,
    }

    /**
     * Which section is currently selected.
     */
    let selectedSection = 0;

    /**
     * Whether scroll events are attached to the window.
     */
    let addedScrollEvents = false;

    /**
     * Loads an image's source then fades it in.
     * 
     * @param {HTMLImageElement} image   Image to visually fade in.
     * @param {Boolean} skipRequest   Whether to skip requesting an image before setting it.
     */
    function fadeImageIn(image) {
        const newImageUri = image.getAttribute("data-src");
        const storageKey = localStoragePrefix + newImageUri;

        const storedData = localStorage.getItem(storageKey);
        if (storedData) {
            image.className += " loading";
            setTimeout(
                () => {
                    image.setAttribute("src", storedData);
                    image.className = image.className.replace("loading", "loaded");
                },
                imageOpacityFadeTime);
            return;
        }

        const loadRequest = new XMLHttpRequest();

        loadRequest.addEventListener("load", () => {
            const response = loadRequest.response;

            image.className += " loading";

            setTimeout(
                () => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        localStorage.setItem(storageKey, reader.result);
                        image.setAttribute("src", reader.result);
                        image.className = image.className.replace("loading", "loaded");
                    };
                    reader.readAsDataURL(response);
                },
                imageOpacityFadeTime);
        });

        loadRequest.responseType = "blob";
        loadRequest.open("GET", newImageUri);
        loadRequest.send();
    }

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
     * Visually sets the current selected section.
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
            removeScrollEvents();

            const element = sections[sectionIndex];
            let lastOffsetY;

            const scroller = () => {
                const offsetY = getOffsetY();
                const offsetTop = element.offsetTop;
                let difference = offsetTop - offsetY;

                if (offsetY === lastOffsetY || difference === 0) {
                    scrolling = false;
                    lastOffsetY = undefined;
                    addScrollEvents();
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
     * Handles a key press by navigating to a next section if applicable.
     * 
     * @param {KeyboardEvent} event   The triggering event.
     */
    function onKeyDown(event) {
        if (event.shiftKey || event.ctrlKey) {
            return;
        }

        const direction = eventKeyCodes[event.keyCode];
        if (!direction) {
            return;
        }

        const newSection = selectedSection + direction;
        if (newSection < 0 || newSection === sections.length) {
            return;
        }

        setSelectedSection(newSection);
        scrollToSection(newSection);
    }

    /**
     * Handles the page scrolling by checking for section selection.
     */
    const onScroll = throttleSync(function () {
        const offsetY = getOffsetY();
        const newSection = getCurrentSection(sections, offsetY, window.innerHeight / 2);

        if (newSection !== selectedSection) {
            setSelectedSection(newSection);
        }

        setLocationHash(sections[newSection].id);
    });

    /**
     * Attaches scrolling events to the window if they're not already attached.
     */
    function addScrollEvents() {
        if (addedScrollEvents) {
            return;
        }

        window.addEventListener("scroll", onScroll);
        addedScrollEvents = true;
    }

    /**
     * Removes attached scrolling events from the window.
     */
    function removeScrollEvents() {
        window.removeEventListener("scroll", onScroll);
        addedScrollEvents = false;
    }

    /**
     * Handles screen resizing by checking if images should load.
     */
    function onResize() {
        if (innerWidth < thinScreenThreshold) {
            return;
        }

        window.removeEventListener("resize", onResize);

        for (let i = 0; i < images.length; i += 1) {
            setTimeout(fadeImageIn, i * 140, images[i]);
        }
    }

    /**
     * Navigates to a linker's section.
     * 
     * @param {Event} event   The triggering event.
     * @param {number} sectionIndex   Section index to scroll to.
     */
    function clickLinker(event, sectionIndex) {
        if (event.ctrlKey) {
            return;
        }

        setSelectedSection(sectionIndex);
        scrollToSection(sectionIndex);
        event.preventDefault();
    }

    /**
     * Handles the page loading by setting up scrolling and links.
     */
    function onLoad() {
        window.removeEventListener("load", onLoad);
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("resize", onResize);
        window.addEventListener("scroll", onScroll);

        window.addEventListener("touchcancel", addScrollEvents);
        window.addEventListener("touchend", addScrollEvents);
        window.addEventListener("touchstart", removeScrollEvents);

        addScrollEvents();
        onScroll();

        setTimeout(
            () => {
                if (selectedSection === 0) {
                    setSelectedSection(0);
                }
            },
            initialFadeInDelay);

        for (let i = 0; i < linkers.length; i += 1) {
            linkers[i].onclick = event => clickLinker(event, i);
        }
    }

    window.addEventListener("load", onLoad);
    onResize();

    setTimeout(() => document.body.style.opacity = "1", initialFadeInDelay);
})(window, document);
