"use strict";

document.componentRegistryContentLoader = {};
document.nextIdContentLoader = 0;

const INITIAL_STATE = {

  asyncRoutes : [

    // nrb prefix is an acronym of Non Render Blocking

    //{ method: "GET", route: 'nrb-top-packages',                 parameters: {sort:'desc'},  contentType: "sliderCustom", options: {callback: 'photoSlider'} },
    //{ method: "GET", route: 'nrb-top-surf-towns',               parameters: {sort:'desc'},  contentType: "slider"      , options: null },
    { method: "GET", route: 'nrb-recent-booked-packages',       parameters: {sort:'asc'},   contentType: "sliderCustom",  options: {callback: 'photoSlider'} },
    { method: "GET", route: 'nrb-unique-surf-accommodations',   parameters: {sort:'asc'},   contentType: "static",        options: null },
    { method: "GET", route: 'nrb-static-reviews-levels-ideas',  parameters: {sort:'asc'},   contentType: "staticHTML",    options: {container: true} },
    { method: "GET", route: 'nrb-static-modals',                parameters: {sort:'asc'},   contentType: "staticHTML",    options: {targetContainer: 'body'} }
  ],

  spinner : '<div class="dot"></div><div class="dot"></div><div class="dot"></div>',
  spinnerSelector: '.loading-dots'

};

class AsyncContentLoader {

  /**
   * Create a Surf Carousel
   * @param {Object} opts
   */
  constructor(opts) {

    // Component Registry for event handling
    this._id = ++document.nextIdContentLoader;
    document.componentRegistryContentLoader[this._id] = this;

    // Count id to allow resizeEnd event
    this.id_resize = 0;

    // Check if contentLoader exists, otherwise create it
    if(!document.body.querySelector('#contentLoader')) {

      let cL = this.buildElement('section', {id:'contentLoader',class:'text-center'}, false);
      document.body.appendChild(cL);

    }

    // Set initial state
    this.state = {};
    this.state.requestCount = 0;
    this.state.requesting = false;
    this.state.routes = INITIAL_STATE.asyncRoutes;
    this.state.spinner = INITIAL_STATE.spinner;
    this.state.spinnerSelector = INITIAL_STATE.spinnerSelector;

    // Bind all event handlers for referencability
    ['executeXHRequest', 'loopAsyncRoutes'].forEach(method => {
      this[method] = this[method].bind(this);
  });

    // Build markup and apply required styling to elements
    this.init();

  }

  /**
   * Loops all async routes to execute a new XHR Request
   * @param {int} id
   */
  loopAsyncRoutes(id) {

    const self = this;

    // Check if next request exists in array
    if(typeof self.state.routes[id] !== 'undefined') {

      const route = self.state.routes[id];
      self.executeXHRequest(id, route.route, route.method, route.parameters, route.contentType, route.options);

    }
    else {

      // Delete spinner
      self.loadingDots(0);

    }

  }

  /**
   * Executes a new XHR Request
   * @param {int} id
   * @param {string} route
   * @param {string} method
   * @param {object} params
   * @param {string} contentType
   * @param {object} options
   */
  executeXHRequest(id, route, method, params, contentType, options) {

    let self = this;

    self.setState({requesting:true});

    var esc = encodeURIComponent;

    let query = null;
    if(params !== false) {

      query = Object.keys(params)
          .map(k => esc(k) + '=' + esc(params[k]))
    .join('&');
    }

    // Create/Add loading dots
    self.loadingDots(1, id);

    var xhr = new XMLHttpRequest();
    xhr.open(method, route, true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.onreadystatechange = function (e) {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {

          if(typeof xhr.responseText !== 'string' || !xhr.responseText ) {
            return;
          }
          try{
            const results = JSON.parse(xhr.responseText);
            // Depending on contentType we will render differently
            self.parseResults(results, contentType, options);
          }catch(e){
            // If something wrong we use this to continue
            self.parseResults(null, false, null);
          }
          self.setState({requesting:false});

        } else {

          console.error(xhr.statusText);
          // If something wrong we use this to continue
          self.parseResults(null, false, null);
          self.setState({requesting:false});
        }
      }
    };
    xhr.onerror = function (e) {
      console.error(xhr.statusText);
      // If something wrong we use this to continue
      self.parseResults(null, false, null);
      self.setState({requesting:false});
    };
    xhr.send(query);

  }

