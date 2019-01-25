// @ts-check

(function (window, document) {
    /**
     * ToC-style List elements from the navbar.
     */
    var linkers = [].slice.call(document.querySelectorAll("nav ul li"));

    /**
     * Main sections of the page.
     */
    var sections = [].slice.call(document.querySelectorAll("section"));

    /**
     * Images that will need to fade in.
     */
    var images = [].slice.call(document.querySelectorAll("img"));

    /**
     * CSS media query threshold to not load images.
     */
    var thinScreenThreshold = 560;

    /**
     * How many milliseconds to wait before initial fading in.
     */
    var initialFadeInDelay = 117;

    /**
     * How many milliseconds it takes for an image to fade in or out.
     */
    var imageOpacityFadeTime = 350;

    /**
     * Data prefix for storing image data locally.
     */
    var localStoragePrefix = "jkg-dot-com-images:";

    /**
     * Which section is currently selected.
     */
    var selectedSection = 0;

    /**
     * Whether scroll events are attached to the window.
     */
    var addedScrollEvents = false;

    /**
     * Loads an image's source then fades it in.
     * 
     * @param {HTMLImageElement} image   Image to visually fade in.
     */
    function fadeImageIn(image) {
        var newImageUri = image.getAttribute("data-src");
        var storageKey = localStoragePrefix + newImageUri;

        var storedData = localStorage.getItem(storageKey);
        if (storedData) {
            image.className += " loading";
            setTimeout(
                function ()  {
                    image.setAttribute("src", storedData);
                    image.className = image.className.replace("loading", "loaded");
                },
                imageOpacityFadeTime);
            return;
        }

        var loadRequest = new XMLHttpRequest();

        loadRequest.addEventListener("load", function ()  {
            var response = loadRequest.response;

            image.className += " loading";

            setTimeout(
                function ()  {
                    var reader = new FileReader();
                    reader.onloadend = function ()  {
                        localStorage.setItem(storageKey, reader.result.toString());
                        image.setAttribute("src", reader.result.toString());
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
        var running = false;

        return function () {
            if (running) {
                return;
            }

            running = true;

            setTimeout(function ()  {
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
     * @param {HTMLElement[]} sections   Sections of the page.
     * @param {number} offsetY   The current offsetY.
     * @param {number} partialHeight   How much of the page to account for with scrolling.
     * @returns {number}   The index of the apparent current section.
     */
    function getCurrentSection(sections, offsetY, partialHeight) {
        if (offsetY === 0) {
            return 0;
        }

        offsetY += partialHeight;

        for (var i = sections.length - 1; i >= 0; i -= 1) {
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
        updateSelectionClassNames(newSection, linkers);
        updateSelectionClassNames(newSection, sections);

        selectedSection = newSection;
    }

    /**
     * Swaps the class names for a grouping's two elements.
     * 
     * @param {number} newSection   The new selected section's index.
     * @param {Object} grouping   Object containing two sections to update.
     */
    function updateSelectionClassNames(newSection, grouping) {
        grouping[selectedSection].className = "";
        grouping[newSection].className = "selected";

    }

    /**
     * Sets the current page's hash without reloading.
     * 
     * @param {string} hash   A new section ID for a hash.
     */
    function setLocationHash(hash) {
        var element = document.getElementById(hash);

        element.id = "";

        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, "", "#" + hash);
        } else {
            window.location.hash = "#" + hash;
        }

        element.id = hash;
    }

    var scrollToSection = (function ()  {
        var scrolling = false;

        /**
         * Asynchronously scrolls to a section on the page.
         * 
         * @param {number} sectionIndex   Which section to scroll to.
         * @remarks This is gated behind a status flag so calling it multiple
         *          times in rapid succession won't interfere with its state.
         */
        return function (sectionIndex) {
            if (scrolling) {
                return;
            }

            scrolling = true;
            removeScrollEvents();

            var element = sections[sectionIndex];
            var lastOffsetY;

            var scroller = function ()  {
                var offsetY = getOffsetY();
                var offsetTop = element.offsetTop;
                var difference = offsetTop - offsetY;

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
     * Handles the page scrolling by checking for section selection.
     */
    var onScroll = throttleSync(function () {
        var offsetY = getOffsetY();
        var newSection = getCurrentSection(sections, offsetY, window.innerHeight / 2);

        if (newSection !== selectedSection) {
            setSelectedSection(newSection);
            setLocationHash(sections[newSection].id);
        }
    });

    /**
     * Attaches scrolling events to the window if they're not already attached.
     */
    function addScrollEvents() {
        if (addedScrollEvents) {
            return;
        }

        window.addEventListener("scroll", onScroll, {
            passive: true,
        });
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

        for (var i = 0; i < images.length; i += 1) {
            setTimeout(fadeImageIn, i * 140, images[i]);
        }
    }

    /**
     * Navigates to a linker's section.
     * 
     * @param {MouseEvent} event   The triggering event.
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
        window.addEventListener("resize", onResize, {
            passive: true,
        });
        window.addEventListener("scroll", onScroll, {
            passive: true,
        });

        onScroll();

        setTimeout(
            function ()  {
                if (selectedSection === 0) {
                    setSelectedSection(0);
                }
            },
            initialFadeInDelay);

        for (var i = 0; i < linkers.length; i += 1) {
            linkers[i].onclick = function (event) {
                clickLinker(event, i);
            };
        }
    }

    window.addEventListener("load", onLoad);
    onResize();

    setTimeout(
        function () {
            document.body.style.opacity = "1";
        },
        initialFadeInDelay);
})(window, document);
