// @ts-check

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
   * Images and emojis that will need to fade in.
   */
  const imageLikes = [].slice.call(document.querySelectorAll("img, .emoji"));

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
  const imageLikeOpacityFadeTime = 350;

  /**
   * Data prefix for storing image data locally.
   */
  const localStoragePrefix = "jkg-dot-com-images:";

  /**
   * Which section is currently selected.
   * @type {number}
   */
  let selectedSection;

  /**
   * Loads an image's source then fades it in.
   *
   * @param {HTMLElement} imageLike   Image or emoji to visually fade in.
   */
  function fadeImageLikeIn(imageLike) {
    if (imageLike.tagName === "IMG") {
      fadeImageIn(imageLike);
    } else {
      fadeEmojiIn(imageLike);
    }
  }

  /**
   * Fades an emoji from its temporary circle to an image.
   *
   * @param {HTMLElement} emoji   Image or emoji to visually fade in.
   */
  function fadeEmojiIn(emoji) {
    setTimeout(() => {
      emoji.classList.add("loaded");
    }, imageLikeOpacityFadeTime);
  }

  /**
   * Loads an image's source then fades it in.
   *
   * @param {HTMLElement} image   Image to visually fade in.
   */
  function fadeImageIn(image) {
    const newImageUri = image.getAttribute("data-src");
    const storageKey = localStoragePrefix + newImageUri;

    const storedData = localStorage.getItem(storageKey);
    if (storedData) {
      image.classList.add("loading");
      setTimeout(function () {
        image.setAttribute("src", storedData);
        image.classList.replace("loading", "loaded");
      }, imageLikeOpacityFadeTime);
      return;
    }

    const loadRequest = new XMLHttpRequest();

    loadRequest.addEventListener("load", function () {
      const response = loadRequest.response;

      image.classList.add("loading");

      setTimeout(function () {
        const reader = new FileReader();
        reader.onloadend = function () {
          localStorage.setItem(storageKey, reader.result.toString());
          image.setAttribute("src", reader.result.toString());
          image.classList.replace("loading", "loaded");
        };
        reader.readAsDataURL(response);
      }, imageLikeOpacityFadeTime);
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

    return function () {
      if (running) {
        return;
      }

      running = true;

      setTimeout(function () {
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
    if (selectedSection !== undefined) {
      grouping[selectedSection].className = "";
    }

    grouping[newSection].className = "selected";
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
   * Handles the page scrolling by checking for section selection.
   */
  const onScroll = throttleSync(function () {
    const offsetY = getOffsetY();
    const newSection = getCurrentSection(sections, offsetY, window.innerHeight / 4);

    if (newSection !== selectedSection) {
      setSelectedSection(newSection);
      setLocationHash(sections[newSection].id);
    }
  });

  /**
   * Handles screen resizing by checking if images should load.
   */
  function onResize() {
    if (innerWidth < thinScreenThreshold) {
      return;
    }

    window.removeEventListener("resize", onResize);

    for (let i = 0; i < imageLikes.length; i += 1) {
      setTimeout(fadeImageLikeIn, i * 140, imageLikes[i]);
    }
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
    window.addEventListener("click", onScroll, {
      passive: true,
    });

    onScroll();
    setTimeout(onScroll, initialFadeInDelay);
  }

  window.addEventListener("load", onLoad);
  onResize();

  setTimeout(function () {
    document.getElementById("everything").classList.add("loaded");
  }, initialFadeInDelay);
})(window, document);