  /**
   * Parse XHR results depending on route content type
   * @param {object} results
   * @param {string} contentType
   * @param {object} options
   */
  parseResults(results, contentType, options) {

    let self = this;
    let asyncSection = null;

    switch (contentType) {

      case "sliderCustom":
        asyncSection = self.parseSliderCustom(results);
        document.getElementById('contentLoader').appendChild(asyncSection);
        // You would need: https://github.com/franciscosurf/surf-carousel-js
        //self.runSurfSlider();
        break;

      case "slider":
        asyncSection = self.parseSlider(results);
        document.getElementById('contentLoader').appendChild(asyncSection);
        // You would need: https://github.com/franciscosurf/surf-carousel-js
        //self.runSurfSlider();
        // Run photoSlider to fade in the first carousel images (index.blade.php)
        self.photoSlider();
        break;

      case "static":
        asyncSection = self.parseStatic(results);
        document.getElementById('contentLoader').appendChild(asyncSection);
        break;

      case "staticHTML":
        asyncSection = self.parseStaticJustHTML(results, options);
        break;

      default:
        break;

    }

    // Exported default Intersection Observer bg images
    // You would need: https://github.com/franciscosurf/intersection-observer-vanilla-js
    //if (typeof myAppIO.observe === "function") {
    //  myAppIO.observe();
    //}

    // All elements with waitContentLoader will be visible now
    //if(self.state.requestCount === 2) {
    self.removeClassFromAllElements('.waitContentLoader');
    //}

    // Delete spinner
    self.loadingDots(0);

    // Need to run the photoSlider
    if(options && options.callback) this[options.callback]();

    // Once done, do a new request
    self.state.requestCount++;
    self.loopAsyncRoutes(self.state.requestCount);

  }

  /**
   * Creates a custom slider with own (non default) content (e.g. surf packages)
   * @param {object} results
   */
  parseSliderCustom(results) {

    let asyncSection = this.buildElement('section', null);
    asyncSection.classList.add('m50');
    asyncSection.innerHTML = `
        <div class="container asyncLoader dynamicLoader">
          <div class="row">
            <div class="col-md-12 heading-title">
              <h2 class="lined-heading text-left"><span class="pad0">${results.contentLoaderTitleSection}</span></h2>
              <p class="text-left">${results.contentLoaderSubtitleSection}</p>
            </div>

            <div class="col-sm-12 ${results.trackingSection != '' ? '[ tracking-info ]':''}" data-tracking-section="${results.trackingSection != '' ? results.trackingSection:''}" data-tracking-action="${results.trackingAction != '' ? results.trackingAction:''}">
              <div class="surfcarousel ${results.contentLoaderHTML == '' ? 'sc-initialised':''}" style="display:none;">
                  ${results.contentLoaderHTML}
              </div>

              ${results.contentLoaderLink == '' ? '': `<div class="text-left mt30"><a href="${results.contentLoaderLink}" class="ghost-btn">Show all (1,000+)</a></div>`}

            </div>
          </div>
        </div>
      `;

    return asyncSection;

  }

  /**
   * Creates a default carousel based on images
   * @param {object} results
   */
  parseSlider(results) {

    let asyncSection = this.buildElement('section', null);
    asyncSection.classList.add('m30');
    asyncSection.innerHTML = `
        <div class="container asyncLoader">
          <div class="row">
            <div class="col-md-12 heading-title">
              <h2 class="lined-heading text-left"><span class="pad0">${results.contentLoaderTitleSection}</span></h2>
              <p class="text-center">${results.contentLoaderSubtitleSection}</p>
            </div>

            <div class="col-sm-12 ${results.trackingSection != '' ? '[ tracking-info ]':''}" data-tracking-section="${results.trackingSection != '' ? results.trackingSection:''}" data-tracking-action="${results.trackingAction != '' ? results.trackingAction:''}">
              <div class="surfcarousel ${results.contentLoaderHTML == '' ? 'sc-initialised':''}" style="display:none;">
                  ${results.contentLoaderHTML.map((item, i) => `
                    <div data-image="/assets/frontend/images/best_towns/360x340${item.town.home_picture}"
                    data-url="/destinations/${item.town.country_slug}/${item.town.slug}"
                    data-heading="${item.town.display_name}"
                    data-subheading="${item.town.slogan}" data-places="${item.town.no_of_places}" data-spots="${item.town.no_of_spots}"></div>
                  `.trim()).join('')}
              </div>

              ${results.contentLoaderLink == '' ? '': `<div class="text-left mt30"><a href="${results.contentLoaderLink}" class="ghost-btn">Show all (1,000+)</a></div>`}

            </div>
          </div>
        </div>
      `;

    return asyncSection;

  }

