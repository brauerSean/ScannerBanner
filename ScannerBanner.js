(function() {
    'use strict';

    console.log('Pardon the dust...');

    var sbStyles = `

    button#bannerButton {
        display: none;
    }
    .ctrlPanel {
        color: white;
        font-size: 2vh;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .styleSaver {
        background: #30363d;
        color: white;
        border: none;
        border-radius: 5px;
        margin: 2px;
        z-index: 9999;
        width: 10vw;
        height: auto;

    }

    i[id^="delB-"] {
        color: white;
        padding: 5px;
        z-index: 9999;
    }

    i[id^="delB-"]:hover {
        color: red;
    }
    #sbContainer .bContainer {
        margin: 0px 0px 5px 0px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }
    .barcodeLabel {
        color: #98bd6b;
        font-size: 3vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: row;
    }
    .barcode-svg {
        border-radius: 2px;
        height: 5vh;
        width: auto;
    }

    #sbContainer {
        overflow: auto;
        height: 100vh;
        width: auto;
        display: block;
        position: fixed;
        top: 0px;
        padding: 2px;
        background-color: rgba(48, 54, 61, .7);
        z-index: 9997;
    }

    #sbContainer input[type="text"] {
        background-color: #30363d;
        color: white;
        width: 20vw;
        height: auto;
        border: none;
        border-radius: 5px;
        text-align: center;
        margin: 2px auto;
    }

    #keycodeContainer {
        display: flex;
        justify-content: space-evenly;
        align-items: flex-start;
        position: fixed;
        bottom: 0;
        left: 0;
        height: 8vh;
        width: 100vw;
        z-index: 9998;
        background-color: rgba(48, 54, 61, .7);
    }
    .fixedSize {
        width: 150vh;
    }
    #mahlogah {
        width: 100%;
        height: 8vh;
    }
    .kclabels {
        color: white;
        font-family: Verdana;
        font-size: 2vh;
        text-align: center;
        width: 100%;
    }
    .kc {
        flex: 1;
        padding: 5px;
        width: 5vw;
    }
    .flipSBL {
        left: 0;
    }
    .flipSBR {
        right: 0;
    }
    .flipKCL {
        flex-direction: row;
    }
    .flipKCR {
        flex-direction: row-reverse;

    }

    button[id^="incSpace"], [id^="deSpace"] {
        font-size: 3vh;
        padding: 3px;
        margin: 3px;
        background: none;
        border: none;
        color: white;
    }
    #scanMe {
        width: 20vw;
        height: auto;
        display: none;
    }
    `
    GM_addStyle(sbStyles);
    GM_addStyle(`@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');`);


    const keys = GM_listValues();
/*
    //log keys:values for debugging
    function letsTest() {
    keys.forEach((key) => {
      const value = GM_getValue(key);
      console.log(`Key: ${key}, Value: ${value}`);
    });}
*/
    let barcodes = [];
    let bannerState = GM_getValue('canSeeBanner', 'block');
    let keycodesVisible = GM_getValue('canSeeKeycodes', 'flex');
    let blurState = [];
    let altNames = GM_getValue('nameChanges', {});
    let ddSide = GM_getValue('ddside') || 'flipSBL';
    let kcSide = GM_getValue('kcside') || 'flipKCL';
    let spacedOut = [];
    var bannerButton = document.createElement('button')
    bannerButton.setAttribute('id', 'bannerButton');
    document.body.appendChild(bannerButton);

    document.addEventListener('keydown', function(event) {
      // Check if the key combination is Ctrl+Shift
      if (event.ctrlKey && event.altKey) {
        event.preventDefault();
        bannerButton.click();
      }
    });

    // Create keycode banner for keyboard key shortcuts
    var keycodes = document.createElement('div');
    keycodes.setAttribute('id', "keycodeContainer");
    keycodes.setAttribute('style', 'display: none; ');
    keycodes.setAttribute('class', (ddSide === 'flipSBL') ? 'flipKCL' : 'flipKCR')
    keycodes.insertAdjacentHTML("afterbegin", `
                                <div class="fixedSize"><img src='https://placehold.co/250x55/grey/white?text=Scanner+Banner' id='mahlogah'></div>
                                <label class= "kclabels">
                                Enter<br>
                                <img src="https://i.postimg.cc/3J5Kn6Lg/enter-Key-Thin.png" class='kc'>
                                </label>
                                <label class= "kclabels">
                                Refresh<br>
                                <img src="https://i.postimg.cc/1z9XMT3W/f5-Key-Thin.png" class='kc'>
                                </label>
                                <label class= "kclabels">
                                Tab<br>
                                <img src="https://i.postimg.cc/DfgS47fS/tabkeythin.png" class='kc'>
                                </label>
                                `);
    document.body.appendChild(keycodes);
    let shareMe = document.getElementById('mahlogah');

    shareMe.addEventListener('click', function() {
        let scanMe = document.getElementById('scanMe');
        scanMe.style.display = (scanMe.style.display === 'none') ? 'flex' : 'none';
    });

    // Create the dropdown menu
    var dropdown = document.createElement('div');
    dropdown.setAttribute('id', "sbContainer");
    dropdown.insertAdjacentHTML("afterbegin", `
                                <div class="ctrlPanel">
                                <input type="text"
                                       id="newBarcode"
                                       maxlength="20"
                                       placeholder="Type barcode. Press Enter."></div>
                                <div class="ctrlPanel">
                                <button id='clearAll' class='styleSaver'>Clear</button>
                                <button id='flip' class='styleSaver'>Flip</button>
                                </div>
                                <img src='https://i.postimg.cc/rph6LQhh/Scanner-Banner.jpg' id='scanMe' title="Click to share">`);
    document.body.appendChild(dropdown);
    let flipButton = document.getElementById('flip');
    dropdown.setAttribute('class', ddSide);
    let dropdownClass = dropdown.getAttribute('class');

    flipButton.addEventListener('click', function() {
        dropdownClass = dropdown.getAttribute('class');
        if (dropdownClass === 'flipSBL') {
            dropdown.setAttribute('class', 'flipSBR');
            keycodes.setAttribute('class', 'flipKCR');
            shiftLeft();
        } else {
            dropdown.setAttribute('class', 'flipSBL');
            keycodes.setAttribute('class', 'flipKCL');
            shiftRight();
        }

        GM_setValue('ddside', dropdown.getAttribute('class'));
        GM_setValue('kcside', keycodes.getAttribute('class'));
    })
    // Grab the clear all button element
    var clearAllButton = document.getElementById('clearAll');
    // functions etc
    function resetMargins () {
        document.body.style.marginLeft = '0px';
        document.body.style.marginRight = '0px';
    }
    function updateMargins () {
        document.body.style.marginLeft = (ddSide === 'flipSBL') ? '225px' : '0px';
        document.body.style.marginRight = (ddSide === 'flipSBL') ? '0px' : '255px';
    }
    function shiftRight() {
        document.body.style.marginLeft = `225px`;
        document.body.style.marginRight = '0px';
    }
    function shiftLeft() {
        document.body.style.marginRight = `225px`;
        document.body.style.marginLeft = '0px';
    }
       // Function to handle updating autoCopyState
    function updateAutoCopyState() {
        GM_setValue('canSeeBanner', bannerState);
        GM_setValue('canSeeKeycodes', keycodesVisible);
        GM_setValue('ddside', dropdown.getAttribute('class'));
        GM_setValue('kcside', keycodes.getAttribute('class'));
        GM_setValue('nameChanges', altNames);
        GM_setValue('spacedout', spacedOut);
    }


    function blurIt(blarray) {
        blarray.forEach(function(bl) {
            if (barcodes.indexOf(bl) !== -1) {
                let blurItAgain = document.getElementById(`${bl}`);
                blurItAgain.style.filter = 'blur(5px)';
            }
        })
    }

    function tempClear() {
        barcodes = [];
        GM_deleteValue("savedArray");
        let grabAllCodes = document.querySelectorAll('[id*="barBox-"]');
        grabAllCodes.forEach(function(code) {
            removeBarcode(code.getAttribute("id"));
        });
    }

    //create barcode with delete button. saves to local storage
    function addBarcode(text) {
        let dupeTest = barcodes.indexOf(text)
        if (dupeTest === -1 && text.length <= 20 && text !== '') {
            dropdown.insertAdjacentHTML("beforeend", `
        <div id="barBox-${text}"class="bContainer" title="${text}">
             <div class="barcodeLabel"><p id="bl-${text}" hint="${text}" style="margin: 0px; padding: 0px; text-size-adjust: none;">${text}</p><i class="fas fa-trash-alt" id="delB-${text}"></i></div>
             <div width='100%' class="barcodeLabel">
             <svg id="${text}"
              class="barcode-svg"
              jsbarcode-format="CODE128"
              jsbarcode-value="${text}"
              jsbarcode-displayvalue="false"
              jsbarcode-linecolor="#30363d"
              jsbarcode-margin="3"
              jsbarcode-marginleft="5"
              jsbarcode-marginright="5"
              jsbarcode-textmargin="0"
              jsbarcode-height="20vh"
              jsbarcode-width="1"></svg>
              </div><button id='incSpace${text}'>+</button>
        </div>`);
        JsBarcode(".barcode-svg").init();
        blurIt(blurState);

        var deleteButton = document.getElementById(`delB-${text}`);
        deleteButton.addEventListener('click', function() {
            delete altNames[`bl-${text}`];
            if (blurMe.style.filter === 'blur(5px)') { updateBlur() };
            removeBarcode("barBox-" + text);
            let barDex = barcodes.indexOf(text);
            if (barDex !== -1) {
                barcodes.splice(barDex, 1);
                GM_setValue("savedArray", barcodes);
            }
        });
        let nameChange = (old) => {
            try {
                let newName = prompt("New Name: (30 character max)",`${text}`).trim();
                newName = (newName === null || newName === '') ? old.innerText : newName;
                //console.log('before: ', newName);
                if (newName.length > 30) {newName = newName.substring(0, 30)}
                //console.log('after: ', newName);
                if (newName !== old.innerText) {
                    altNames[old.id] = newName;
                    GM_setValue('nameChanges', altNames);
                    old.innerText = newName;
                }
            } catch (error) {
                console.log(error);
              }

        };
        document.getElementById(`bl-${text}`).addEventListener('click', function() {
            nameChange(this);
        });
        document.getElementById(`incSpace${text}`).addEventListener('click', function() {
            let boxSpace = document.getElementById(`barBox-${text}`);
            if (boxSpace.style.marginTop === "75px") {
                boxSpace.style.marginTop = "5px";
                boxSpace.style.marginBottom = "5px";
                this.innerText = '+';
                let minus = spacedOut.indexOf(this.id);
                spacedOut.splice(minus, 1);
                GM_setValue('spacedout', spacedOut);
            } else {
                boxSpace.style.marginTop = "75px";
                boxSpace.style.marginBottom = "75px";
                this.innerText = '-';
                if (spacedOut.includes(this.id) === false) {
                    spacedOut.push(this.id);
                    GM_setValue('spacedout', spacedOut);
                }
            }
        });
        var blurMe = document.getElementById(text);
        function updateBlur() {
            blurMe.style.filter = (blurMe.style.filter !== 'blur(5px)') ? 'blur(5px)' : 'none'
            if (blurMe.style.filter === 'blur(5px)') {
                blurState.push(text); // adding item to array for saving to script storage
                GM_setValue('bluredCodes', blurState); //save array to storage
            }
            else {
                var index = blurState.indexOf(text);
                if (index !== -1) {
                    blurState.splice(index, 1);
                    GM_setValue('bluredCodes', blurState);
                }
            }};

        //creates a blur listener on click
        blurMe.addEventListener('click', function() {
            updateBlur();
        });

        //adds barcodes text to the barcodes array
        barcodes.push(`${text}`);
        GM_setValue("savedArray", barcodes);
        }
    };

    function loadBarcodes() {
        // Load saved barcodes
        var savedBarcodes = GM_getValue("savedArray", null);
        var secretSaved = savedBarcodes;
        let savedBlurs = GM_getValue('bluredCodes', []);
        blurState = savedBlurs;
        tempClear();
        if (secretSaved!== null && secretSaved !== "") {
            secretSaved.forEach(function(barcode) {
                addBarcode(barcode);
            });
            secretSaved.forEach(function(barcode) {
                if (savedBlurs.indexOf(barcode) !== -1) {
                    let blurItAgain = document.getElementById(`${barcode}`);
                    blurItAgain.style.filter = 'blur(5px)';
                };
            })
        }
        secretSaved = [];
        renameBarcodes(barcodes);
        respace(barcodes);
    };
    loadBarcodes();

    function renameBarcodes(anArray) {
        anArray.forEach((bc) => {
            if(altNames){
                if (`bl-${bc}` in altNames) {
                    let bLabel = document.getElementById(`bl-${bc}`)
                    let altName = altNames[`bl-${bc}`];
                    bLabel.innerText = altName;
                }
            };
        });
    };
    function respace(anArray) {
        spacedOut = GM_getValue('spacedout') || [];
        if (spacedOut) {
            anArray.forEach((bc) => {
                if (spacedOut.includes(`incSpace${bc}`)) {
                        let spaceMe = document.getElementById(`incSpace${bc}`);
                        spaceMe.click();
                }
            });
        }
    }
    function handleTabChange(event) {

      if (event.type === 'blur') {
        // Tab is inactive
        updateAutoCopyState();
        } else if (event.type === 'focus') {
            // Tab is active
            ddSide = GM_getValue('ddside');
            console.log(`focus event value: ${ddSide}`);
            dropdown.setAttribute('class', ddSide);
            kcSide = GM_getValue('kcside');
            keycodes.setAttribute('class', kcSide);
            altNames = GM_getValue('nameChanges')|| {};
            loadBarcodes();
            spacedOut = GM_getValue('spacedout');
            bannerState = GM_getValue('canSeeBanner');
            dropdown.style.display = bannerState;
            (bannerState === 'none') ? resetMargins() : updateMargins();
            keycodesVisible = GM_getValue('canSeeKeycodes');
            keycodes.style.display = keycodesVisible
            }
    }
    // Attach the event listeners to the window object
    window.addEventListener('blur', handleTabChange);
    window.addEventListener('focus', handleTabChange);

    function saveInput () {
        var userInput = document.getElementById("newBarcode").value;
        return userInput;
    };

    //Remove barcode when delete button is clicked
    function removeBarcode(barcodeId) {
    var barcode = document.getElementById(barcodeId);
    barcode.parentNode.removeChild(barcode);
    };

    //remembers if the banner is open or closed on page reload
    dropdown.style.display = (bannerState === "block") ? "block" : "none";
    keycodes.style.display = (keycodesVisible === "flex") ? "flex" : "none";
    (bannerState === 'none') ? resetMargins() : updateMargins();

    // Show/Hide the banner on button click
    bannerButton.addEventListener('click', function() {
        if (dropdown.style.display === 'none') {
            dropdown.style.display = 'block';
            keycodes.style.display = 'flex';
            bannerState = 'block';
            keycodesVisible = 'flex';
            GM_setValue("canSeeBanner", bannerState);
            GM_setValue("canSeeKeycodes", keycodesVisible);
            if (dropdown.getAttribute('class') === 'flipSBL') {
                shiftRight();
            } else {
                shiftLeft();
            }
        } else {
            dropdown.style.display = 'none';
            keycodes.style.display = 'none';
            bannerState = 'none';
            resetMargins();
            GM_setValue("canSeeBanner", bannerState);
            keycodesVisible = 'none';
            GM_setValue("canSeeKeycodes", keycodesVisible);
        }
    });

    //clear locally saved barcodes
    clearAllButton.addEventListener('click', function() {
        let conDelete = confirm('Delete all barcodes?');
        if (conDelete) {
        //reset array to empty
            barcodes = [];
            blurState = []
            altNames = {};
            spacedOut = [];
        //remove all local storage keys and their values
            ///*
            GM_listValues().forEach(function(key) {
                GM_deleteValue(key);
            })
            //*/
            //remove all storage but saved barcodes object and alternate names
            //GM_deleteValue('canSeeBanner');
            //GM_deleteValue('canSeeKeycodes');
            //GM_deleteValue('nameChanges');
            //GM_deleteValue('savedArray');
            //GM_deleteValue('bluredCodes');
        // Select all barcodes in the banner
            var barBoxes = document.querySelectorAll('[id*="barBox-"]');
        // remove barcodes from banner
            barBoxes.forEach(function(box) {
                removeBarcode(box.getAttribute("id"));
            });
        } else console.log('User cancelled action');
    });

    //generates barcode upon enter keypress and resets input field
    var listenForEnter = document.getElementById("newBarcode");
    listenForEnter.addEventListener('keydown', function(event) {
    if (event.key === 'Enter' && this.value !== "") {
      // do something when enter key is pressed
      addBarcode(saveInput());
      incrementCounter();
      //clear input box
      this.value="";
    }
    });

    // Get all elements with the class 'barcode-svg'
    let barcodeElements = document.getElementsByClassName('barcode-svg');
    // Create a click listener for each barcode element
    Array.from(barcodeElements).forEach(element => {
       element.addEventListener('click', handleClick);
    });
     // Click event handler
        function handleClick(event) {
            GM_setValue('bluredCodes', blurState);
    }
    document.addEventListener('click', function(event) {
        if (event.ctrlKey || event.metaKey) {
            //option for disabling ctrl click functionality when banner is hidden
            if (bannerState !== 'none') {
                event.preventDefault();
                let nothingHappened = barcodes.length;
                addBarcode(event.target.innerHTML);
                if (barcodes.length !== nothingHappened) {
                    incrementCounter();
                    console.log('counter updated');
                }
            }
        }
    });

    function incrementCounter() {
        fetch('https://seanbrauer.com/labelsaved', {
            method: 'GET'
        })
    }
})();