  /**
   * Appends HTML content which has a title and subtitle or a button defined in the json response
   * @param {object} results
   */
  parseStatic(results) {

    let asyncSection = this.buildElement('section', null);
    asyncSection.classList.add('m50');
    asyncSection.innerHTML = `
        <div class="container asyncLoader dynamicLoader">
          <div class="row">
            <div class="col-md-12 heading-title">
              <h2 class="lined-heading text-left"><span class="pad0">${results.contentLoaderTitleSection}</span></h2>
              <p class="text-left">${results.contentLoaderSubtitleSection}</p>
            </div>

            <div class="col-sm-12 ${results.trackingSection != '' ? '[ tracking-info ]':''}" data-tracking-section="${results.trackingSection != '' ? results.trackingSection:''}" data-tracking-action="${results.trackingAction != '' ? results.trackingAction:''}">
                ${results.contentLoaderHTML}
                ${results.contentLoaderLink == '' ? '': `<div class="text-left mt30"><a href="${results.contentLoaderLink}" class="ghost-btn">Show all (1,000+)</a></div>`}
            </div>
          </div>
        </div>
      `;

    return asyncSection;

  }

  /**
   * Parse static results, only HTML to append directly
   * @param {object} results
   * @param {object} options
   */
  parseStaticJustHTML(results, options) {

    let asyncSection = null;

    // Append in a specified container
    if(typeof options  !== 'undefined' && typeof options.targetContainer !== 'undefined'){
      if(options.targetContainer !== '') {

        asyncSection = this.buildElement('div', null);
        asyncSection.innerHTML = `${results.contentLoaderHTML}`;

        document.querySelector(options.targetContainer).appendChild(asyncSection);

        return asyncSection;

      }
    }

    asyncSection = this.buildElement('section', null);
    if(!options || (options && options.container))
      asyncSection.classList.add('m50');
    asyncSection.innerHTML = `
        <div class="${(options && options.container === true ? `container`:``)} dynamicLoader">
          ${results.contentLoaderHTML}
        </div>
      `;

    document.getElementById('contentLoader').appendChild(asyncSection);

    return asyncSection;

  }

  /**
   * Creates or destroys the loading dots
   * @param {int} action, values: 0 destroy, 1 create
   * @param {int} idRequest,
   */
  loadingDots(action, idRequest) {

    let self = this;
    action = action || 0;
    idRequest = idRequest || self.state.requestCount;

    switch(action) {

      case 1:
        // Create
        // add spinner
        //const classesDots = idRequest === 0 ? 'loading-dots shready text-center' : 'loading-dots text-center'; // 1 if we use the best selling packages nrb
        const classesDots = 'loading-dots text-center';
        if(!document.querySelector(self.state.spinnerSelector)) {
          const spinner = self.buildElement('div', {class:classesDots}, self.state.spinner);
          document.getElementById('contentLoader').appendChild(spinner);
        }

        break;

      default:
        // Delete
        if(document.querySelector(self.state.spinnerSelector)) {
          let loading = document.querySelector(self.state.spinnerSelector);
          loading.parentNode.removeChild(loading);
        }
        break;

    }

  }

  /**
   * Runs a new instance of the Surf Carousel
   * Note: You would need https://github.com/franciscosurf/surf-carousel-js
   */
  runSurfSlider() {

    // Init other options like carousel
    const surfCarousel = document.querySelector('.asyncLoader .surfcarousel:not(.sc-initialised)');
    if(surfCarousel !== null){
      const surfCarouselInstance = new SurfCarousel({selector:surfCarousel});
    }

  }

  photoSlider() {

    let photoSliders = document.querySelectorAll('.to-fade');
    const photoSlidersLength = photoSliders.length;
    for(let i = 0; i < photoSlidersLength; i++) {
      photoSliders[i].classList.remove('to-fade-off');
    }

  }

  /**
   * Adds style markup
   */
  stylesMarkup() {

    // Apend styles
    let styles = document.createElement('style');
    styles.innerHTML = `
      .ghost-btn{transition:ease 0.5s background-color;display:inline-block;background:transparent;border:2px solid #0f639d;color:#0f639d;font-size:16px;margin:5px auto;padding:10px 30px;border-radius:2px;}.ghost-btn:hover{background-color:#0f639d;color:#fff;transition:ease 0.5s background-color;}.slider-p-controls.slider-prev{left:0;right:inherit}.slider-p-controls{padding:0 20px;display:flex;position:absolute;height:100%;right:0;align-items:center;z-index:9999;font-size:40px;text-shadow:0 1px 1px #656565;color:#fff}.h--160px-220pxR{height:160px!important}.details{font-size:12px}.details h4{padding:0 5px;white-space:nowrap;overflow:hidden;display:block;text-overflow:ellipsis;}.box-title small{font-size:11px;color:#666;text-transform:uppercase;display:block;margin-top:4px;font-weight:700}.price{color:#0a5489;font-size:1.6em!important;text-transform:uppercase;float:right;text-align:right;line-height:1;display:block}.price small{display:block;color:#333;font-size:.5em}.feedback{margin:5px 0;border-top:1px solid #f5f5f5;padding-top:5px;border-bottom:1px solid #f5f5f5}.feedback>div{display:inline-block;font-size:14px;color:#f60}.listing-style1.hotel .feedback .review,.listing-style1.cruise .feedback .review{display:block;float:right;text-transform:uppercase;font-size:.8333em;color:#9e9e9e}.details .review{width:100%;min-height:14px;display:block;float:right;text-transform:uppercase;font-size:.8333em;color:#9e9e9e}.details .whats-included-popup{font-size:14px;margin-bottom:10px}.details .badge{display:inline-block;min-width:10px;padding:3px 7px;font-size:12px;font-weight:700;line-height:1;color:#fff;text-align:center;white-space:nowrap;vertical-align:baseline;background-color:#999;border-radius:10px}.details .badge{margin-top:5px;margin-bottom:5px;background:#0a5489;cursor:pointer;cursor:hand}.details a.button{display:inline-block;line-height:1.8333em;white-space:nowrap;text-align:center;font-weight:700;background:#f60;height:43px;line-height:43px;width:100%;color:#fff}.display-block{display:block}.slider-p-controls{cursor:pointer;}.loading-dots{margin:30px auto}.loading-dots .dot{width: 13px;height: 13px;border: 2px solid #0F639D;border-radius: 50%;display: inline-block;margin: 0 5px;transform: scale(0);animation: fx 1000ms ease infinite 0ms}.loading-dots .dot:nth-child(2){animation: fx 1000ms ease infinite 300ms}.loading-dots .dot:nth-child(3){animation: fx 1000ms ease infinite 600ms}@keyframes fx{50%{transform: scale(1);opacity: 1}100%{opacity: 0}}.slider-p-controls{display:none;}.to-fade{transition:visibility 0.35s linear,opacity 0.35s linear}.to-fade-off{visibility:hidden!important;opacity:0!important;}
    `;
    document.body.appendChild(styles);

  }

  /**
   * Remove specific classes from all elements
   * @param selector
   */
  removeClassFromAllElements(selector) {

    var elems = document.querySelectorAll(selector);

    [].forEach.call(elems, function(el) {
      el.className = el.className.replace(/waitContentLoaderHidden|waitContentLoaderNone/gi, "");
    });

  }

  /**
   * Creates a DIV element, adds attributes and if true sets innerHTML
   * @param {object} props
   * @param {bool} dataVal
   * @returns {Element}
   */
  buildElement(elemType, props, dataVal) {

    elemType = elemType || 'div';
    dataVal = dataVal || false;

    let elementChild = document.createElement(elemType);
    for(let key in props) {
      if (props.hasOwnProperty(key)) {
        elementChild.setAttribute(key, props[key]);
      }
    }
    if(dataVal !== false)
      elementChild.innerHTML = dataVal;

    return elementChild;
  }

  /**
   * Set state
   * @param {object} props
   */
  setState(props) {

    for (let key in props) {
      if (props.hasOwnProperty(key)) {
        this.state[key] = props[key];
      }
    }

    // Re-render after state updated
    //this.render();
  }

  /**
   * Inits the async content instance
   */
  init() {

    // Add the styles
    this.stylesMarkup();

    // Run the first slider for "Best Selling SC Packages"
    // You would need: https://github.com/franciscosurf/surf-carousel-js
    //this.runSurfSlider();

    // Loop the async routes
    this.loopAsyncRoutes(this.state.requestCount);

  }

}

let asyncContent = new AsyncContentLoader({});
